-- FIX CRITIQUE: Align class names in DB with frontend
-- RegistrationStep2 and ClassPicker use: "Connaître & Servir Christ", "Croître avec Jésus", "Consécration"
-- DB had: "Classe 1", "Classe 2", "Classe 3"

UPDATE public.classes SET name = 'Connaître & Servir Christ' WHERE level = 1;
UPDATE public.classes SET name = 'Croître avec Jésus' WHERE level = 2;
UPDATE public.classes SET name = 'Consécration' WHERE level = 3;

-- FIX: submissions.assignment_id must be nullable for submitNotes()
ALTER TABLE public.submissions ALTER COLUMN assignment_id DROP NOT NULL;

-- FIX: Create missing RPCs for user online status
CREATE OR REPLACE FUNCTION public.update_user_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_status (user_id, is_online, last_seen, updated_at)
  VALUES (v_user_id, true, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    is_online = true, last_seen = now(), updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_status(p_user_id uuid)
RETURNS TABLE(is_online boolean, last_seen timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT us.is_online, us.last_seen
  FROM public.user_status us
  WHERE us.user_id = p_user_id;
END;
$$;

