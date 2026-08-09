-- =====================================================
-- 023 : Restreindre les droits du modérateur
-- Le modérateur ne gère plus les cours ni la notation.
-- =====================================================

-- 1. Retirer les policies d'écriture sur courses pour MODERATEUR
-- On supprime les policies existantes qui permettaient INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Modérateur peut créer un cours pour sa classe" ON courses;
DROP POLICY IF EXISTS "Modérateur peut modifier un cours de sa classe" ON courses;
DROP POLICY IF EXISTS "Modérateur peut supprimer un cours de sa classe" ON courses;
DROP POLICY IF EXISTS "Moderator can create courses for managed classes" ON courses;
DROP POLICY IF EXISTS "Moderator can update courses for managed classes" ON courses;
DROP POLICY IF EXISTS "Moderator can delete courses for managed classes" ON courses;

-- Recréer des policies RESTREINTES : lecture seule pour le modérateur
-- (La policy de lecture existante via moderator_manages_class reste)
-- Nouvelle policy : seul l'admin peut modifier/supprimer des cours
CREATE POLICY "Admin peut modifier les cours"
  ON courses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

CREATE POLICY "Admin peut supprimer les cours"
  ON courses FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

CREATE POLICY "Admin peut créer des cours"
  ON courses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

-- 2. Retirer les policies d'écriture sur assignments pour MODERATEUR
DROP POLICY IF EXISTS "Modérateur peut gérer les devoirs de sa classe" ON assignments;
DROP POLICY IF EXISTS "Moderator can manage assignments for managed classes" ON assignments;

CREATE POLICY "Admin peut gérer les devoirs"
  ON assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

-- 3. Retirer le droit de notation (UPDATE) sur submissions pour MODERATEUR
DROP POLICY IF EXISTS "Modérateur peut corriger les rendus de ses étudiants" ON submissions;
DROP POLICY IF EXISTS "Moderator can grade submissions of their students" ON submissions;

-- Le modérateur peut toujours LIRE les soumissions (pour son suivi pastoral)
-- Mais seul l'admin peut noter
CREATE POLICY "Admin peut noter les rendus"
  ON submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

-- 4. Retirer le droit de notation sur resumes pour MODERATEUR
DROP POLICY IF EXISTS "Modérateur peut corriger les résumés de ses étudiants" ON resumes;
DROP POLICY IF EXISTS "Moderator can grade resumes of their students" ON resumes;

CREATE POLICY "Admin peut noter les résumés"
  ON resumes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

-- 5. Retirer l'upload sur le bucket cours pour MODERATEUR
-- (On ne peut pas modifier les policies de bucket via SQL standard,
--  mais on va gérer ça côté frontend en cachant les boutons d'upload)
-- En attendant, on supprimer lesstorage policies si elles existent
-- Note: Les bucket policies Supabase sont gérées via l'API Supabase,
-- pas via le SQL des migrations. On gère ça côté UI.

-- 6. Retirer les droits sur mini_tasks pour MODERATEUR (côté admin maintenant)
DROP POLICY IF EXISTS "Modérateur peut gérer les mini-tâches de sa classe" ON mini_tasks;
DROP POLICY IF EXISTS "Moderator can manage mini-tasks for managed classes" ON mini_tasks;

CREATE POLICY "Admin peut gérer les mini-tâches"
  ON mini_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

-- 7. Retirer les droits sur moderation_supports pour MODERATEUR
DROP POLICY IF EXISTS "Modérateur peut gérer les supports de sa classe" ON moderation_supports;
DROP POLICY IF EXISTS "Moderator can manage supports for managed classes" ON moderation_supports;

CREATE POLICY "Admin peut gérer les supports"
  ON moderation_supports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));
