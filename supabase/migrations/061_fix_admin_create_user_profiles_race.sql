-- Migration 061: Fix admin_create_user — profiles INSERT uses ON CONFLICT to handle trigger race
CREATE OR REPLACE FUNCTION public.admin_create_user(p_email text, p_password text, p_first_name text, p_last_name text, p_role text DEFAULT 'ETUDIANT'::text, p_phone text DEFAULT NULL::text, p_tribe text DEFAULT NULL::text, p_department text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_admin_id uuid;
  v_user_id uuid;
  v_role user_role;
begin
  v_admin_id := auth.uid();
  if v_admin_id is null then
    raise exception 'Non authentifie';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_admin_id and role = 'ADMINISTRATEUR'
  ) then
    raise exception 'Acces reserve aux administrateurs';
  end if;

  if p_role not in ('MODERATEUR', 'ADMINISTRATEUR', 'ETUDIANT', 'ADMIN_CLASSE') then
    raise exception 'Role invalide';
  end if;

  v_role := p_role::user_role;

  if exists (select 1 from auth.users where email = p_email) then
    raise exception 'Un compte avec cet email existe deja: %', p_email;
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change,
    email_change_token_current, email_change_token_new, reauthentication_token,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', p_email,
      'email_verified', true,
      'phone_verified', false,
      'role', v_role,
      'first_name', p_first_name,
      'last_name', p_last_name
    ),
    '', '', '', '', '', '',
    now(), now()
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    p_email,
    now(), now(), now()
  );

  -- Use ON CONFLICT because handle_new_user trigger may have already created the profile
  insert into public.profiles (
    id, email, first_name, last_name, role, phone, tribe, department, must_change_password
  ) values (
    v_user_id, p_email, p_first_name, p_last_name, v_role,
    p_phone, p_tribe, p_department,
    case when p_role in ('MODERATEUR', 'ADMIN_CLASSE') then true else false end
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    role = excluded.role,
    phone = excluded.phone,
    tribe = excluded.tribe,
    department = excluded.department,
    must_change_password = excluded.must_change_password;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'must_change_password', p_role in ('MODERATEUR', 'ADMIN_CLASSE')
  );

exception when others then
  if v_user_id is not null and exists (select 1 from auth.users where id = v_user_id) then
    delete from auth.users where id = v_user_id;
  end if;
  raise;
end;
$function$;
