-- =====================================================
-- Académie Vases d'Honneur — policies Storage du bucket « cours »
-- Lecture : toute personne authentifiée (bucket public)
-- Écriture : réservée aux ADMINISTRATEUR / MODERATEUR
-- =====================================================

grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.objects to anon;
grant select, insert, update, delete on storage.objects to service_role;

grant select on storage.buckets to authenticated;
grant select on storage.buckets to anon;

drop policy if exists "test select" on storage.objects;
drop policy if exists "test upload" on storage.objects;
drop policy if exists "test update" on storage.objects;
drop policy if exists "test delete" on storage.objects;
drop policy if exists "Moderator upload cours" on storage.objects;
drop policy if exists "Moderator update cours" on storage.objects;
drop policy if exists "Moderator delete cours" on storage.objects;
drop policy if exists "Moderator read cours" on storage.objects;

create policy "Moderator read cours" on storage.objects
  for select to authenticated
  using (bucket_id = 'cours');

create policy "Moderator upload cours" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cours'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('ADMINISTRATEUR', 'MODERATEUR')
    )
  );

create policy "Moderator update cours" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cours'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('ADMINISTRATEUR', 'MODERATEUR')
    )
  );

create policy "Moderator delete cours" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cours'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('ADMINISTRATEUR', 'MODERATEUR')
    )
  );
