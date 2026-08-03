-- =====================================================
-- Académie Vases d'Honneur — migration 014 : sécurité des uploads
-- 1) Contraintes MIME + taille renforcées sur les buckets Storage
--    (cours : supports documents autorisés ; devoirs : + documents)
-- 2) Rate limiting des uploads : table upload_events + RPC check_upload_limit
-- =====================================================

-- ---- 1. Buckets Storage ----
-- cours : audio/vidéo de cours + documents de support (PDF, images, Word)
update storage.buckets
set file_size_limit = 104857600,
    allowed_mime_types = array[
      'audio/*', 'video/*', 'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
where id = 'cours';

-- devoirs : copies d'étudiants (images, PDF, documents Word, audio/vidéo courts)
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'image/*', 'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'audio/*', 'video/*'
    ]
where id = 'devoirs';

-- avatars : images uniquement (déjà borné en taille)
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/*']
where id = 'avatars';

-- ---- 2. Rate limiting des uploads ----
create table if not exists public.upload_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  bucket text not null,
  created_at timestamptz not null default now()
);
alter table public.upload_events enable row level security;

create index if not exists idx_upload_events_user_time
  on public.upload_events (user_id, created_at desc);

create or replace function public.check_upload_limit(
  p_action text,
  p_bucket text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_window int := 10;   -- fenêtre en minutes
  v_limit int := 30;    -- uploads max sur la fenêtre
  v_count int;
begin
  if v_uid is null then
    raise exception 'authentification requise';
  end if;

  -- nettoyage opportuniste des anciens événements
  delete from public.upload_events
  where created_at < now() - interval '1 day';

  select count(*) into v_count
  from public.upload_events
  where user_id = v_uid
    and created_at > now() - make_interval(mins => v_window);

  if v_count >= v_limit then
    raise exception 'Limite d''uploads atteinte (% par % minutes). Réessaie dans quelques minutes.', v_limit, v_window;
  end if;

  insert into public.upload_events (user_id, action, bucket)
  values (v_uid, p_action, p_bucket);
end;
$$;

revoke execute on function public.check_upload_limit(text, text) from public;
revoke execute on function public.check_upload_limit(text, text) from anon;
grant execute on function public.check_upload_limit(text, text) to authenticated;
