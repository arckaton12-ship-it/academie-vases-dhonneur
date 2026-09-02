-- Migration 053: RLS policies for ADMIN_CLASSE role
-- Crée les fonctions helper et policies pour que ADMIN_CLASSE puisse
-- lire/modifier les données des étudiants de SA classe assignée uniquement.

-- 1. Fonction helper: vérifie si l'utilisateur courant est ADMIN_CLASSE
CREATE OR REPLACE FUNCTION public.is_admin_classe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN_CLASSE'
  );
$$;

-- 2. Fonction helper: vérifie si l'utilisateur courant peut accéder à un étudiant
CREATE OR REPLACE FUNCTION public.admin_classe_can_access_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles student
    JOIN public.admin_class_classes acc ON acc.admin_id = auth.uid()
    WHERE student.id = p_student_id
      AND student.role = 'ETUDIANT'
      AND student.class_id = acc.class_id
  );
$$;

-- 3. Policies sur PROFILES (lire les étudiants de sa classe)
CREATE POLICY "admin_classe read student profiles"
ON public.profiles FOR SELECT
USING (
  is_admin_classe()
  AND role = 'ETUDIANT'
  AND admin_classe_can_access_student(id)
);

-- Aussi pouvoir lire les profiles des autres admins/classe (pour l'UI)
CREATE POLICY "admin_classe read admin profiles"
ON public.profiles FOR SELECT
USING (
  is_admin_classe()
  AND role IN ('ADMIN_CLASSE', 'MODERATEUR', 'ADMINISTRATEUR')
);

-- 4. Policies sur SUBMISSIONS (lire + noter les rendus des étudiants de sa classe)
CREATE POLICY "admin_classe read submissions"
ON public.submissions FOR SELECT
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

CREATE POLICY "admin_classe grade submissions"
ON public.submissions FOR UPDATE
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
)
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

-- 5. Policies sur ATTENDANCES (lire + modifier la présence)
CREATE POLICY "admin_classe read attendances"
ON public.attendances FOR SELECT
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

CREATE POLICY "admin_classe insert attendances"
ON public.attendances FOR INSERT
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

CREATE POLICY "admin_classe update attendances"
ON public.attendances FOR UPDATE
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
)
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

-- 6. Policies sur RESUMES (lire + noter les résumés)
CREATE POLICY "admin_classe read resumes"
ON public.resumes FOR SELECT
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

CREATE POLICY "admin_classe grade resumes"
ON public.resumes FOR UPDATE
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
)
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

-- 7. Policies sur SERVICE_RECORDS (lire + modifier le service)
CREATE POLICY "admin_classe read service"
ON public.service_records FOR SELECT
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

CREATE POLICY "admin_classe upsert service"
ON public.service_records FOR INSERT
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

CREATE POLICY "admin_classe update service"
ON public.service_records FOR UPDATE
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
)
WITH CHECK (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

-- 8. Policies sur COURSES (lire les cours de sa classe)
CREATE POLICY "admin_classe read courses"
ON public.courses FOR SELECT
USING (
  is_admin_classe()
  AND class_id IN (SELECT class_id FROM public.admin_class_classes WHERE admin_id = auth.uid())
);

-- 9. Policies sur SOUL_TRACKING (lire pour ses étudiants)
CREATE POLICY "admin_classe read soul_tracking"
ON public.soul_tracking FOR SELECT
USING (
  is_admin_classe()
  AND admin_classe_can_access_student(student_id)
);

SELECT pg_notify('pgrst', 'reload schema');
