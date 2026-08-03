-- =====================================================
-- Académie Vases d'Honneur — bucket Storage « avatars »
-- Public en lecture, images uniquement, limite 5 Mo
-- Écriture : chaque utilisateur authentifié, dans son propre dossier
-- =====================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/*'])
on conflict (id) do nothing;

grant select on storage.buckets to authenticated;
grant select on storage.buckets to anon;

drop policy if exists "Read avatars" on storage.objects;
drop policy if exists "Upload own avatar" on storage.objects;
drop policy if exists "Update own avatar" on storage.objects;
drop policy if exists "Delete own avatar" on storage.objects;

create policy "Read avatars" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');

create policy "Upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Update own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
