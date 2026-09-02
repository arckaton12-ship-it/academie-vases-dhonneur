-- Migration 052: Fix admin_create_user — autoriser le rôle ADMIN_CLASSE
-- BUG: Le RPC admin_create_user rejetait 'ADMIN_CLASSE' avec "Rôle invalide"
-- Seuls MODERATEUR, ADMINISTRATEUR, ETUDIANT étaient autorisés (ligne 39)
-- Résultat: impossible de créer des comptes admin de classe via l'interface

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
    case when p_role in ('MODERATEUR', 'ADMIN_CLASSE') then true else false end
  );

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'must_change_password', p_role in ('MODERATEUR', 'ADMIN_CLASSE')
  );
end;
$$;

revoke execute on function public.admin_create_user(text,text,text,text,text,text,text,text) from public;
revoke execute on function public.admin_create_user(text,text,text,text,text,text,text,text) from anon;
grant execute on function public.admin_create_user(text,text,text,text,text,text,text,text) to authenticated;

SELECT pg_notify('pgrst', 'reload schema');
