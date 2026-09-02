-- Migration 059: Helper functions for conversations INSERT policies
-- Les sous-requêtes dans les INSERT policies s'exécutent dans le contexte du rôle
-- de l'utilisateur (étudiant), donc RLS sur profiles bloque la lecture.
-- Ces fonctions SECURITY DEFINER bypassent le RLS.

CREATE OR REPLACE FUNCTION public.user_role_is(p_user_id uuid, p_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = p_role);
$$;

CREATE OR REPLACE FUNCTION public.user_can_reach_student(p_user_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'ADMINISTRATEUR') THEN true
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'MODERATEUR')
        AND moderator_can_access_student(p_student_id) THEN true
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'ADMIN_CLASSE')
        AND admin_classe_can_access_student(p_student_id) THEN true
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'ETUDIANT') THEN
        -- student can reach if the target shares their class
        (SELECT p_user.class_id = target.class_id
         FROM profiles p_user, profiles target
         WHERE p_user.id = p_user_id AND target.id = p_student_id
           AND target.role IN ('MODERATEUR', 'ADMIN_CLASSE'))
      ELSE false
    END;
$$;

-- Rewrite student conversation policy using SECURITY DEFINER helpers
DROP POLICY IF EXISTS "student create conversations" ON public.conversations;

CREATE POLICY "student create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND user_role_is(auth.uid(), 'ETUDIANT')
  AND (
    user_role_is(participant_2, 'ADMINISTRATEUR')
    OR user_role_is(participant_2, 'MODERATEUR')
    OR user_role_is(participant_2, 'ADMIN_CLASSE')
  )
);

-- Also rewrite moderator policy to use SECURITY DEFINER helpers (avoid same issue)
DROP POLICY IF EXISTS "moderator create conversations" ON public.conversations;

CREATE POLICY "moderator create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND user_role_is(auth.uid(), 'MODERATEUR')
  AND (
    user_role_is(participant_2, 'ADMINISTRATEUR')
    OR user_role_is(participant_2, 'MODERATEUR')
    OR user_role_is(participant_2, 'ADMIN_CLASSE')
    OR (user_role_is(participant_2, 'ETUDIANT') AND moderator_can_access_student(participant_2))
  )
);

-- Rewrite admin_classe policy to use SECURITY DEFINER helpers
DROP POLICY IF EXISTS "admin_classe create conversations" ON public.conversations;

CREATE POLICY "admin_classe create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND user_role_is(auth.uid(), 'ADMIN_CLASSE')
  AND (
    user_role_is(participant_2, 'ADMINISTRATEUR')
    OR user_role_is(participant_2, 'MODERATEUR')
    OR (user_role_is(participant_2, 'ETUDIANT') AND admin_classe_can_access_student(participant_2))
  )
);

SELECT pg_notify('pgrst', 'reload schema');
