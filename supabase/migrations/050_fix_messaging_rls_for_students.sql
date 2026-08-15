-- 050_fix_messaging_rls_for_students.sql
-- Fix triple RLS block preventing students from using messaging

-- Helper: is_student()
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ETUDIANT'
  );
$$;

-- 1. Allow students to see moderator_classes for their class
-- (needed so students can find their moderators to start conversations)
DROP POLICY IF EXISTS "student read own class moderators" ON moderator_classes;
CREATE POLICY "student read own class moderators" ON moderator_classes
  FOR SELECT USING (
    public.is_student()
    AND class_id = (
      SELECT class_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 2. Allow students to read moderator profiles (for contact list display)
DROP POLICY IF EXISTS "student read moderator profiles" ON profiles;
CREATE POLICY "student read moderator profiles" ON profiles
  FOR SELECT USING (
    public.is_student()
    AND role = 'MODERATEUR'
    AND id IN (
      SELECT mc.moderator_id FROM moderator_classes mc
      WHERE mc.class_id = (
        SELECT class_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 3. Allow students to create conversations with their moderators
DROP POLICY IF EXISTS "student create conversations with moderators" ON conversations;
CREATE POLICY "student create conversations with moderators" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1
    AND public.is_student()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = participant_2 AND role = 'MODERATEUR')
    AND EXISTS (
      SELECT 1 FROM moderator_classes mc
      WHERE mc.moderator_id = participant_2
      AND mc.class_id = (
        SELECT class_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
