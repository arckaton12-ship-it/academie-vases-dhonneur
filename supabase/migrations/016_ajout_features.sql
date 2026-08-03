-- =====================================================
-- Académie Vases d'Honneur — migration 016 : bloc AJOUT
-- 1) Badge actif sur l'avatar (profiles.active_badge)
-- 2) Correction/notation des résumés de cours (resumes.grade/feedback)
-- 3) Réflexion de clôture (closing_reflections) + notifications in-app
-- 4) Webhook d'administration générique (admin_webhook + pg_net)
-- 5) Notes manuscrites : bucket « notes-manuscrites » + type de soumission
-- 6) Salle des badges : progression en temps réel (get_badge_progress)
-- =====================================================

-- -----------------------------------------------------
-- 1. Badge actif sur l'avatar
-- -----------------------------------------------------
alter table public.profiles add column if not exists active_badge text;
alter table public.profiles drop constraint if exists profiles_active_badge_check;
alter table public.profiles add constraint profiles_active_badge_check check (
  active_badge is null
  or active_badge in (
    'premiere-semaine', 'premier-mois', 'assidu-huit',
    'cinq-resumes', 'dix-resumes', 'cycle-1', 'cycle-2', 'cycle-3'
  )
);

-- -----------------------------------------------------
-- 2. Résumés : correction + notation par le modérateur
-- -----------------------------------------------------
alter table public.resumes add column if not exists grade numeric;
alter table public.resumes add column if not exists feedback text;
alter table public.resumes drop constraint if exists resumes_grade_range;
alter table public.resumes add constraint resumes_grade_range check (
  grade is null or (grade >= 0 and grade <= 20)
);

-- L'étudiant ne peut JAMAIS modifier sa propre note ni son feedback
create or replace function public.resume_grade_unchanged(
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
    select 1 from public.resumes r
    where r.id = p_id
      and r.grade is not distinct from p_grade
      and r.feedback is not distinct from p_feedback
  );
$$;

drop policy if exists "self update resumes" on public.resumes;
create policy "self update resumes" on public.resumes
  for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and public.resume_grade_unchanged(id, grade, feedback)
  );

-- Le modérateur corrige les résumés des étudiants de SES classes
drop policy if exists "moderator grade resumes" on public.resumes;
create policy "moderator grade resumes" on public.resumes
  for update
  using (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(student_id))
  );

-- -----------------------------------------------------
-- 3. Soumissions : type « notes » (notes manuscrites)
-- -----------------------------------------------------
alter table public.submissions add column if not exists type text not null default 'devoir';
alter table public.submissions drop constraint if exists submissions_type_check;
alter table public.submissions add constraint submissions_type_check check (type in ('devoir', 'notes'));
alter table public.submissions add column if not exists attachments text[] not null default '{}';
alter table public.submissions add column if not exists course_id uuid references public.courses(id) on delete cascade;

-- Le modérateur voit et note les soumissions (devoirs OU notes) des étudiants de SES classes.
drop policy if exists "moderator read submissions" on public.submissions;
create policy "moderator read submissions" on public.submissions
  for select using (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(student_id))
  );

drop policy if exists "moderator grade submissions" on public.submissions;
create policy "moderator grade submissions" on public.submissions
  for update using (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(student_id))
  )
  with check (
    public.is_admin()
    or (
      public.is_moderator()
      and public.moderator_can_access_student(student_id)
      and public.submission_student_unchanged(id, student_id)
    )
  );

-- -----------------------------------------------------
-- 4. Réflexion de clôture
-- -----------------------------------------------------
create table if not exists public.closing_reflections (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  content text not null default '',
  invited_at timestamptz default now(),
  answered_at timestamptz,
  updated_at timestamptz default now(),
  unique (student_id, course_id)
);

alter table public.closing_reflections enable row level security;

drop policy if exists "self read closing reflections" on public.closing_reflections;
drop policy if exists "self upsert closing reflections" on public.closing_reflections;
drop policy if exists "self update closing reflections" on public.closing_reflections;
drop policy if exists "staff access closing reflections" on public.closing_reflections;

