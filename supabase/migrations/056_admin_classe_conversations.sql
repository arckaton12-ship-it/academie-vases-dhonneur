-- Migration 056: policy INSERT conversations pour ADMIN_CLASSE

CREATE POLICY "admin_classe create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND is_admin_classe()
  AND (
    -- avec un étudiant de SA classe
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ETUDIANT')
      AND admin_classe_can_access_student(conversations.participant_2)
    )
    OR
    -- avec un modérateur de ses classes
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'MODERATEUR')
      AND EXISTS (
        SELECT 1 FROM moderator_classes mc
        JOIN admin_class_classes acc ON acc.class_id = mc.class_id
        WHERE mc.moderator_id = conversations.participant_2
          AND acc.admin_id = auth.uid()
      )
    )
    OR
    -- avec l'admin principal
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = conversations.participant_2 AND role = 'ADMINISTRATEUR')
    )
  )
);

SELECT pg_notify('pgrst', 'reload schema');
