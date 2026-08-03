-- =====================================================
-- Académie Vases d'Honneur — migration 015 : refonte certificat
-- 1) Numéro unique par certificat (séquence VH-AAAA-XXXXX)
-- 2) Intégration du numéro dans advance_student (création automatique)
-- =====================================================

-- ---- 1. Séquence de numérotation ----
create sequence if not exists certificate_number_seq;

-- ---- 2. Colonne « number » ----
alter table certificates add column if not exists number text;

-- backfill idempotent des certificats existants
do $$
declare r record;
begin
  for r in
    select id from certificates
    where number is null
    order by issued_at, id
  loop
    update certificates
    set number = 'VH-' || to_char(now(), 'YYYY') || '-' ||
                 lpad(nextval('public.certificate_number_seq')::text, 5, '0')
    where id = r.id;
  end loop;
end $$;

alter table certificates drop constraint if exists certificates_number_unique;
alter table certificates add constraint certificates_number_unique unique (number);
alter table certificates alter column number set not null;

-- ---- 3. advance_student : génère le numéro à la création ----
create or replace function public.advance_student(
  p_student_id uuid,
  p_new_class_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_old_level int;
  v_new_level int;
begin
  if not (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(p_student_id))
  ) then
    raise exception 'Accès refusé : seul un administrateur ou le modérateur de la classe peut faire passer un étudiant.';
  end if;

  select c.level into v_old_level
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  where p.id = p_student_id;

  select c.level into v_new_level
  from public.classes c
  where c.id = p_new_class_id;

  if v_new_level is null then
    raise exception 'Classe cible introuvable.';
  end if;

  update public.profiles
  set class_id = p_new_class_id
  where id = p_student_id;

  if v_old_level is not null and v_new_level > v_old_level then
    if not exists (
      select 1 from public.certificates
      where student_id = p_student_id and cycle = v_old_level
    ) then
      insert into public.certificates (student_id, cycle, number)
      values (
        p_student_id,
        v_old_level,
        'VH-' || to_char(now(), 'YYYY') || '-' ||
          lpad(nextval('public.certificate_number_seq')::text, 5, '0')
      );
    end if;
  end if;
end;
$$;

revoke execute on function public.advance_student(uuid, uuid) from public;
revoke execute on function public.advance_student(uuid, uuid) from anon;
grant execute on function public.advance_student(uuid, uuid) to authenticated;
