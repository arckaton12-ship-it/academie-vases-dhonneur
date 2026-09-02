-- Migration 067: Fix moderator_classes + profiles RLS for students
-- The student policies incorrectly read class_id from JWT user_metadata (NULL)
-- Must read from profiles table instead

-- 1. Fix moderator_classes: read class_id from profiles, not JWT
DROP POLICY IF EXISTS "student read own class moderators" ON public.moderator_classes;
CREATE POLICY "student read own class moderators" ON public.moderator_classes
  FOR SELECT USING (
    public.is_student()
    AND class_id = (
      SELECT class_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 2. Fix profiles: read class_id from profiles, not JWT
DROP POLICY IF EXISTS "student read moderator profiles" ON public.profiles;
CREATE POLICY "student read moderator profiles" ON public.profiles
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

-- 3. Add policy: students can also read admin_classe profiles of their class
DROP POLICY IF EXISTS "student read admin_classe profiles" ON public.profiles;
CREATE POLICY "student read admin_classe profiles" ON public.profiles
  FOR SELECT USING (
    public.is_student()
    AND role = 'ADMIN_CLASSE'
    AND id IN (
      SELECT acc.admin_id FROM admin_class_classes acc
      WHERE acc.class_id = (
        SELECT class_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

SELECT pg_notify('pgrst', 'reload schema');
