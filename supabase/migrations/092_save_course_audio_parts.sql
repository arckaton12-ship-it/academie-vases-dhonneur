-- =====================================================
-- 092: EDITABLE AUDIO PARTS (save_course_audio_parts)
-- RPC sécurisé pour permettre admin / modérateur / admin-classe
-- de modifier les parties audio d'un cours (ce que les étudiants écoutent
-- réellement via CoursePlayer). Résout le bug §2/§3 : le formulaire admin
-- ne modifiait que audio_url, sans effet visible car le lecteur lit
-- audio_parts (jsonb) en priorité.
-- =====================================================

CREATE OR REPLACE FUNCTION public.save_course_audio_parts(
  p_course_id uuid,
  p_audio_parts jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_class_id uuid;
BEGIN
  SELECT role, class_id INTO v_role, v_class_id
  FROM profiles WHERE id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF v_role = 'ADMIN_CLASSE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM courses c
      JOIN admin_class_classes acc ON acc.class_id = c.class_id
      WHERE c.id = p_course_id AND acc.admin_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Accès refusé';
    END IF;
  ELSIF v_role = 'MODERATEUR' THEN
    IF NOT moderator_manages_class(
      (SELECT class_id FROM courses WHERE id = p_course_id)
    ) THEN
      RAISE EXCEPTION 'Accès refusé';
    END IF;
  END IF;

  UPDATE courses SET audio_parts = p_audio_parts WHERE id = p_course_id;
END;
$function$;