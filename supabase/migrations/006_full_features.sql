-- =====================================================
-- Académie Vases d'Honneur — migration 006 : complétude
-- Résumés, présence, bucket « devoirs », révocation d'accès,
-- policies d'écriture pour l'étudiant (profil, service, soumissions)
-- =====================================================

-- ---- 1. Colonne active (révocation d'accès par l'admin) ----
alter table profiles add column if not exists active boolean not null default true;

-- ---- 2. Résumés de cours (un par étudiant + cours) ----
create table if not exists resumes (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz default now(),
  unique (student_id, course_id)
);

-- ---- 3. Présence (un passage par étudiant + cours) ----
create table if not exists attendances (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  attended_at timestamptz default now(),
  unique (student_id, course_id)
);

-- ---- 4. RLS nouvelles tables ----
alter table resumes enable row level security;
alter table attendances enable row level security;

drop policy if exists "self read resumes" on resumes;
drop policy if exists "self upsert resumes" on resumes;
drop policy if exists "admin full access resumes" on resumes;
drop policy if exists "self read attendances" on attendances;
drop policy if exists "self upsert attendances" on attendances;
drop policy if exists "admin full access attendances" on attendances;

create policy "self read resumes" on resumes for select using (auth.uid() = student_id);
create policy "self upsert resumes" on resumes for insert with check (auth.uid() = student_id);
create policy "self update resumes" on resumes for update using (auth.uid() = student_id);
create policy "admin full access resumes" on resumes for all using (public.is_admin_or_moderator());

create policy "self read attendances" on attendances for select using (auth.uid() = student_id);
create policy "self upsert attendances" on attendances for insert with check (auth.uid() = student_id);
create policy "self update attendances" on attendances for update using (auth.uid() = student_id);
create policy "admin full access attendances" on attendances for all using (public.is_admin_or_moderator());

-- ---- 5. Étudiant : modifier ses soumissions (renvoyer un devoir) ----
drop policy if exists "self update submissions" on submissions;
create policy "self update submissions" on submissions
  for update using (auth.uid() = student_id);

-- ---- 6. Étudiant : lire/créer/mettre à jour sa fiche service ----
drop policy if exists "self upsert service" on service_records;
drop policy if exists "self update service" on service_records;
create policy "self upsert service" on service_records for insert with check (auth.uid() = student_id);
create policy "self update service" on service_records for update using (auth.uid() = student_id);

-- ---- 7. Étudiant : lire les devoirs d'une classe (par son appartenance) ----
-- (les devoirs sont lus via les cours de la classe : policy existante courses/assignments)

-- ---- 8. Bucket Storage « devoirs » (rendus d'élèves) ----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('devoirs', 'devoirs', true, 10485760, array['image/*', 'application/pdf', 'audio/*', 'video/*'])
on conflict (id) do nothing;

drop policy if exists "Read devoirs" on storage.objects;
drop policy if exists "Upload own devoir" on storage.objects;
drop policy if exists "Update own devoir" on storage.objects;
drop policy if exists "Delete own devoir" on storage.objects;
drop policy if exists "Moderator manage devoirs" on storage.objects;

create policy "Read devoirs" on storage.objects
  for select to authenticated
  using (bucket_id = 'devoirs');

create policy "Upload own devoir" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'devoirs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Update own devoir" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'devoirs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Delete own devoir" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'devoirs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Moderator manage devoirs" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'devoirs'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('ADMINISTRATEUR', 'MODERATEUR')
    )
  );
