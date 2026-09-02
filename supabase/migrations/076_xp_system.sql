-- Migration 076: XP System — points, niveaux, log d'actions
-- ZERO impact sur les tables/fonctions existantes
-- Ajoute des colonnes, crée des nouvelles tables, de nouvelles fonctions

-- ========================================
-- 1. XP Levels definition table
-- ========================================
CREATE TABLE IF NOT EXISTS xp_levels (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  icon_emoji TEXT DEFAULT ''
);

INSERT INTO xp_levels (level, name, label, min_xp, icon_emoji) VALUES
  (1, 'disciple',    'Disciple',        0,    ''),
  (2, 'initie',      'Initié',          100,  ''),
  (3, 'apprenti',    'Apprenti',        300,  ''),
  (4, 'ancien',      'Ancien',          600,  ''),
  (5, 'mentor',      'Mentor',          1000, ''),
  (6, 'sage',        'Sage',            1500, ''),
  (7, 'temoin',      'Témoin',          2500, ''),
  (8, 'discipleur',  'Discipleur',      4000, ''),
  (9, 'apotre',      'Apôtre',          6000, ''),
  (10, 'pilier',     'Pilier',          10000, '')
ON CONFLICT (level) DO NOTHING;

-- ========================================
-- 2. Add xp column to profiles
-- ========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;

-- ========================================
-- 3. XP log table — tracks every XP transaction
-- ========================================
CREATE TABLE IF NOT EXISTS xp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  ref_id UUID,
  ref_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;

-- Students can only see their own XP log
CREATE POLICY "Students see own XP log"
  ON xp_log FOR SELECT
  USING (student_id = auth.uid());

-- Service role inserts XP (via functions)
-- No INSERT policy needed — functions run as SECURITY DEFINER

