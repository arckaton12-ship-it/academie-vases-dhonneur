-- =====================================================
-- 094 : promotions, statut étudiant et historique de classe
-- -----------------------------------------------------
-- Objectif : ne plus perdre le parcours d'un élève quand il change de
-- classe, et pouvoir distinguer les promotions et les anciens élèves.
--
-- Principe : la promotion est déduite de la date d'inscription
-- (profiles.created_at), qui ne change jamais. L'historique des
-- changements de classe est enregistré automatiquement par trigger,
-- y compris quand la classe est modifiée par set_student_class ou
-- advance_student. Aucune donnée existante n'est supprimée.
--
-- Migration idempotente : peut être rejouée sans erreur.
-- =====================================================

-- -----------------------------------------------------
-- 1. Table des promotions (cohortes)
-- -----------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default uuid_generate_v4(),
  academic_year integer not null unique,
  label text not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  constraint promotions_year_range check (academic_year between 2000 and 2100)
);

comment on table public.promotions is
  'Cohortes annuelles de l''Académie. Une promotion démarre le 1er juillet et couvre l''année académique.';

-- -----------------------------------------------------
-- 2. Année académique (bascule au 1er juillet)
-- -----------------------------------------------------
create or replace function public.academic_year_start(p_at timestamptz)
returns integer
language sql
immutable
as $$
  select case
    when extract(month from (p_at at time zone 'UTC')) >= 7
      then extract(year from (p_at at time zone 'UTC'))::integer
    else extract(year from (p_at at time zone 'UTC'))::integer - 1
  end;
$$;

-- -----------------------------------------------------
-- 3. Niveau de graduation (classe nommée Graduation/Diplôme, sinon niveau >= 4)
-- -----------------------------------------------------
create or replace function public.graduation_level()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select c.level from public.classes c
      where c.name ~* '(graduation|dipl[oô]me)'
      order by c.level desc limit 1),
    (select max(c.level) from public.classes c where c.level >= 4)
  );
$$;

