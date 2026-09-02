-- Migration 066: Allow students to read admin_class_classes for their class
-- This lets the messaging contact list show the admin de classe

DROP POLICY IF EXISTS "student read own class admin_classe" ON public.admin_class_classes;

CREATE POLICY "student read own class admin_classe" ON public.admin_class_classes
  FOR SELECT USING (
    public.is_student()
    AND class_id = (
      SELECT class_id FROM profiles WHERE id = auth.uid()
    )
  );

SELECT pg_notify('pgrst', 'reload schema');
