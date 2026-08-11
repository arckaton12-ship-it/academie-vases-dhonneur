-- Section 10: must_change_password flag + admin_create_user sets it for moderators

-- 1. Add column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- 2. Drop and recreate admin_create_user with must_change_password for moderators
DROP FUNCTION IF EXISTS public.admin_create_user(text,text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role text default 'ETUDIANT',
  p_phone text default null,
  p_tribe text default null,
  p_department text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_new_user_id uuid;
begin
  v_admin_id := auth.uid();
  if v_admin_id is null then
    raise exception 'Non authentifié';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_admin_id and role = 'ADMINISTRATEUR'
  ) then
    raise exception 'Accès réservé aux administrateurs';
  end if;

  -- Create profile with must_change_password for moderators
  insert into public.profiles (
    id, email, first_name, last_name, role, phone, tribe, department, must_change_password
  ) values (
    gen_random_uuid(), p_email, p_first_name, p_last_name, p_role::user_role,
    p_phone, p_tribe, p_department,
    case when p_role = 'MODERATEUR' then true else false end
  )
  returning id into v_new_user_id;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_new_user_id,
    'must_change_password', p_role = 'MODERATEUR'
  );
end;
$$;
