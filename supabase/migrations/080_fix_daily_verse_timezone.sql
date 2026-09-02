-- Migration 080: Fix get_daily_verse — timezone-aware (Africa/Douala UTC+1)
-- CURRENT_DATE is UTC-based. On Cameroon time (UTC+1), it's already the next day
-- after 23:00 UTC. Fix: use CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala'.

CREATE OR REPLACE FUNCTION public.get_daily_verse(p_class_id uuid)
RETURNS TABLE(verse_text text, verse_reference text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  WITH params AS (
    SELECT (EXTRACT(DOW FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date)::integer + 6) % 7 + 1 AS admin_dow
  ),
  today_match AS (
    SELECT mv.verse_text, mv.verse_reference
    FROM meditation_verses mv, params p
    WHERE mv.class_id = p_class_id
      AND mv.active = true
      AND mv.day_of_week = p.admin_dow
    LIMIT 1
  ),
  rotation_fallback AS (
    SELECT mv.verse_text, mv.verse_reference
    FROM meditation_verses mv
    WHERE mv.class_id = p_class_id
      AND mv.active = true
      AND mv.day_of_week IS NULL
    ORDER BY mv.created_at, mv.id
    LIMIT 1
  ),
  any_fallback AS (
    SELECT mv.verse_text, mv.verse_reference
    FROM meditation_verses mv
    WHERE mv.class_id = p_class_id
      AND mv.active = true
    ORDER BY mv.created_at, mv.id
    LIMIT 1
  )
  SELECT t.verse_text, t.verse_reference FROM today_match t
  UNION ALL
  SELECT r.verse_text, r.verse_reference FROM rotation_fallback r
    WHERE NOT EXISTS (SELECT 1 FROM today_match)
  UNION ALL
  SELECT a.verse_text, a.verse_reference FROM any_fallback a
    WHERE NOT EXISTS (SELECT 1 FROM today_match)
      AND NOT EXISTS (SELECT 1 FROM rotation_fallback)
  LIMIT 1;
$function$;

SELECT pg_notify('pgrst', 'reload schema');
