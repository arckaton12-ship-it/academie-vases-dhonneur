-- =====================================================
-- Académie Vases d'Honneur — migration 017 : inscription 2 étapes
-- 1) Table academy_registrations (29 champs)
-- 2) binome_id sur profiles
-- 3) RPC submit_registration pour l'étape 2
-- =====================================================

-- ---- 1. Table academy_registrations ----
create table if not exists public.academy_registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade unique,

  email text,
  last_name text,
  first_name text,
  photo_url text,
  phone_whatsapp text,
  phone_telegram text,
  emergency_contact text,
  sex text,
  class_name text,
  tshirt_size text,
  registration_date date default current_date,
  training_channel text,
  payment_mode text,
  profession text,
  neighborhood text,
  birth_date date,
  marital_status text,
  children_count integer default 0,
  baptized_immersion boolean default false,
  baptism_date date,
  conversion_date date,
  service_department text,
  tribe text,
  student_type text,
  french_reading_level text,
  french_listening_level text,
  french_writing_level text,
  commitment boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.academy_registrations enable row level security;

-- L'étudiant ne voit que sa propre inscription
create policy "registration_own_select" on public.academy_registrations
  for select using (auth.uid() = student_id);

-- L'étudiant ne peut insérer que la sienne
create policy "registration_own_insert" on public.academy_registrations
  for insert with check (auth.uid() = student_id);

-- L'étudiant ne peut modifier que la sienne
create policy "registration_own_update" on public.academy_registrations
  for update using (auth.uid() = student_id);

-- Le modérateur voit les inscriptions de ses classes
create policy "registration_moderator_select" on public.academy_registrations
  for select using (
    exists (
      select 1 from public.profiles p
      join public.moderator_classes mc on mc.class_id = p.class_id
      where mc.moderator_id = auth.uid()
      and p.id = academy_registrations.student_id
    )
  );

-- L'admin voit tout
create policy "registration_admin_all" on public.academy_registrations
  for all using (public.is_admin());

-- ---- 2. binome_id sur profiles ----
alter table public.profiles add column if not exists binome_id uuid references auth.users(id);

-- ---- 3. RPC submit_registration ----
create or replace function public.submit_registration(
  p_email text,
  p_last_name text,
  p_first_name text,
  p_photo_url text default null,
  p_phone_whatsapp text default null,
  p_phone_telegram text default null,
  p_emergency_contact text default null,
  p_sex text default null,
  p_class_name text default null,
  p_tshirt_size text default null,
  p_registration_date date default null,
  p_training_channel text default null,
  p_payment_mode text default null,
  p_profession text default null,
  p_neighborhood text default null,
  p_birth_date date default null,
  p_marital_status text default null,
  p_children_count integer default 0,
  p_baptized_immersion boolean default false,
  p_baptism_date date default null,
  p_conversion_date date default null,
  p_service_department text default null,
  p_tribe text default null,
  p_student_type text default null,
  p_french_reading_level text default null,
  p_french_listening_level text default null,
  p_french_writing_level text default null,
  p_commitment boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  if not p_commitment then
    raise exception 'L''engagement est obligatoire';
  end if;

  insert into public.academy_registrations (
    student_id, email, last_name, first_name, photo_url,
    phone_whatsapp, phone_telegram, emergency_contact, sex,
    class_name, tshirt_size, registration_date, training_channel,
    payment_mode, profession, neighborhood, birth_date, marital_status,
    children_count, baptized_immersion, baptism_date, conversion_date,
    service_department, tribe, student_type,
    french_reading_level, french_listening_level, french_writing_level,
    commitment
  ) values (
    v_user_id, p_email, p_last_name, p_first_name, p_photo_url,
    p_phone_whatsapp, p_phone_telegram, p_emergency_contact, p_sex,
    p_class_name, p_tshirt_size, coalesce(p_registration_date, current_date),
    p_training_channel, p_payment_mode, p_profession, p_neighborhood,
    p_birth_date, p_marital_status, p_children_count, p_baptized_immersion,
    p_baptism_date, p_conversion_date, p_service_department, p_tribe,
    p_student_type, p_french_reading_level, p_french_listening_level,
    p_french_writing_level, p_commitment
  )
  on conflict (student_id) do update set
    email = excluded.email,
    last_name = excluded.last_name,
    first_name = excluded.first_name,
    photo_url = excluded.photo_url,
    phone_whatsapp = excluded.phone_whatsapp,
    phone_telegram = excluded.phone_telegram,
    emergency_contact = excluded.emergency_contact,
    sex = excluded.sex,
    class_name = excluded.class_name,
    tshirt_size = excluded.tshirt_size,
    training_channel = excluded.training_channel,
    payment_mode = excluded.payment_mode,
    profession = excluded.profession,
    neighborhood = excluded.neighborhood,
    birth_date = excluded.birth_date,
    marital_status = excluded.marital_status,
    children_count = excluded.children_count,
    baptized_immersion = excluded.baptized_immersion,
    baptism_date = excluded.baptism_date,
    conversion_date = excluded.conversion_date,
    service_department = excluded.service_department,
    tribe = excluded.tribe,
    student_type = excluded.student_type,
    french_reading_level = excluded.french_reading_level,
    french_listening_level = excluded.french_listening_level,
    french_writing_level = excluded.french_writing_level,
    commitment = excluded.commitment,
    updated_at = now();

  update public.profiles
  set tribe = coalesce(p_tribe, tribe),
      department = coalesce(p_service_department, department),
      first_name = coalesce(p_first_name, first_name),
      last_name = coalesce(p_last_name, last_name)
  where id = v_user_id;

  return jsonb_build_object('success', true, 'message', 'Inscription enregistrée');
end;
$$;

-- ---- 4. Index ----
create index if not exists idx_academy_registrations_student on public.academy_registrations(student_id);
create index if not exists idx_profiles_binome on public.profiles(binome_id);
