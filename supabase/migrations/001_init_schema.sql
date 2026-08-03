-- =====================================================
-- Académie Vases d'Honneur — schéma initial
-- =====================================================
create extension if not exists "uuid-ossp";

create type user_role as enum ('ETUDIANT', 'MODERATEUR', 'ADMINISTRATEUR');

-- ---- Classes (créée en premier : profiles en dépend) ----
create table classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  level integer not null unique,
  created_at timestamptz default now()
);

-- ---- Profils ----
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text,
  first_name text not null,
  last_name text not null,
  tribe text,
  department text,
  avatar_url text,
  role user_role not null default 'ETUDIANT',
  class_id uuid references classes(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---- Cours ----
create table courses (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references classes(id) on delete cascade,
  title text not null,
  week integer not null,
  audio_url text,
  video_url text,
  description text,
  created_at timestamptz default now()
);

-- ---- Devoirs / exercices ----
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  description text not null,
  due_date timestamptz,
  type text check (type in ('DEVOIR', 'EXERCICE')) not null default 'EXERCICE',
  created_at timestamptz default now()
);

-- ---- Soumissions ----
create table submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  content text,
  file_url text,
  submitted_at timestamptz default now(),
  grade numeric(4,2),
  feedback text
);

-- ---- Service ----
create table service_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  group_name text,
  service_days integer default 0,
  service_note numeric(4,2),
  mission_description text,
  updated_at timestamptz default now()
);

-- ---- Streak ----
create table streaks (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  consecutive_weeks integer not null default 1,
  unique (student_id, week_start)
);

-- ---- Badges ----
create table badges (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz default now(),
  unique (student_id, badge_type)
);

-- ---- Certificats ----
create table certificates (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  cycle integer not null,
  issued_at timestamptz default now(),
  unique (student_id, cycle)
);

-- ---- Classes de base ----
insert into classes (name, level) values
  ('Classe 1', 1),
  ('Classe 2', 2),
  ('Classe 3', 3);

-- =====================================================
-- RLS — version simple pour le MVP (à affiner ensuite)
-- =====================================================
alter table profiles enable row level security;
alter table classes enable row level security;
alter table courses enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table service_records enable row level security;
alter table streaks enable row level security;
alter table badges enable row level security;
alter table certificates enable row level security;

-- Tout utilisateur authentifié peut lire ; on affinera par rôle plus tard.
create policy "authenticated read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "self insert profile" on profiles for insert with check (auth.uid() = id);
create policy "self update profile" on profiles for update using (auth.uid() = id);

create policy "authenticated read classes" on classes for select using (auth.role() = 'authenticated');
create policy "authenticated read courses" on courses for select using (auth.role() = 'authenticated');
create policy "authenticated read assignments" on assignments for select using (auth.role() = 'authenticated');

create policy "self read submissions" on submissions for select using (auth.uid() = student_id);
create policy "self insert submissions" on submissions for insert with check (auth.uid() = student_id);

create policy "self read service" on service_records for select using (auth.uid() = student_id);
create policy "self read streaks" on streaks for select using (auth.uid() = student_id);
create policy "self read badges" on badges for select using (auth.uid() = student_id);
create policy "self read certificates" on certificates for select using (auth.uid() = student_id);

-- ---- Helper admin/modérateur (security definer, évite la récursion RLS) ----
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

-- Administrateurs : accès total sur tout (utilisé pour les écrans admin/modérateur).
create policy "admin full access profiles" on profiles for all using (public.is_admin_or_moderator());
create policy "admin full access courses" on courses for all using (public.is_admin_or_moderator());
create policy "admin full access assignments" on assignments for all using (public.is_admin_or_moderator());
create policy "admin full access submissions" on submissions for all using (public.is_admin_or_moderator());
