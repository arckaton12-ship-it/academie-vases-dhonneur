-- =====================================================
-- FIX COMPTES CASSÉS — Migration 047
-- =====================================================

-- 1. Fix admin_create_user : créer auth.users d'abord, puis profiles avec le même UUID
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
set search_path = public, extensions
as $$
declare
  v_admin_id uuid;
  v_user_id uuid;
  v_role user_role;
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

  if p_role not in ('MODERATEUR', 'ADMINISTRATEUR', 'ETUDIANT') then
    raise exception 'Rôle invalide';
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
    now(),
    now(),
    now()
  );

  insert into public.profiles (
    id, email, first_name, last_name, role, phone, tribe, department, must_change_password
  ) values (
    v_user_id, p_email, p_first_name, p_last_name, v_role,
    p_phone, p_tribe, p_department,
    case when p_role = 'MODERATEUR' then true else false end
  );

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'must_change_password', p_role = 'MODERATEUR'
  );
end;
$$;

revoke execute on function public.admin_create_user(text,text,text,text,text,text,text,text) from public;
revoke execute on function public.admin_create_user(text,text,text,text,text,text,text,text) from anon;
grant execute on function public.admin_create_user(text,text,text,text,text,text,text,text) to authenticated;

-- 2. Create handle_new_user trigger (safety net)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (
      id, email, first_name, last_name, role, avatar_url
    ) values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'ETUDIANT'),
      coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
    );
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix existing broken accounts: create profiles for auth users without one
INSERT INTO public.profiles (id, email, first_name, last_name, role)
SELECT
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'first_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'last_name', ''),
  coalesce((u.raw_user_meta_data ->> 'role')::user_role, 'ETUDIANT')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