-- -----------------------------------------------------
-- 4. Création d'une promotion à la demande
-- -----------------------------------------------------
create or replace function public.ensure_promotion(p_year integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.promotions where academic_year = p_year;
  if v_id is null then
    insert into public.promotions (academic_year, label, starts_on, ends_on)
    values (
      p_year,
      'Promotion ' || p_year || '–' || (p_year + 1),
      make_date(p_year, 7, 1),
      make_date(p_year + 1, 6, 30)
    )
    on conflict (academic_year) do nothing;
    select id into v_id from public.promotions where academic_year = p_year;
  end if;
  return v_id;
end;
$$;

-- -----------------------------------------------------
-- 5. Colonnes sur profiles
-- -----------------------------------------------------
alter table public.profiles
  add column if not exists promotion_id uuid references public.promotions(id) on delete set null;
alter table public.profiles
  add column if not exists status text;

comment on column public.profiles.status is
  'Statut administratif : ACTIF, DIPLOME, ARCHIVE ou SANS_CLASSE. Les règles fines restent aussi dérivées côté application.';

-- -----------------------------------------------------
-- 6. Historique des classes
-- -----------------------------------------------------
create table if not exists public.student_class_history (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  class_name text,
  class_level integer,
  academic_year integer,
  promotion_id uuid references public.promotions(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  reason text,
  moved_by uuid,
  created_at timestamptz not null default now()
);

comment on table public.student_class_history is
  'Parcours de classe d''un étudiant. Une seule ligne ouverte (ended_at null) par étudiant.';

create index if not exists student_class_history_student_idx
  on public.student_class_history (student_id, started_at desc);
create index if not exists student_class_history_class_idx
  on public.student_class_history (class_id);
create index if not exists student_class_history_promotion_idx
  on public.student_class_history (promotion_id);

-- Une seule affectation ouverte par étudiant.
create unique index if not exists student_class_history_one_open
  on public.student_class_history (student_id)
  where ended_at is null;

-- -----------------------------------------------------
-- 7. Trigger : promotion + statut à l'insertion et au changement
-- -----------------------------------------------------
create or replace function public.profiles_set_promotion_and_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer;
  v_level integer;
  v_grad integer;
begin
  if new.role <> 'ETUDIANT' then
    return new;
  end if;

  if new.promotion_id is null then
    v_year := public.academic_year_start(coalesce(new.created_at, now()));
    new.promotion_id := public.ensure_promotion(v_year);
  end if;

  v_grad := public.graduation_level();
  select c.level into v_level from public.classes c where c.id = new.class_id;

  if v_level is not null and v_grad is not null and v_level >= v_grad then
    new.status := 'DIPLOME';
  elsif new.active is false then
    new.status := 'ARCHIVE';
  elsif new.class_id is null then
    new.status := 'SANS_CLASSE';
  else
    new.status := 'ACTIF';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_promotion_and_status on public.profiles;
create trigger profiles_set_promotion_and_status
before insert or update of class_id, active on public.profiles
for each row execute function public.profiles_set_promotion_and_status();

-- -----------------------------------------------------
-- 8. Trigger : journalisation du parcours de classe
-- -----------------------------------------------------
create or replace function public.profiles_log_class_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_level integer;
begin
  if tg_op = 'UPDATE' and new.class_id is not distinct from old.class_id then
    return new;
  end if;

  if new.class_id is null then
    update public.student_class_history
    set ended_at = now()
    where student_id = new.id and ended_at is null;
    return new;
  end if;

  select c.name, c.level into v_name, v_level
  from public.classes c
  where c.id = new.class_id;

  update public.student_class_history
  set ended_at = now()
  where student_id = new.id
    and ended_at is null
    and class_id is distinct from new.class_id;

  if not exists (
    select 1 from public.student_class_history
    where student_id = new.id
      and ended_at is null
      and class_id = new.class_id
  ) then
    insert into public.student_class_history (
      student_id, class_id, class_name, class_level,
      academic_year, promotion_id, started_at, reason, moved_by
    )
    values (
      new.id, new.class_id, v_name, v_level,
      public.academic_year_start(now()), new.promotion_id, now(),
      case when tg_op = 'INSERT' then 'INSCRIPTION' else 'CHANGEMENT' end,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_log_class_history on public.profiles;
create trigger profiles_log_class_history
after insert or update of class_id on public.profiles
for each row execute function public.profiles_log_class_history();

-- -----------------------------------------------------
-- 9. Reprise des données existantes
-- -----------------------------------------------------
-- 9a. Créer les promotions correspondant aux inscriptions existantes.
do $$
declare
  r record;
begin
  for r in
    select distinct public.academic_year_start(created_at) as year
    from public.profiles
    where role = 'ETUDIANT' and created_at is not null
  loop
    perform public.ensure_promotion(r.year);
  end loop;
end;
$$;

-- 9b. Rattacher chaque profil étudiant à sa promotion.
update public.profiles p
set promotion_id = pr.id
from public.promotions pr
where p.promotion_id is null
  and p.role = 'ETUDIANT'
  and pr.academic_year = public.academic_year_start(coalesce(p.created_at, now()));

-- 9c. Statut initial cohérent (les comptes staff restent ACTIF).
update public.profiles p
set status = case
  when p.role <> 'ETUDIANT' then 'ACTIF'
  when public.graduation_level() is not null
    and coalesce((select c.level from public.classes c where c.id = p.class_id), -1)
        >= public.graduation_level()
    then 'DIPLOME'
  when p.active is false then 'ARCHIVE'
  when p.class_id is null then 'SANS_CLASSE'
  else 'ACTIF'
end
where p.status is null;

alter table public.profiles alter column status set default 'ACTIF';
alter table public.profiles alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('ACTIF', 'DIPLOME', 'ARCHIVE', 'SANS_CLASSE'));
  end if;
end;
$$;

-- 9d. Historique initial : l'affectation actuelle de chaque étudiant.
do $$
declare
  r record;
begin
  for r in
    select p.id, p.class_id, p.promotion_id, p.created_at,
           c.name, c.level
    from public.profiles p
    join public.classes c on c.id = p.class_id
    where p.role = 'ETUDIANT'
      and not exists (
        select 1 from public.student_class_history h where h.student_id = p.id
      )
  loop
    insert into public.student_class_history (
      student_id, class_id, class_name, class_level,
      academic_year, promotion_id, started_at, reason
    )
    values (
      r.id, r.class_id, r.name, r.level,
      public.academic_year_start(coalesce(r.created_at, now())),
      r.promotion_id,
      coalesce(r.created_at, now()),
      'INSCRIPTION'
    );
  end loop;
end;
$$;

-- -----------------------------------------------------
-- 10. Sécurité (RLS)
-- -----------------------------------------------------
alter table public.promotions enable row level security;
alter table public.student_class_history enable row level security;

drop policy if exists "authenticated read promotions" on public.promotions;
drop policy if exists "admin manage promotions" on public.promotions;
create policy "authenticated read promotions" on public.promotions
  for select using (auth.role() = 'authenticated');
create policy "admin manage promotions" on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "student read own class history" on public.student_class_history;
drop policy if exists "staff read class history" on public.student_class_history;
create policy "student read own class history" on public.student_class_history
  for select using (auth.uid() = student_id);
create policy "staff read class history" on public.student_class_history
  for select using (
    public.is_admin()
    or (public.is_moderator() and public.moderator_can_access_student(student_id))
    or (public.is_admin_classe() and public.admin_classe_can_access_student(student_id))
  );

-- -----------------------------------------------------
-- 11. advance_student : conserve l'historique et le statut
-- -----------------------------------------------------
-- L'historique est écrit par le trigger de profiles ; la fonction
-- se contente de déplacer l'élève et de délivrer le certificat du
-- cycle terminé. Le statut est recalculé par le trigger.
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
    or public.is_admin_classe()
    or (public.is_moderator() and public.moderator_can_access_student(p_student_id))
  ) then
    raise exception 'Accès refusé : seul un administrateur ou le responsable de la classe peut faire passer un étudiant.';
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

-- -----------------------------------------------------
-- 12. set_student_class : accepte « aucune classe » sans erreur
-- -----------------------------------------------------
-- L'ancienne signature uuid refusait la chaîne vide envoyée par
-- l'interface (« Sans classe »). On passe par advance_student pour
-- bénéficier du certificat, du statut et de l'historique.
drop function if exists public.set_student_class(uuid, uuid);
create or replace function public.set_student_class(
  p_student_id uuid,
  p_class_id text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_class uuid;
begin
  if p_class_id is null or btrim(p_class_id) = '' then
    v_class := null;
  else
    v_class := p_class_id::uuid;
  end if;

  if v_class is null then
    update public.profiles set class_id = null where id = p_student_id;
  else
    perform public.advance_student(p_student_id, v_class);
  end if;
end;
$$;

revoke execute on function public.set_student_class(uuid, text) from public;
revoke execute on function public.set_student_class(uuid, text) from anon;
grant execute on function public.set_student_class(uuid, text) to authenticated;

-- -----------------------------------------------------
-- 13. Lecture pratique : parcours complet d'un étudiant
-- -----------------------------------------------------
create or replace view public.student_journey
with (security_invoker = true)
as
select
  h.student_id,
  h.class_id,
  h.class_name,
  h.class_level,
  h.academic_year,
  h.promotion_id,
  pr.label as promotion_label,
  h.started_at,
  h.ended_at,
  h.reason,
  h.moved_by
from public.student_class_history h
left join public.promotions pr on pr.id = h.promotion_id;

comment on view public.student_journey is
  'Parcours de classe lisible, protégé par les policies de student_class_history.';

grant select on public.promotions to authenticated;
grant select on public.student_class_history to authenticated;
grant select on public.student_journey to authenticated;
