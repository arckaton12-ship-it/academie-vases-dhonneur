-- ============================================================
-- PHASE 3: Simplification RLS — Supprimer les policies doublons
-- ============================================================

-- resumes: "Admin peut noter les résumés" est doublon de "admin full access resumes" (ALL)
DROP POLICY IF EXISTS "Admin peut noter les résumés" ON public.resumes;

-- submissions: "Admin peut noter les rendus" est doublon via "moderator grade submissions" (qui inclut is_admin())
DROP POLICY IF EXISTS "Admin peut noter les rendus" ON public.submissions;

-- ============================================================
-- PHASE 4: Sécurité mots de passe — Colonne must_change_password
-- ============================================================

-- Ajouter la colonne must_change_password aux profils
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- RPC pour forcer le changement de mot de passe
CREATE OR REPLACE FUNCTION public.force_password_change(p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admin can call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acces reserve aux administrateurs';
  END IF;

  -- Update password via auth
  UPDATE auth.users SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;

  -- Mark profile as password changed
  UPDATE public.profiles SET must_change_password = false WHERE id = p_user_id;
END;
$$;

-- RPC pour un etudiant changer son propre mot de passe
CREATE OR REPLACE FUNCTION public.change_my_password(p_current_password text, p_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_old_hash text;
BEGIN
  -- Get current password hash
  SELECT encrypted_password INTO v_old_hash
  FROM auth.users WHERE id = v_user_id;

  -- Verify current password
  IF v_old_hash IS NULL OR NOT (crypt(p_current_password, v_old_hash) = v_old_hash) THEN
    RETURN jsonb_build_object('error', 'Mot de passe actuel incorrect');
  END IF;

  -- Validate new password
  IF length(p_new_password) < 8 THEN
    RETURN jsonb_build_object('error', 'Le nouveau mot de passe doit contenir au moins 8 caracteres');
  END IF;

  -- Update password
  UPDATE auth.users SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = v_user_id;

  -- Remove the flag
  UPDATE public.profiles SET must_change_password = false WHERE id = v_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- PHASE 5: Fix dette technique — Table mod_notes (remplacer localStorage)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mod_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- RLS: moderator can manage their own notes, admin can read all
ALTER TABLE public.mod_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mod_notes_self_all" ON public.mod_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_full_access_mod_notes" ON public.mod_notes
  FOR ALL USING (is_admin());

-- RPC to get or create mod notes for a course
CREATE OR REPLACE FUNCTION public.get_mod_notes(p_course_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object('id', mn.id, 'notes', mn.notes, 'updated_at', mn.updated_at)
     FROM mod_notes mn WHERE mn.user_id = auth.uid() AND mn.course_id = p_course_id),
    jsonb_build_object('id', null, 'notes', '', 'updated_at', null)
  );
$$;

-- RPC to save mod notes
CREATE OR REPLACE FUNCTION public.save_mod_notes(p_course_id uuid, p_notes text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO mod_notes (user_id, course_id, notes, updated_at)
  VALUES (auth.uid(), p_course_id, p_notes, now())
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET notes = p_notes, updated_at = now();
END;
$$;

-- ============================================================
-- PHASE 5: Supprimer tables orphelines service_groups / service_group_members
-- (Le SERVICE_GROUP n'existe plus dans la DB — les tables sont vides)
-- ============================================================

-- Only drop if truly empty
DO $$
BEGIN
  IF (SELECT count(*) FROM service_groups) = 0 AND (SELECT count(*) FROM service_group_members) = 0 THEN
    DROP TABLE IF EXISTS public.service_group_members;
    DROP TABLE IF EXISTS public.service_groups;
    RAISE NOTICE 'Dropped empty service_groups and service_group_members tables';
  ELSE
    RAISE NOTICE 'Tables not empty, keeping them';
  END IF;
END;
$$;

-- Notify PostgREST to reload
SELECT pg_notify('pgrst', 'reload schema');
