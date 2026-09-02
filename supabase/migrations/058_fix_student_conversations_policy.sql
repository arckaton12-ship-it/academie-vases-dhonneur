-- Migration 058: Fix student conversation policy
-- Les helpers admin_classe_can_access_student / moderator_can_access_student
-- vérifient auth.uid() comme admin/mod. Pour le policy étudiant, on inverse.

DROP POLICY IF EXISTS "student create conversations" ON public.conversations;

CREATE POLICY "student create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ETUDIANT')
  AND (
    -- son modérateur: participant_2 est un modérateur qui partage la même classe
    (
      EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = conversations.participant_2 AND p2.role = 'MODERATEUR')
      AND EXISTS (
        SELECT 1 FROM moderator_classes mc
        WHERE mc.moderator_id = conversations.participant_2
          AND mc.class_id = (SELECT profiles.class_id FROM profiles WHERE profiles.id = auth.uid())
      )
    )
    OR
    -- son admin_classe: participant_2 est un admin_classe qui partage la même classe
    (
      EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = conversations.participant_2 AND p2.role = 'ADMIN_CLASSE')
      AND EXISTS (
        SELECT 1 FROM admin_class_classes acc
        WHERE acc.admin_id = conversations.participant_2
          AND acc.class_id = (SELECT profiles.class_id FROM profiles WHERE profiles.id = auth.uid())
      )
    )
    OR
    -- admin principal
    (
      EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = conversations.participant_2 AND p2.role = 'ADMINISTRATEUR')
    )
  )
);

SELECT pg_notify('pgrst', 'reload schema');