create policy "self read closing reflections" on public.closing_reflections
  for select using (auth.uid() = student_id);
create policy "self upsert closing reflections" on public.closing_reflections
  for insert with check (auth.uid() = student_id);
create policy "self update closing reflections" on public.closing_reflections
  for update using (auth.uid() = student_id);
create policy "staff access closing reflections" on public.closing_reflections
  for all using (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(student_id))
  );

-- -----------------------------------------------------
-- 5. Notifications in-app
-- -----------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null default '',
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "self read notifications" on public.notifications;
drop policy if exists "self mark read notifications" on public.notifications;
drop policy if exists "staff manage notifications" on public.notifications;

create policy "self read notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "self mark read notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "staff manage notifications" on public.notifications
  for all using (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(user_id))
  );

-- -----------------------------------------------------
-- 6. Webhook d'administration (URL configurable)
-- -----------------------------------------------------
create table if not exists public.admin_webhook (
  id boolean primary key default true,
  url text,
  active boolean not null default false,
  updated_at timestamptz default now()
);

insert into public.admin_webhook (id, active) values (true, false)
on conflict (id) do nothing;

alter table public.admin_webhook enable row level security;

drop policy if exists "admin manage webhook" on public.admin_webhook;
create policy "admin manage webhook" on public.admin_webhook
  for all using (public.is_admin());

-- Envoi d'événements (pg_net)
create extension if not exists pg_net with schema extensions;

create or replace function public.webhook_fire(p_type text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_active boolean;
begin
  select url, active into v_url, v_active
  from public.admin_webhook
  where id = true;
  if not coalesce(v_active, false) or coalesce(v_url, '') = '' then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('event', p_type, 'payload', p_payload, 'sent_at', now()),
    params := null,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );
end;
$$;

-- Événement : inscription d'un compte
create or replace function public.profile_created_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.webhook_fire('user.created', jsonb_build_object(
    'user_id', new.id,
    'email', new.email,
    'first_name', new.first_name,
    'last_name', new.last_name,
    'role', new.role
  ));
  return new;
end;
$$;

drop trigger if exists profile_created_webhook on public.profiles;
create trigger profile_created_webhook
after insert on public.profiles
for each row execute function public.profile_created_trigger();

-- Événement : badge obtenu
create or replace function public.badge_earned_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.webhook_fire('badge.earned', jsonb_build_object(
    'student_id', new.student_id,
    'badge_type', new.badge_type,
    'earned_at', new.earned_at
  ));
  return new;
end;
$$;

drop trigger if exists badge_earned_webhook on public.badges;
create trigger badge_earned_webhook
after insert on public.badges
for each row execute function public.badge_earned_trigger();

-- Événement : correction/notation d'un rendu (devoir ou notes)
create or replace function public.submission_graded_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.grade is not null and old.grade is null then
    insert into public.notifications (user_id, type, title, body)
    values (
      new.student_id,
      'correction',
      'Ton rendu a été corrigé',
      'Ta note et l’appréciation du modérateur sont disponibles.'
    );
    perform public.webhook_fire('grade.updated', jsonb_build_object(
      'submission_id', new.id,
      'student_id', new.student_id,
      'grade', new.grade,
      'feedback', new.feedback
    ));
  end if;
  return new;
end;
$$;

drop trigger if exists submission_graded_webhook on public.submissions;
create trigger submission_graded_webhook
after update of grade on public.submissions
for each row execute function public.submission_graded_trigger();

-- Événement : résumé corrigé et noté → invitation à la réflexion de clôture
create or replace function public.resume_graded_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reflection_id uuid;
begin
  if new.grade is not null and (old.grade is null or old.grade is distinct from new.grade) then
    insert into public.closing_reflections (student_id, course_id)
    values (new.student_id, new.course_id)
    on conflict (student_id, course_id) do nothing
    returning id into v_reflection_id;

    if v_reflection_id is not null then
      insert into public.notifications (user_id, type, title, body)
      values (
        new.student_id,
        'cloture',
        'Une session s’achève',
        'Ton résumé a été corrigé et noté. Que retiens-tu de cette session ?'
      );
    end if;

    perform public.webhook_fire('resume.graded', jsonb_build_object(
      'student_id', new.student_id,
      'course_id', new.course_id,
      'grade', new.grade,
      'feedback', new.feedback
    ));
  end if;
  return new;
