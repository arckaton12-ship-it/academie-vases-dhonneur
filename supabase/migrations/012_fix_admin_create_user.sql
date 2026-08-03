-- =====================================================
-- Académie Vases d'Honneur — migration 012 : correctifs RLS/RPC
-- 1) admin_create_user : pgcrypto introuvable (search_path) -> extensions.crypt/gen_salt
-- 2) Révoquer EXECUTE à anon sur admin_create_user (seul authenticated/service_role)
-- 3) Harmoniser le nom du trigger de blocage des rôles privilégiés
-- =====================================================

create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role text,
  p_phone text default null,
  p_tribe text default null,
  p_department text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_role user_role;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_role not in ('MODERATEUR', 'ADMINISTRATEUR', 'ETUDIANT') then
    raise exception 'role invalide';
  end if;
  v_role := p_role::user_role;
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
    now(),
    now()
  )
  returning id into v_user_id;

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    p_email,
    now(),
    now(),
    now()
  );

  insert into profiles (
    id, email, phone, first_name, last_name, tribe, department, role
  ) values (
    v_user_id, p_email, p_phone, p_first_name, p_last_name, p_tribe, p_department, v_role
  );

  return v_user_id;
end;
$$;

-- Seul l'utilisateur authentifié (admin vérifié dans la fonction) peut créer un compte.
revoke execute on function public.admin_create_user(text, text, text, text, text, text, text, text) from public;
revoke execute on function public.admin_create_user(text, text, text, text, text, text, text, text) from anon;
grant execute on function public.admin_create_user(text, text, text, text, text, text, text, text) to authenticated;

-- Harmonisation du nom du trigger (les deux noms sont gérés pour l'idempotence).
drop trigger if exists trg_check_profile_role_on_insert on profiles;
drop trigger if exists trg_check_profile_role_insert on profiles;
create trigger trg_check_profile_role_insert
  before insert on profiles
  for each row execute function public.check_profile_role_on_insert();
