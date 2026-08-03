-- =====================================================
-- Académie Vases d'Honneur — migration 011 : complétion fonctionnelle
-- 1) session_date sur les cours (planning avec dates)
-- 2) moderation_supports : plan/support de modération par cours
-- 3) mini_tasks + mini_task_responses : mini-tâche pratique réelle
-- 4) moderation_reports : rapport écrit + historique (modérateur)
-- 5) service_records.focus : focus de service (parcours variable)
-- 6) Trigger : blocage auto-inscription ADMINISTRATEUR/MODERATEUR
-- 7) RPC admin_create_user : création de compte par l'admin
-- =====================================================

-- ---- 1. Date de session sur les cours ----
alter table courses add column if not exists session_date date;

-- ---- 2. Support / plan de modération par cours ----
create table if not exists moderation_supports (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  moderator_id uuid not null references profiles(id) on delete cascade,
  content text,
  file_url text,
  updated_at timestamptz default now(),
  unique (course_id)
);
alter table moderation_supports enable row level security;

-- ---- 3. Mini-tâches par cours + réponses étudiantes ----
create table if not exists mini_tasks (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null unique references courses(id) on delete cascade,
  instruction text not null,
  created_at timestamptz default now()
);
alter table mini_tasks enable row level security;

create table if not exists mini_task_responses (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  mini_task_id uuid not null references mini_tasks(id) on delete cascade,
  response text not null,
  submitted_at timestamptz default now(),
  unique (student_id, mini_task_id)
);
alter table mini_task_responses enable row level security;

-- ---- 4. Rapports de modération ----
create table if not exists moderation_reports (
  id uuid primary key default uuid_generate_v4(),
  moderator_id uuid not null references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  session_date date,
  content text not null,
  created_at timestamptz default now()
);
alter table moderation_reports enable row level security;

-- ---- 5. Focus de service ----
alter table service_records add column if not exists focus text;

-- =====================================================
-- Policies RLS
-- =====================================================

-- moderation_supports : admin tout ; modérateur si gère la classe du cours
drop policy if exists "admin full access moderation_supports" on moderation_supports;
drop policy if exists "moderator manage moderation_supports" on moderation_supports;
create policy "admin full access moderation_supports" on moderation_supports
  for all using (public.is_admin());
create policy "moderator manage moderation_supports" on moderation_supports
  for all using (
    exists (
      select 1 from courses c
      join moderator_classes mc on mc.class_id = c.class_id
      where c.id = moderation_supports.course_id and mc.moderator_id = auth.uid()
    )
  );

-- mini_tasks : lecture authentifiée ; gestion par le modérateur de la classe
drop policy if exists "read mini_tasks" on mini_tasks;
drop policy if exists "admin full access mini_tasks" on mini_tasks;
drop policy if exists "moderator manage mini_tasks" on mini_tasks;
create policy "read mini_tasks" on mini_tasks
  for select using (auth.role() = 'authenticated');
create policy "admin full access mini_tasks" on mini_tasks
  for all using (public.is_admin());
create policy "moderator manage mini_tasks" on mini_tasks
  for all using (
    exists (
      select 1 from courses c
      join moderator_classes mc on mc.class_id = c.class_id
      where c.id = mini_tasks.course_id and mc.moderator_id = auth.uid()
    )
  );

-- mini_task_responses : l'étudiant gère sa réponse ; modérateur en lecture sur ses classes ; admin tout
drop policy if exists "self manage mini_task_responses" on mini_task_responses;
drop policy if exists "moderator read mini_task_responses" on mini_task_responses;
drop policy if exists "admin full access mini_task_responses" on mini_task_responses;
create policy "self manage mini_task_responses" on mini_task_responses
  for all using (auth.uid() = student_id);
create policy "moderator read mini_task_responses" on mini_task_responses
  for select using (
    exists (
      select 1 from mini_tasks mt
      join courses c on c.id = mt.course_id
      join moderator_classes mc on mc.class_id = c.class_id
      where mt.id = mini_task_responses.mini_task_id and mc.moderator_id = auth.uid()
    )
  );
create policy "admin full access mini_task_responses" on mini_task_responses
  for all using (public.is_admin());

-- moderation_reports : le modérateur gère les siens ; l'admin voit tout
drop policy if exists "self manage moderation_reports" on moderation_reports;
drop policy if exists "admin full access moderation_reports" on moderation_reports;
create policy "self manage moderation_reports" on moderation_reports
  for all using (auth.uid() = moderator_id);
create policy "admin full access moderation_reports" on moderation_reports
  for all using (public.is_admin());

-- =====================================================
-- Sécurité : interdire l'auto-inscription en ADMINISTRATEUR / MODERATEUR
-- (les comptes à privilèges ne sont créés que par un administrateur)
-- =====================================================
create or replace function public.check_profile_role_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.role in ('MODERATEUR', 'ADMINISTRATEUR') and not public.is_admin() then
    raise exception 'création de compte % réservée à l''administration', new.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_profile_role_insert on profiles;
create trigger trg_check_profile_role_insert
  before insert on profiles
  for each row execute function public.check_profile_role_on_insert();

-- =====================================================
-- RPC : création de compte (modérateur/admin/étudiant) par un administrateur
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

revoke execute on function public.admin_create_user(text, text, text, text, text, text, text, text) from public;
revoke execute on function public.admin_create_user(text, text, text, text, text, text, text, text) from anon;
grant execute on function public.admin_create_user(text, text, text, text, text, text, text, text) to authenticated;