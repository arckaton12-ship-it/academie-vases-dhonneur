-- =====================================================
-- Académie Vases d'Honneur — correctif 002
-- 1) Corrige la récursion infinie RLS (policy admin)
-- 2) Crée les tables manquantes + leurs policies
-- =====================================================

-- ---- 1. Fonction helper non récursive (security definer) ----
create or replace function public.is_admin_or_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('ADMINISTRATEUR', 'MODERATEUR')
  );
$$;

-- ---- 2. Corrige les policies récursives ----
drop policy if exists "admin full access profiles" on profiles;
drop policy if exists "admin full access courses" on courses;
drop policy if exists "admin full access assignments" on assignments;
drop policy if exists "admin full access submissions" on submissions;

create policy "admin full access profiles" on profiles for all using (public.is_admin_or_moderator());
create policy "admin full access courses" on courses for all using (public.is_admin_or_moderator());
create policy "admin full access assignments" on assignments for all using (public.is_admin_or_moderator());
create policy "admin full access submissions" on submissions for all using (public.is_admin_or_moderator());

-- ---- 3. Tables manquantes ----
create table if not exists service_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  group_name text,
  service_days integer default 0,
  service_note numeric(4,2),
  mission_description text,
  updated_at timestamptz default now()
);

create table if not exists streaks (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  consecutive_weeks integer not null default 1,
  unique (student_id, week_start)
);

create table if not exists badges (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz default now(),
  unique (student_id, badge_type)
);

create table if not exists certificates (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  cycle integer not null,
  issued_at timestamptz default now(),
  unique (student_id, cycle)
);

-- ---- 4. RLS + policies pour les nouvelles tables ----
alter table service_records enable row level security;
alter table streaks enable row level security;
alter table badges enable row level security;
alter table certificates enable row level security;

drop policy if exists "self read service" on service_records;
drop policy if exists "self read streaks" on streaks;
drop policy if exists "self read badges" on badges;
drop policy if exists "self read certificates" on certificates;
drop policy if exists "admin full access service" on service_records;
drop policy if exists "admin full access streaks" on streaks;
drop policy if exists "admin full access badges" on badges;
drop policy if exists "admin full access certificates" on certificates;

create policy "self read service" on service_records for select using (auth.uid() = student_id);
create policy "self read streaks" on streaks for select using (auth.uid() = student_id);
create policy "self read badges" on badges for select using (auth.uid() = student_id);
create policy "self read certificates" on certificates for select using (auth.uid() = student_id);

create policy "admin full access service" on service_records for all using (public.is_admin_or_moderator());
create policy "admin full access streaks" on streaks for all using (public.is_admin_or_moderator());
create policy "admin full access badges" on badges for all using (public.is_admin_or_moderator());
create policy "admin full access certificates" on certificates for all using (public.is_admin_or_moderator());
