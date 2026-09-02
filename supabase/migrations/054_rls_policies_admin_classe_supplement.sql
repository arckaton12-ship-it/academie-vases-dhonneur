-- Migration 054: RLS补充 — streaks, announcements, assignments pour ADMIN_CLASSE

-- 1. STREAKS: admin_classe peut lire les streaks de ses étudiants
CREATE POLICY "admin_classe read streaks"
ON public.streaks FOR SELECT
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

-- 2. ANNOUNCEMENTS: admin_classe peut lire/creer/modifier/supprimer pour ses classes
CREATE POLICY "admin_classe manage announcements"
ON public.announcements FOR ALL
USING (
  is_admin_classe()
  AND class_id IN (SELECT class_id FROM public.admin_class_classes WHERE admin_id = auth.uid())
)
WITH CHECK (
  is_admin_classe()
  AND class_id IN (SELECT class_id FROM public.admin_class_classes WHERE admin_id = auth.uid())
);

-- 3. ASSIGNMENTS: admin_classe peut lire les assignments des cours de ses classes
CREATE POLICY "admin_classe read assignments"
ON public.assignments FOR SELECT
USING (
  is_admin_classe()
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = assignments.course_id
      AND c.class_id IN (SELECT class_id FROM public.admin_class_classes WHERE admin_id = auth.uid())
  )
);

-- 4. SOUL_TRACKING: admin_classe peut modifier (pour noter la méditation)
CREATE POLICY "admin_classe upsert soul_tracking"
ON public.soul_tracking FOR INSERT
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

CREATE POLICY "admin_classe update soul_tracking"
ON public.soul_tracking FOR UPDATE
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
)
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

SELECT pg_notify('pgrst', 'reload schema');