end;
$$;

drop trigger if exists resume_graded_cloture on public.resumes;
create trigger resume_graded_cloture
after update of grade on public.resumes
for each row execute function public.resume_graded_trigger();

-- -----------------------------------------------------
-- 7. Bucket « notes-manuscrites » (images de notes écrites)
-- -----------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'notes-manuscrites',
  'notes-manuscrites',
  true,
  10485760,
  array['image/*', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "Read notes-manuscrites" on storage.objects;
drop policy if exists "Upload own note" on storage.objects;
drop policy if exists "Update own note" on storage.objects;
drop policy if exists "Delete own note" on storage.objects;
drop policy if exists "Moderator manage notes-manuscrites" on storage.objects;

create policy "Read notes-manuscrites" on storage.objects
  for select to authenticated
  using (bucket_id = 'notes-manuscrites');

create policy "Upload own note" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'notes-manuscrites'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Update own note" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'notes-manuscrites'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Delete own note" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'notes-manuscrites'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Moderator manage notes-manuscrites" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'notes-manuscrites'
    and public.moderator_can_access_student(((storage.foldername(name))[1])::uuid)
  );

-- -----------------------------------------------------
-- 8. Salle des badges : progression en temps réel
-- -----------------------------------------------------
create or replace function public.get_badge_progress()
returns table (
  badge_type text,
  earned boolean,
  earned_at timestamptz,
  current numeric,
  target numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with stats as (
    select
      coalesce((select max(s.consecutive_weeks) from public.streaks s where s.student_id = auth.uid()), 0) as max_streak,
      (select count(*) from public.resumes r where r.student_id = auth.uid()) as resume_count,
      exists (select 1 from public.attendances a where a.student_id = auth.uid()) as has_attendance
  ),
  bp as (
    select 'premiere-semaine'::text as badge_type, 1::numeric as target,
           case when has_attendance then 1 else 0 end::numeric as current
    from stats
    union all
    select 'premier-mois', 4, least(max_streak, 4) from stats
    union all
    select 'assidu-huit', 8, least(max_streak, 8) from stats
    union all
    select 'cinq-resumes', 5, least(resume_count, 5) from stats
    union all
    select 'dix-resumes', 10, least(resume_count, 10) from stats
    union all
    select 'cycle-1', 1,
      case when exists (
        select 1 from public.certificates c where c.student_id = auth.uid() and c.cycle = 1
      ) then 1 else 0 end::numeric
    from stats
    union all
    select 'cycle-2', 1,
      case when exists (
        select 1 from public.certificates c where c.student_id = auth.uid() and c.cycle = 2
      ) then 1 else 0 end::numeric
    from stats
    union all
    select 'cycle-3', 1,
      case when exists (
        select 1 from public.certificates c where c.student_id = auth.uid() and c.cycle = 3
      ) then 1 else 0 end::numeric
    from stats
  )
  select
    bp.badge_type,
    (b.student_id is not null) as earned,
    b.earned_at,
    bp.current,
    bp.target
  from bp
  left join public.badges b
    on b.student_id = auth.uid() and b.badge_type = bp.badge_type
  order by case bp.badge_type
    when 'premiere-semaine' then 1
    when 'premier-mois' then 2
    when 'assidu-huit' then 3
    when 'cinq-resumes' then 4
    when 'dix-resumes' then 5
    when 'cycle-1' then 6
    when 'cycle-2' then 7
    else 8
  end;
$$;

revoke execute on function public.get_badge_progress() from public;
revoke execute on function public.get_badge_progress() from anon;
grant execute on function public.get_badge_progress() to authenticated;

-- -----------------------------------------------------
-- 9. Rétroactivité : date d'obtention des badges existants
-- -----------------------------------------------------
update public.badges
set earned_at = coalesce(earned_at, now())
where earned_at is null;