-- Indexes
CREATE INDEX IF NOT EXISTS idx_xp_log_student ON xp_log(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_log_action ON xp_log(action);

-- ========================================
-- 4. XP Actions definition
-- ========================================
CREATE TABLE IF NOT EXISTS xp_actions (
  action TEXT PRIMARY KEY,
  xp_value INTEGER NOT NULL,
  description TEXT NOT NULL,
  daily_limit INTEGER DEFAULT NULL,
  unique_per_ref BOOLEAN DEFAULT false
);

INSERT INTO xp_actions (action, xp_value, description, daily_limit, unique_per_ref) VALUES
  ('course_completed',     25,  'Terminer un cours',              3,    false),
  ('quiz_passed',          15,  'Réussir un quiz',                5,    true),
  ('quiz_perfect',         30,  'Quiz sans faute',                5,    true),
  ('resume_submitted',     10,  'Soumettre un résumé',            3,    true),
  ('daily_attendance',     5,   'Présence au cours',              1,    true),
  ('streak_week',          10,  'Maintenir la série',             NULL, true),
  ('meditation_logged',    5,   'Méditation journalière',         1,    true),
  ('soul_tracking_entry',  5,   'Entree suivi d''ame',            1,    true),
  ('badge_earned',         20,  'Badge débloqué',                 NULL, false),
  ('week_perfect',         50,  'Semaine parfaite (100% présence)', NULL, true),
  ('service_participation',10,  'Participation service',          2,    false),
  ('first_login_week',     15,  'Première connexion de la semaine',1,    true)
ON CONFLICT (action) DO NOTHING;

-- ========================================
-- 5. Award XP function (SECURITY DEFINER, idempotent)
-- ========================================
CREATE OR REPLACE FUNCTION public.award_xp(
  p_student_id UUID,
  p_action TEXT,
  p_ref_id UUID DEFAULT NULL,
  p_ref_type TEXT DEFAULT NULL,
  p_bonus_xp INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action_rec xp_actions%ROWTYPE;
  v_xp INTEGER;
  v_daily_count INTEGER;
  v_total_xp INTEGER;
  v_new_level INTEGER;
  v_result JSONB;
BEGIN
  -- Validate action
  SELECT * INTO v_action_rec FROM xp_actions WHERE action = p_action;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unknown action: ' || p_action);
  END IF;

  -- Check daily limit
  IF v_action_rec.daily_limit IS NOT NULL THEN
    SELECT count(*) INTO v_daily_count
    FROM xp_log
    WHERE student_id = p_student_id
      AND action = p_action
      AND created_at >= date_trunc('day', now());
    IF v_daily_count >= v_action_rec.daily_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Daily limit reached', 'daily_count', v_daily_count);
    END IF;
  END IF;

  -- Check unique_per_ref
  IF v_action_rec.unique_per_ref AND p_ref_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM xp_log
      WHERE student_id = p_student_id
        AND action = p_action
        AND ref_id = p_ref_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already awarded for this ref');
    END IF;
  END IF;

  -- Calculate XP
  v_xp := v_action_rec.xp_value + p_bonus_xp;

  -- Insert XP log
  INSERT INTO xp_log (student_id, action, xp_amount, description, ref_id, ref_type)
  VALUES (p_student_id, p_action, v_xp, v_action_rec.description, p_ref_id, p_ref_type);

  -- Update profile XP
  UPDATE profiles SET xp = xp + v_xp WHERE id = p_student_id;
  SELECT xp INTO v_total_xp FROM profiles WHERE id = p_student_id;

  -- Calculate new level
  SELECT level INTO v_new_level
  FROM xp_levels
  WHERE min_xp <= v_total_xp
  ORDER BY min_xp DESC
  LIMIT 1;

  v_result := jsonb_build_object(
    'success', true,
    'xp_awarded', v_xp,
    'total_xp', v_total_xp,
    'level', v_new_level
  );

  RETURN v_result;
END;
$$;

-- ========================================
-- 6. Get student level info
-- ========================================
CREATE OR REPLACE FUNCTION public.get_student_level(p_student_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'xp', COALESCE(p.xp, 0),
    'level', COALESCE(lv.level, 1),
    'level_name', COALESCE(lv.name, 'disciple'),
    'level_label', COALESCE(lv.label, 'Disciple'),
    'next_level', (SELECT level FROM xp_levels WHERE level = COALESCE(lv.level, 1) + 1),
    'next_level_label', (SELECT label FROM xp_levels WHERE level = COALESCE(lv.level, 1) + 1),
    'next_level_min_xp', (SELECT min_xp FROM xp_levels WHERE level = COALESCE(lv.level, 1) + 1),
    'xp_in_level', COALESCE(p.xp, 0) - COALESCE(lv.min_xp, 0),
    'xp_for_next_level', COALESCE((SELECT min_xp FROM xp_levels WHERE level = COALESCE(lv.level, 1) + 1), COALESCE(p.xp, 0)) - COALESCE(lv.min_xp, 0)
  )
  FROM profiles p
  LEFT JOIN xp_levels lv ON lv.min_xp <= COALESCE(p.xp, 0)
    AND NOT EXISTS (SELECT 1 FROM xp_levels lv2 WHERE lv2.min_xp <= COALESCE(p.xp, 0) AND lv2.level > lv.level)
  WHERE p.id = p_student_id;
$$;

-- ========================================
-- 7. Get XP stats (for dashboard)
-- ========================================
CREATE OR REPLACE FUNCTION public.get_xp_stats(p_student_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total_xp', COALESCE(p.xp, 0),
    'today_xp', COALESCE((
      SELECT sum(xp_amount) FROM xp_log
      WHERE student_id = p_student_id
        AND created_at >= date_trunc('day', now())
    ), 0),
    'week_xp', COALESCE((
      SELECT sum(xp_amount) FROM xp_log
      WHERE student_id = p_student_id
        AND created_at >= date_trunc('week', now())
    ), 0),
    'total_actions', COALESCE((
      SELECT count(*) FROM xp_log WHERE student_id = p_student_id
    ), 0)
  )
  FROM profiles p
  WHERE p.id = p_student_id;
$$;

-- Notify PostgREST to reload
SELECT pg_notify('pgrst', 'reload schema');
