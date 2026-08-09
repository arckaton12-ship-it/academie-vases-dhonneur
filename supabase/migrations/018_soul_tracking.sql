-- =====================================================
-- Académie Vases d'Honneur — migration 018 : fiche de suivi d'âme
-- Table privée (modérateur assigné + admin uniquement)
-- =====================================================

create table if not exists public.soul_tracking (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  moderator_id uuid not null references auth.users(id) on delete cascade,

  -- Assiduité
  attendance_notes text,
  attendance_rating integer check (attendance_rating between 1 and 5),

  -- Contrôle de méditation
  meditation_observations text,

  -- Situation sociale
  social_context text,

  -- Historique de suivi (journal horodaté)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.soul_tracking enable row level security;

-- Le modérateur assigné peut tout faire
create policy "soul_tracking_moderator_all" on public.soul_tracking
  for all using (
    moderator_id = auth.uid()
  );

-- L'admin voit tout
create policy "soul_tracking_admin_all" on public.soul_tracking
  for all using (public.is_admin());

-- L'étudiant ne voit JAMAIS cette table (pas de policy SELECT pour les étudiants)

-- ---- Journal chronologique des observations ----
create table if not exists public.soul_tracking_entries (
  id uuid primary key default gen_random_uuid(),
  tracking_id uuid not null references public.soul_tracking(id) on delete cascade,
  moderator_id uuid not null references auth.users(id) on delete cascade,

  category text not null check (category in ('assiduite', 'meditation', 'social', 'general')),
  content text not null,

  created_at timestamptz default now()
);

alter table public.soul_tracking_entries enable row level security;

create policy "soul_entries_moderator_all" on public.soul_tracking_entries
  for all using (
    exists (
      select 1 from public.soul_tracking st
      where st.id = soul_tracking_entries.tracking_id
      and st.moderator_id = auth.uid()
    )
  );

create policy "soul_entries_admin_all" on public.soul_tracking_entries
  for all using (public.is_admin());

-- ---- Index ----
create index if not exists idx_soul_tracking_student on public.soul_tracking(student_id);
create index if not exists idx_soul_tracking_moderator on public.soul_tracking(moderator_id);
create index if not exists idx_soul_entries_tracking on public.soul_tracking_entries(tracking_id);
