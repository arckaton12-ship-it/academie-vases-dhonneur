-- ============================================================
-- Phase 5b: Dynamic course dates from class start_date
-- ============================================================

-- Add start_date to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS start_date date;

-- Update ClassRow type comment: start_date = anchor date for week 1

-- RPC to generate course session dates from a class start_date
-- Calculates session_date = start_date + (week - 1) * 7 days for each course
CREATE OR REPLACE FUNCTION public.generate_course_dates(
  p_class_id uuid,
  p_start_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated integer := 0;
  v_course record;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acces reserve aux administrateurs';
  END IF;

  -- Update class start_date
  UPDATE classes SET start_date = p_start_date WHERE id = p_class_id;

  -- Update each course's session_date based on week number
  FOR v_course IN SELECT id, week FROM courses WHERE class_id = p_class_id LOOP
    UPDATE courses
    SET session_date = p_start_date + ((v_course.week - 1) * interval '7 days')
    WHERE id = v_course.id;
    v_updated := v_updated + 1;
  END LOOP;

  RETURN v_updated;
END;
$$;

-- RPC to set class start_date (without recalculating existing courses)
CREATE OR REPLACE FUNCTION public.set_class_start_date(
  p_class_id uuid,
  p_start_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acces reserve aux administrateurs';
  END IF;
  UPDATE classes SET start_date = p_start_date WHERE id = p_class_id;
END;
$$;

SELECT pg_notify('pgrst', 'reload schema');
