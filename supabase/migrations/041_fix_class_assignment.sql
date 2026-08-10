-- Fix: submit_registration now maps class_name → class_id and updates profiles.class_id
-- Also backfills existing students who have class_name but no class_id

-- ---- 1. Fix submit_registration RPC ----
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
  v_class_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  if not p_commitment then
    raise exception 'L''engagement est obligatoire';
  end if;

  -- Map class_name to class_id
  if p_class_name is not null and p_class_name != '' then
    select id into v_class_id
    from public.classes
    where lower(name) = lower(p_class_name)
    limit 1;
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

  -- Update profiles with class_id, tribe, department, name
  update public.profiles
  set tribe = coalesce(p_tribe, tribe),
      department = coalesce(p_service_department, department),
      first_name = coalesce(p_first_name, first_name),
      last_name = coalesce(p_last_name, last_name),
      class_id = coalesce(v_class_id, class_id)
  where id = v_user_id;

  return jsonb_build_object('success', true, 'message', 'Inscription enregistrée');
end;
$$;

-- ---- 2. Backfill existing students ----
-- Match class_name text to classes.name and set profiles.class_id
update public.profiles p
set class_id = c.id
from public.academy_registrations ar
join public.classes c on lower(c.name) = lower(ar.class_name)
where ar.student_id = p.id
  and p.class_id is null
  and ar.class_name is not null
  and ar.class_name != '';
