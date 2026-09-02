-- Migration 072b: Fix get_daily_verse — correct DOW mapping
-- PostgreSQL DOW: 0=Sun, 1=Mon...6=Sat
-- Admin convention in UI: 1=Mon, 2=Tue...7=Sun
-- Correct mapping: (DOW + 6) % 7 + 1
-- Priority: day_of_week match > NULL fallback > any fallback

CREATE OR REPLACE FUNCTION public.get_daily_verse(p_class_id uuid)
RETURNS TABLE(verse_text text, verse_reference text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  WITH params AS (
    SELECT (EXTRACT(DOW FROM CURRENT_DATE)::integer + 6) % 7 + 1 AS admin_dow
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
