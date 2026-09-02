-- Migration 079: Fix get_leaderboard CTE scope + award_xp role restriction
-- Fix: CTE "ranked" not accessible across PL/pgSQL statements (line 87-89)
-- Fix: award_xp callable by any authenticated user (students can self-award)

-- ========================================
-- 1. Fix get_leaderboard — embed my_rank in the same CTE query
-- ========================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_scope TEXT DEFAULT 'class',
  p_scope_id TEXT DEFAULT NULL,
  p_period TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 50,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_rows JSONB;
  v_my_rank INTEGER := NULL;
BEGIN
  WITH ranked AS (
    SELECT
      p.id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.xp,
      p.department,
      p.class_id,
      COALESCE(lv.level, 1) AS level,
      COALESCE(lv.label, 'Disciple') AS level_label,
      ROW_NUMBER() OVER (ORDER BY p.xp DESC) AS rank_num
    FROM profiles p
    LEFT JOIN xp_levels lv ON lv.min_xp <= p.xp
      AND NOT EXISTS (
        SELECT 1 FROM xp_levels lv2
        WHERE lv2.min_xp <= p.xp AND lv2.level > lv.level
      )
    WHERE p.role = 'ETUDIANT'
      AND p.active = true
      AND (
        p_scope = 'global'
        OR (p_scope = 'class' AND p.class_id::text = p_scope_id)
        OR (p_scope = 'department' AND p.department = p_scope_id)
      )
  ),
  period_xp AS (
    SELECT
      student_id,
      COALESCE(sum(xp_amount), 0) AS period_xp
    FROM xp_log
    WHERE (
      p_period = 'all'
      OR (p_period = 'week' AND created_at >= date_trunc('week', now()))
      OR (p_period = 'month' AND created_at >= date_trunc('month', now()))
    )
    GROUP BY student_id
  ),
  my_rank_cte AS (
    SELECT rank_num AS my_rank
    FROM ranked
    WHERE id = p_current_user_id
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'rank', r.rank_num,
        'id', r.id,
        'first_name', r.first_name,
        'last_name', r.last_name,
        'avatar_url', r.avatar_url,
        'xp', r.xp,
        'period_xp', COALESCE(pp.period_xp, 0),
        'level', r.level,
        'level_label', r.level_label,
        'is_me', r.id = p_current_user_id
      ) ORDER BY r.rank_num
    ),
    (SELECT my_rank FROM my_rank_cte)
  INTO v_rows, v_my_rank
  FROM ranked r
  LEFT JOIN period_xp pp ON pp.student_id = r.id
  LIMIT p_limit;

  v_result := jsonb_build_object(
    'leaderboard', COALESCE(v_rows, '[]'::jsonb),
    'my_rank', v_my_rank,
    'scope', p_scope,
    'scope_id', p_scope_id,
    'period', p_period
  );

  RETURN v_result;
END;
$$;

-- ========================================
-- 2. Harden award_xp — restrict to admin/moderateur/admin_classe
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
  v_caller_role TEXT;
  v_action_rec xp_actions%ROWTYPE;
  v_xp INTEGER;
  v_daily_count INTEGER;
  v_total_xp INTEGER;
  v_new_level INTEGER;
  v_result JSONB;
BEGIN
  -- Security: only admin/moderateur/admin_classe OR self (student completing own actions)
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Students can only award XP to themselves, and only for specific safe actions
  IF v_caller_role = 'ETUDIANT' THEN
    IF p_student_id != auth.uid() THEN
      RETURN jsonb_build_object('success', false, 'error', 'Students cannot award XP to others');
    END IF;
    -- Students can only self-award for these actions (not badge_earned, streak_week, etc.)
    IF p_action NOT IN (
      'course_completed', 'quiz_passed', 'quiz_perfect',
      'resume_submitted', 'daily_attendance', 'meditation_logged',
      'service_participation', 'first_login_week'
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Students cannot self-award: ' || p_action);
    END IF;
  END IF;

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

SELECT pg_notify('pgrst', 'reload schema');
