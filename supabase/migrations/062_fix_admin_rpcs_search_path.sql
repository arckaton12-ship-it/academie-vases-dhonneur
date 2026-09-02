-- Migration 062: Fix all admin RPCs — add search_path + role check
-- Root cause: SECURITY DEFINER functions without SET search_path cannot find
-- auth.uid() or public.profiles, causing "Acces reserve aux administrateurs" 
-- even for valid ADMINISTRATEUR users.

-- 1. admin_toggle_active
CREATE OR REPLACE FUNCTION public.admin_toggle_active(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_admin_role text;
  v_new_active boolean;
BEGIN
  SELECT role::text INTO v_admin_role FROM profiles WHERE id = v_caller;
  IF v_admin_role IS DISTINCT FROM 'ADMINISTRATEUR' THEN
    RAISE EXCEPTION 'Acces reserve aux administrateurs';
  END IF;
  UPDATE profiles SET active = NOT active WHERE id = p_user_id RETURNING active INTO v_new_active;
  RETURN v_new_active;
END;
$function$;

-- 2. admin_toggle_class
CREATE OR REPLACE FUNCTION public.admin_toggle_class(p_admin_id uuid, p_class_id uuid, p_assign boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_admin_role text;
BEGIN
  SELECT role::text INTO v_admin_role FROM profiles WHERE id = v_caller;
  IF v_admin_role IS DISTINCT FROM 'ADMINISTRATEUR' THEN
    RAISE EXCEPTION 'Acces reserve aux administrateurs';
  END IF;
  IF p_assign THEN
    INSERT INTO admin_class_classes (admin_id, class_id)
    VALUES (p_admin_id, p_class_id)
    ON CONFLICT (admin_id, class_id) DO NOTHING;
  ELSE
    DELETE FROM admin_class_classes WHERE admin_id = p_admin_id AND class_id = p_class_id;
  END IF;
END;
$function$;

-- 3. admin_delete_ac
CREATE OR REPLACE FUNCTION public.admin_delete_ac(p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_admin_role text;
BEGIN
  SELECT role::text INTO v_admin_role FROM profiles WHERE id = v_caller;
  IF v_admin_role IS DISTINCT FROM 'ADMINISTRATEUR' THEN
    RAISE EXCEPTION 'Acces reserve aux administrateurs';
  END IF;
  DELETE FROM admin_class_classes WHERE admin_id = p_admin_id;
  DELETE FROM profiles WHERE id = p_admin_id;
  DELETE FROM auth.users WHERE id = p_admin_id;
END;
$function$;

-- 4. delete_student
CREATE OR REPLACE FUNCTION public.delete_student(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_admin_role text;
BEGIN
  SELECT role::text INTO v_admin_role FROM profiles WHERE id = v_caller;
  IF v_admin_role NOT IN ('ADMINISTRATEUR', 'MODERATEUR') THEN
    RAISE EXCEPTION 'Acces non autorise';
  END IF;
  DELETE FROM profiles WHERE id = p_student_id;
  DELETE FROM auth.users WHERE id = p_student_id;
END;
$function$;
