-- Section 8: Class requests table + RPCs
-- Students without class_id submit a request, admin approves

create table if not exists public.class_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  requested_class_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(student_id)
);

alter table public.class_requests enable row level security;

-- Students can read their own request
create policy "Students read own class requests"
  on public.class_requests for select
  using (auth.uid() = student_id);

-- Students can insert their own request (if no existing pending)
create policy "Students insert own class request"
  on public.class_requests for insert
  with check (auth.uid() = student_id);

-- Students can update their own request (for status check only)
create policy "Students update own class request"
  on public.class_requests for update
  using (auth.uid() = student_id);

-- Admins can read all requests
create policy "Admins read all class requests"
  on public.class_requests for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMINISTRATEUR'
    )
  );

-- Admins can update all requests
create policy "Admins update all class requests"
  on public.class_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMINISTRATEUR'
    )
  );

-- RPC: submit a class request
create or replace function public.submit_class_request(p_class_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_existing record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  -- Check if student already has a pending request
  select id, status into v_existing
  from public.class_requests
  where student_id = v_user_id;

  if v_existing is not null then
    if v_existing.status = 'pending' then
      return jsonb_build_object('ok', false, 'msg', 'Une demande est déjà en attente.');
    elsif v_existing.status = 'approved' then
      return jsonb_build_object('ok', false, 'msg', 'Ta demande a déjà été approuvée. Recharge la page.');
    end if;
  end if;

  insert into public.class_requests (student_id, requested_class_name)
  values (v_user_id, p_class_name)
  on conflict (student_id) do update set
    requested_class_name = excluded.requested_class_name,
    status = 'pending',
    admin_note = null,
    resolved_at = null,
    created_at = now();

  return jsonb_build_object('ok', true, 'msg', 'Demande envoyée ! En attente de validation par un administrateur.');
end;
$$;

-- RPC: admin resolves a class request
create or replace function public.resolve_class_request(
  p_request_id uuid,
  p_approve boolean,
  p_class_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_request record;
  v_class_id uuid;
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

  select * into v_request from public.class_requests where id = p_request_id;
  if v_request is null then
    raise exception 'Demande introuvable';
  end if;

  if p_approve then
    -- Resolve class
    if p_class_name is not null then
      select id into v_class_id from public.classes where lower(name) = lower(p_class_name) limit 1;
    else
      select id into v_class_id from public.classes where lower(name) = lower(v_request.requested_class_name) limit 1;
    end if;

    if v_class_id is null then
      raise exception 'Classe introuvable';
    end if;

    -- Update student profile
    update public.profiles set class_id = v_class_id where id = v_request.student_id;

    -- Update request status
    update public.class_requests
    set status = 'approved', resolved_at = now()
    where id = p_request_id;

    return jsonb_build_object('ok', true, 'msg', 'Classe assignée avec succès.');
  else
    -- Reject
    update public.class_requests
    set status = 'rejected', admin_note = 'Demande refusée par un administrateur', resolved_at = now()
    where id = p_request_id;

    return jsonb_build_object('ok', true, 'msg', 'Demande refusée.');
  end if;
end;
$$;
