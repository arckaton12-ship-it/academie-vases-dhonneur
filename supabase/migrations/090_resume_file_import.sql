-- Resume : import d'un fichier (image, PDF ou Word) en pièce jointe du résumé
-- Bucket storage public « resumes » + colonnes file_url / file_name sur public.resumes
-- Déjà appliqué en base via Management API (run-sql.cjs).

-- 1) Bucket de stockage
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Colonnes sur la table des résumés
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text;

-- 3) Policies storage pour le bucket « resumes »
CREATE POLICY IF NOT EXISTS "Upload own resume" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY IF NOT EXISTS "Read resumes" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes');

CREATE POLICY IF NOT EXISTS "Update own resume" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY IF NOT EXISTS "Delete own resume" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY IF NOT EXISTS "Moderator manage resumes" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'resumes' AND moderator_can_access_student(((storage.foldername(name))[1])::uuid));

SELECT pg_notify('pgrst', 'reload schema');