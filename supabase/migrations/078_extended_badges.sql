-- Migration 078: Extended badge types for gamification P1
-- Adds XP-based badges alongside existing attendance/completion badges
-- ZERO impact on existing badges table or badge logic

-- Nothing to do in DB for new badge types — they are defined in frontend code (badges.ts)
-- The existing badges table already stores any badge_type as text, no constraint.
-- This migration just ensures the schema allows future badge types.

-- Verify no constraint blocks new types:
DO $$
BEGIN
  -- Check if there's a CHECK constraint on badge_type
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'badges'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%badge_type%'
  ) THEN
    RAISE NOTICE 'WARNING: CHECK constraint on badge_type exists — new badge types may be blocked';
  ELSE
    RAISE NOTICE 'OK: No CHECK constraint on badge_type — all badge types accepted';
  END IF;
END $$;

SELECT pg_notify('pgrst', 'reload schema');
