-- =====================================================
-- Académie Vases d'Honneur — migration 013 : durcissement des writes RLS
-- 1) WITH CHECK explicite sur les policies UPDATE qui n'en avaient pas.
-- 2) Un étudiant ne peut JAMAIS modifier role / class_id / active / meditation_grade de son profil.
-- 3) Un modérateur ne peut modifier que les champs d'un étudiant de sa classe, jamais role/class_id.
-- 4) Un étudiant ne peut pas modifier sa note ni son feedback, ni gonfler streak/badges/présence/service_note.
-- 5) Passage de classe uniquement via la fonction dédiée advance_student (security definer).
-- =====================================================

-- -----------------------------------------------------
-- Helpers (security definer : lecture des valeurs stockées hors RLS)
-- -----------------------------------------------------

create or replace function public.profile_self_fields_unchanged(
  p_id uuid,
  p_role public.user_role,
  p_class_id uuid,
  p_active boolean,
  p_meditation_grade numeric
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_id
      and p.role is not distinct from p_role
      and p.class_id is not distinct from p_class_id
      and p.active is not distinct from p_active
      and p.meditation_grade is not distinct from p_meditation_grade
  );
$$;

create or replace function public.submission_grade_unchanged(
  p_id uuid,
  p_grade numeric,
  p_feedback text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.submissions s
    where s.id = p_id
      and s.grade is not distinct from p_grade
      and s.feedback is not distinct from p_feedback
  );
$$;

create or replace function public.submission_student_unchanged(
  p_id uuid,
  p_student_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.submissions s
    where s.id = p_id
      and s.student_id is not distinct from p_student_id
  );
$$;

create or replace function public.streak_weeks_unchanged(
  p_id uuid,
  p_consecutive integer
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.streaks s
    where s.id = p_id
      and s.consecutive_weeks is not distinct from p_consecutive
  );
$$;

create or replace function public.badge_type_unchanged(
  p_id uuid,
  p_badge_type text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.badges b
    where b.id = p_id
      and b.badge_type is not distinct from p_badge_type
  );
$$;

create or replace function public.attendance_row_unchanged(
  p_id uuid,
  p_course_id uuid,
  p_attended_at timestamptz
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.attendances a
    where a.id = p_id
      and a.course_id is not distinct from p_course_id
      and a.attended_at is not distinct from p_attended_at
  );
$$;

create or replace function public.service_note_unchanged(
  p_id uuid,
  p_service_note numeric
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.service_records s
    where s.id = p_id
      and s.service_note is not distinct from p_service_note
  );
$$;

-- -----------------------------------------------------
-- profiles : self update (bloquer role/class_id/active/meditation_grade)
-- -----------------------------------------------------
drop policy if exists "self update profile" on public.profiles;
create policy "self update profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and public.profile_self_fields_unchanged(id, role, class_id, active, meditation_grade)
  );

-- -----------------------------------------------------
-- profiles : moderator update (jamais de changement de rôle ou de classe)
-- -----------------------------------------------------
drop policy if exists "moderator update profiles" on public.profiles;
create policy "moderator update profiles" on public.profiles
  for update
  using (
    public.is_moderator()
    and (role = 'ETUDIANT')
    and public.moderator_can_access_student(id)
  )
  with check (
    public.is_moderator()
    and (role = 'ETUDIANT')
    and public.moderator_can_access_student(id)
    and public.profile_self_fields_unchanged(id, role, class_id, active, meditation_grade)
  );

-- -----------------------------------------------------
-- submissions : l'étudiant ne modifie pas note/feedback ; le modérateur ne déplace pas une soumission
-- -----------------------------------------------------
drop policy if exists "self update submissions" on public.submissions;
create policy "self update submissions" on public.submissions
  for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and public.submission_grade_unchanged(id, grade, feedback)
  );

drop policy if exists "moderator grade submissions" on public.submissions;
create policy "moderator grade submissions" on public.submissions
  for update
  using (
    public.is_admin()
    or exists (
      select 1
      from public.assignments a
      join public.courses c on c.id = a.course_id
      join public.moderator_classes mc on mc.class_id = c.class_id
      where a.id = submissions.assignment_id
        and mc.moderator_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or (
      exists (
        select 1
        from public.assignments a
        join public.courses c on c.id = a.course_id
        join public.moderator_classes mc on mc.class_id = c.class_id
        where a.id = submissions.assignment_id
          and mc.moderator_id = auth.uid()
      )
      and public.submission_student_unchanged(id, student_id)
    )
  );

-- -----------------------------------------------------
-- streaks / badges / attendances : pas de fraude sur les métriques
-- -----------------------------------------------------
drop policy if exists "self update streaks" on public.streaks;
create policy "self update streaks" on public.streaks
  for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and public.streak_weeks_unchanged(id, consecutive_weeks)
  );

drop policy if exists "self update badges" on public.badges;
create policy "self update badges" on public.badges
  for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and public.badge_type_unchanged(id, badge_type)
  );

drop policy if exists "self update attendances" on public.attendances;
create policy "self update attendances" on public.attendances
  for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and public.attendance_row_unchanged(id, course_id, attended_at)
  );

-- -----------------------------------------------------
-- service_records : l'étudiant ne peut pas écrire sa propre note de service
-- -----------------------------------------------------
drop policy if exists "self update service" on public.service_records;
create policy "self update service" on public.service_records
  for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and public.service_note_unchanged(id, service_note)
  );

-- -----------------------------------------------------
-- Passage de classe : fonction dédiée (admin ou modérateur de la classe)
-- -----------------------------------------------------
create or replace function public.advance_student(
  p_student_id uuid,
  p_new_class_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_old_level int;
  v_new_level int;
begin
  if not (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(p_student_id))
  ) then
    raise exception 'Accès refusé : seul un administrateur ou le modérateur de la classe peut faire passer un étudiant.';
  end if;

  select c.level into v_old_level
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  where p.id = p_student_id;

  select c.level into v_new_level
  from public.classes c
  where c.id = p_new_class_id;

  if v_new_level is null then
    raise exception 'Classe cible introuvable.';
  end if;

  update public.profiles
  set class_id = p_new_class_id
  where id = p_student_id;

  if v_old_level is not null and v_new_level > v_old_level then
    if not exists (
      select 1 from public.certificates
      where student_id = p_student_id and cycle = v_old_level
    ) then
      insert into public.certificates (student_id, cycle)
      values (p_student_id, v_old_level);
    end if;
  end if;
end;
$$;

revoke execute on function public.advance_student(uuid, uuid) from public;
revoke execute on function public.advance_student(uuid, uuid) from anon;
grant execute on function public.advance_student(uuid, uuid) to authenticated;
