-- Migration: Enregistrer les 4 RPCs orphelins (créés via Management API, absents des migrations)
-- Ces fonctions existent déjà en base mais doivent être documentées pour traçabilité.

-- 1. delete_student — Supprime un étudiant (auth.users + profiles)
CREATE OR REPLACE FUNCTION public.delete_student(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = p_student_id;
END;
$$;

-- 2. admin_toggle_active — Active/Désactive un compte utilisateur
CREATE OR REPLACE FUNCTION public.admin_toggle_active(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_active boolean;
BEGIN
  UPDATE profiles SET active = NOT active WHERE id = p_user_id RETURNING active INTO v_new_active;
  RETURN v_new_active;
END;
$$;

-- 3. admin_toggle_class — Ajoute/Retire un admin de classe d'une classe
CREATE OR REPLACE FUNCTION public.admin_toggle_class(p_admin_id uuid, p_class_id uuid, p_assign boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_assign THEN
    INSERT INTO admin_class_classes (admin_id, class_id)
    VALUES (p_admin_id, p_class_id)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM admin_class_classes WHERE admin_id = p_admin_id AND class_id = p_class_id;
  END IF;
END;
$$;

-- 4. admin_delete_ac — Supprime un admin de classe (profiles + admin_class_classes)
CREATE OR REPLACE FUNCTION public.admin_delete_ac(p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM admin_class_classes WHERE admin_id = p_admin_id;
  DELETE FROM profiles WHERE id = p_admin_id;
END;
$$;

SELECT pg_notify('pgrst', 'reload schema');
