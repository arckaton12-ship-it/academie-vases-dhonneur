-- =====================================================
-- Académie Vases d'Honneur — migration 010 : gestion des modérateurs
-- 1) Helpers RLS (admin vs modérateur, scoping par classe)
-- 2) Tables many-to-many : moderator_classes, moderator_schedules
-- 3) Réécriture des policies : un modérateur ne voit que ses classes
-- =====================================================

-- ---- 1. Helpers non récursifs (security definer) ----
drop function if exists public.is_admin();
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'ADMINISTRATEUR'
  );
$$;

drop function if exists public.is_moderator();
create or replace function public.is_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'MODERATEUR'
  );
$$;

-- ---- 2. Tables many-to-many ----
create table if not exists moderator_classes (
  id uuid primary key default uuid_generate_v4(),
  moderator_id uuid not null references profiles(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  unique (moderator_id, class_id)
);

create table if not exists moderator_schedules (
  id uuid primary key default uuid_generate_v4(),
  moderator_id uuid not null references profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz default now(),
  check (start_time < end_time)
);

alter table moderator_classes enable row level security;
alter table moderator_schedules enable row level security;

-- Un modérateur ne peut NI s'attribuer des classes ni lire les attributions
-- des autres : l'administrateur seul gère les attributions.
drop policy if exists "admin full access moderator_classes" on moderator_classes;
drop policy if exists "moderator read own classes" on moderator_classes;
drop policy if exists "self read moderator_classes" on moderator_classes;
create policy "admin full access moderator_classes" on moderator_classes
  for all using (public.is_admin());
create policy "moderator read own classes" on moderator_classes
  for select using (auth.uid() = moderator_id);

-- Planning : l'admin gère tout, le modérateur gère son propre planning.
drop policy if exists "admin full access moderator_schedules" on moderator_schedules;
drop policy if exists "self read moderator_schedules" on moderator_schedules;
drop policy if exists "self insert moderator_schedules" on moderator_schedules;
drop policy if exists "self update moderator_schedules" on moderator_schedules;
drop policy if exists "self delete moderator_schedules" on moderator_schedules;
create policy "admin full access moderator_schedules" on moderator_schedules
  for all using (public.is_admin());
create policy "self read moderator_schedules" on moderator_schedules
  for select using (auth.uid() = moderator_id);
create policy "self insert moderator_schedules" on moderator_schedules
  for insert with check (auth.uid() = moderator_id);
create policy "self update moderator_schedules" on moderator_schedules
  for update using (auth.uid() = moderator_id);
create policy "self delete moderator_schedules" on moderator_schedules
  for delete using (auth.uid() = moderator_id);

-- ---- 3. Helpers scopés (dépendent de moderator_classes) ----
create or replace function public.moderator_manages_class(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or exists (
    select 1 from moderator_classes mc
    where mc.moderator_id = auth.uid() and mc.class_id = p_class_id
  );
$$;

create or replace function public.moderator_can_access_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or exists (
    select 1 from profiles s
    where s.id = p_student_id
      and exists (
        select 1 from moderator_classes mc
        where mc.moderator_id = auth.uid() and mc.class_id = s.class_id
      )
  );
$$;

-- ---- 4. Profiles : l'étudiant ne voit que lui-même ; le modérateur
-- voit les étudiants de SES classes (plus la liste des modérateurs) ; l'admin tout ----
drop policy if exists "authenticated read profiles" on profiles;
drop policy if exists "admin full access profiles" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Admins can insert any profile" on profiles;
drop policy if exists "Admins can update any profile" on profiles;
drop policy if exists "Admins can delete any profile" on profiles;

create policy "self read profile" on profiles
  for select using (auth.uid() = id);
create policy "admin full access profiles" on profiles
  for all using (public.is_admin());
create policy "moderator read profiles" on profiles
  for select using (
    public.is_moderator()
    and (
      auth.uid() = id
      or (role = 'ETUDIANT' and public.moderator_can_access_student(id))
      or role = 'MODERATEUR'
    )
  );
create policy "moderator update profiles" on profiles
  for update using (
    public.is_moderator()
    and role = 'ETUDIANT'
    and public.moderator_can_access_student(id)
  );

-- ---- 4. Classes : lecture authentifiée, gestion admin seul ----
drop policy if exists "Admins can view all classes" on classes;
drop policy if exists "Admins can insert classes" on classes;
drop policy if exists "Admins can update classes" on classes;
drop policy if exists "Admins can delete classes" on classes;
create policy "admin manage classes" on classes
  for all using (public.is_admin());

-- ---- 5. Courses : étudiant = sa classe ; modérateur = ses classes ; admin tout ----
drop policy if exists "authenticated read courses" on courses;
drop policy if exists "admin full access courses" on courses;
drop policy if exists "Admins can view all courses" on courses;
drop policy if exists "Admins can insert courses" on courses;
drop policy if exists "Admins can update courses" on courses;
drop policy if exists "Admins can delete courses" on courses;

create policy "student read courses" on courses
  for select using (
    class_id = (select class_id from profiles where id = auth.uid())
  );
create policy "moderator read courses" on courses
  for select using (public.moderator_manages_class(class_id));
create policy "moderator insert courses" on courses
  for insert with check (public.moderator_manages_class(class_id));
create policy "moderator update courses" on courses
  for update using (public.moderator_manages_class(class_id))
  with check (public.moderator_manages_class(class_id));
create policy "moderator delete courses" on courses
  for delete using (public.moderator_manages_class(class_id));

-- ---- 6. Assignments : étudiants = leurs cours ; modérateurs = leurs classes ----
drop policy if exists "authenticated read assignments" on assignments;
drop policy if exists "admin full access assignments" on assignments;

create policy "student read assignments" on assignments
  for select using (
    exists (
      select 1 from courses c
      where c.id = assignments.course_id
        and c.class_id = (select class_id from profiles where id = auth.uid())
    )
  );
create policy "moderator manage assignments" on assignments
  for all using (
    public.is_admin()
    or exists (
      select 1 from courses c
      join moderator_classes mc on mc.class_id = c.class_id
      where c.id = assignments.course_id and mc.moderator_id = auth.uid()
    )
  );

-- ---- 7. Submissions : modérateur limité aux devoirs de ses classes ----
drop policy if exists "admin full access submissions" on submissions;

create policy "moderator read submissions" on submissions
  for select using (
    public.is_admin()
    or exists (
      select 1 from assignments a
      join courses c on c.id = a.course_id
      join moderator_classes mc on mc.class_id = c.class_id
      where a.id = submissions.assignment_id and mc.moderator_id = auth.uid()
    )
  );
create policy "moderator grade submissions" on submissions
  for update using (
    public.is_admin()
    or exists (
      select 1 from assignments a
      join courses c on c.id = a.course_id
      join moderator_classes mc on mc.class_id = c.class_id
      where a.id = submissions.assignment_id and mc.moderator_id = auth.uid()
    )
  );

-- ---- 8. Données étudiantes : modérateur en lecture sur ses classes ----
drop policy if exists "admin full access resumes" on resumes;
drop policy if exists "admin full access attendances" on attendances;
drop policy if exists "admin full access streaks" on streaks;
drop policy if exists "admin full access badges" on badges;
drop policy if exists "admin full access certificates" on certificates;
drop policy if exists "admin full access service" on service_records;

create policy "admin full access resumes" on resumes for all using (public.is_admin());
create policy "admin full access attendances" on attendances for all using (public.is_admin());
create policy "admin full access streaks" on streaks for all using (public.is_admin());
create policy "admin full access badges" on badges for all using (public.is_admin());
create policy "admin full access certificates" on certificates for all using (public.is_admin());
create policy "admin full access service" on service_records for all using (public.is_admin());

create policy "moderator read resumes" on resumes for select using (public.moderator_can_access_student(student_id));
create policy "moderator read attendances" on attendances for select using (public.moderator_can_access_student(student_id));
create policy "moderator read streaks" on streaks for select using (public.moderator_can_access_student(student_id));
create policy "moderator read badges" on badges for select using (public.moderator_can_access_student(student_id));
create policy "moderator read certificates" on certificates for select using (public.moderator_can_access_student(student_id));
create policy "moderator read service" on service_records for select using (public.moderator_can_access_student(student_id));

-- ---- 9. Storage « devoirs » : modérateur limité aux dossiers de ses classes ----
drop policy if exists "Moderator manage devoirs" on storage.objects;
create policy "Moderator manage devoirs" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'devoirs'
    and public.moderator_can_access_student(((storage.foldername(name))[1])::uuid)
  );
