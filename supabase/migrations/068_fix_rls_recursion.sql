-- Migration 068: Fix infinite recursion in student messaging RLS
-- Create SECURITY DEFINER helpers to break the circular dependency

-- Helper: can this student read this moderator profile?
CREATE OR REPLACE FUNCTION public.student_can_read_moderator(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles me
    JOIN moderator_classes mc ON mc.class_id = me.class_id
    WHERE me.id = auth.uid()
      AND me.role = 'ETUDIANT'
      AND mc.moderator_id = p_profile_id
  );
$$;

-- Helper: can this student read this admin_classe profile?
CREATE OR REPLACE FUNCTION public.student_can_read_admin_classe(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles me
    JOIN admin_class_classes acc ON acc.class_id = me.class_id
    WHERE me.id = auth.uid()
      AND me.role = 'ETUDIANT'
      AND acc.admin_id = p_profile_id
  );
$$;

-- 1. Fix moderator_classes policy — use subquery from profiles (no cross-table recursion via SECURITY DEFINER helper)
DROP POLICY IF EXISTS "student read own class moderators" ON public.moderator_classes;
CREATE POLICY "student read own class moderators" ON public.moderator_classes
  FOR SELECT USING (
    is_student()
    AND class_id = (
      SELECT class_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 2. Fix profiles: use SECURITY DEFINER helpers (no cross-table reference)
DROP POLICY IF EXISTS "student read moderator profiles" ON public.profiles;
CREATE POLICY "student read moderator profiles" ON public.profiles
  FOR SELECT USING (
    is_student()
    AND role = 'MODERATEUR'
    AND student_can_read_moderator(id)
  );

DROP POLICY IF EXISTS "student read admin_classe profiles" ON public.profiles;
CREATE POLICY "student read admin_classe profiles" ON public.profiles
  FOR SELECT USING (
    is_student()
    AND role = 'ADMIN_CLASSE'
    AND student_can_read_admin_classe(id)
  );

SELECT pg_notify('pgrst', 'reload schema');
