-- Migration 057: Rewrite conversations INSERT policies
-- Couvre TOUS les cas de messagerie selon la conigne:
--   ADMIN_CLASSE → ses étudiants + tout modérateur + admin principal
--   MODERATEUR → ses étudiants + autres modérateurs + admin_classe de ses classes + admin principal
--   ETUDIANT → son modérateur + son admin_classe + admin principal
--   ADMINISTRATEUR → tout le monde

-- Supprimer les anciennes policies INSERT trop restrictives
DROP POLICY IF EXISTS "Moderators can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "student create conversations with moderators" ON public.conversations;
DROP POLICY IF EXISTS "admin_classe create conversations" ON public.conversations;

-- 1. ADMINISTRATEUR peut écrire à tout le monde
CREATE POLICY "admin create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR')
);

-- 2. MODERATEUR peut écrire à ses étudiants, autres modérateurs, admin_classe de ses classes, admin principal
CREATE POLICY "moderator create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MODERATEUR')
  AND (
    -- ses étudiants (même classe)
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ETUDIANT')
      AND moderator_can_access_student(conversations.participant_2)
    )
    OR
    -- autres modérateurs
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'MODERATEUR')
    )
    OR
    -- admin_classe de ses classes
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ADMIN_CLASSE')
      AND EXISTS (
        SELECT 1 FROM moderator_classes mc
        JOIN admin_class_classes acc ON acc.class_id = mc.class_id
        WHERE mc.moderator_id = auth.uid()
          AND acc.admin_id = conversations.participant_2
      )
    )
    OR
    -- admin principal
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ADMINISTRATEUR')
    )
  )
);

-- 3. ADMIN_CLASSE peut écrire à ses étudiants, tout modérateur, admin principal
CREATE POLICY "admin_classe create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN_CLASSE')
  AND (
    -- ses étudiants (même classe)
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ETUDIANT')
      AND admin_classe_can_access_student(conversations.participant_2)
    )
    OR
    -- tout modérateur
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'MODERATEUR')
    )
    OR
    -- admin principal
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ADMINISTRATEUR')
    )
  )
);

-- 4. ETUDIANT peut écrire à son modérateur, son admin_classe, admin principal
CREATE POLICY "student create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ETUDIANT')
  AND (
    -- son modérateur (même classe)
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'MODERATEUR')
      AND moderator_can_access_student(auth.uid())
    )
    OR
    -- son admin_classe (même classe)
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ADMIN_CLASSE')
      AND admin_classe_can_access_student(auth.uid())
    )
    OR
    -- admin principal
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ADMINISTRATEUR')
    )
  )
);

SELECT pg_notify('pgrst', 'reload schema');
