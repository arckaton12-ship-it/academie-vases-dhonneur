-- Fix get_daily_verse: rotation deterministe par jour de l'annee
CREATE OR REPLACE FUNCTION public.get_daily_verse(p_class_id uuid)
RETURNS TABLE(verse_text text, verse_reference text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  WITH active_verses AS (
    SELECT mv.verse_text, mv.verse_reference,
           ROW_NUMBER() OVER (ORDER BY mv.created_at, mv.id) AS rn
    FROM meditation_verses mv
    WHERE mv.class_id = p_class_id AND mv.active = true
  ),
  count_verses AS (
    SELECT COUNT(*) AS total FROM active_verses
  )
  SELECT av.verse_text, av.verse_reference
  FROM active_verses av, count_verses cv
  WHERE av.rn = ((EXTRACT(DOY FROM CURRENT_DATE)::int % cv.total) + 1)
  LIMIT 1;
$$;

-- Verify: test with class 1
-- Day of year 232 (Aug 20) % total verses → which verse index
SELECT 'Test rotation:' AS label,
       mv.verse_text, mv.verse_reference,
       EXTRACT(DOY FROM CURRENT_DATE)::int AS day_of_year
FROM get_daily_verse('980b1f42-0cf1-4990-9ec1-685240ccc396') AS mv(verse_text text, verse_reference text);

SELECT pg_notify('pgrst', 'reload schema');
