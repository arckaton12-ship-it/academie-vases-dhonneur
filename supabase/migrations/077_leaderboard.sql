-- Migration 077: Leaderboard — classement par classe, departement, global
-- ZERO impact sur les tables/fonctions existantes

-- ========================================
-- 1. get_leaderboard RPC
--    scope: 'class' | 'department' | 'global'
--    period: 'week' | 'month' | 'all'
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
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_rows JSONB;
  v_my_rank INTEGER := NULL;
BEGIN
  -- Build leaderboard based on scope
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
        -- Scope filtering
        p_scope = 'global'
        OR (p_scope = 'class' AND p.class_id::text = p_scope_id)
        OR (p_scope = 'department' AND p.department = p_scope_id)
      )
  ),
  -- Get XP for the period if needed
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
  )
  SELECT jsonb_agg(
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
  ) INTO v_rows
  FROM ranked r
  LEFT JOIN period_xp pp ON pp.student_id = r.id
  LIMIT p_limit;

  -- Get current user's rank if requested
  IF p_current_user_id IS NOT NULL THEN
    SELECT rank_num INTO v_my_rank
    FROM ranked
    WHERE id = p_current_user_id;
  END IF;

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
-- 2. get_xp_history — recent XP gains
-- ========================================
CREATE OR REPLACE FUNCTION public.get_xp_history(
  p_student_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'action', xl.action,
        'xp_amount', xl.xp_amount,
        'description', xl.description,
        'created_at', xl.created_at
      ) ORDER BY xl.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM xp_log xl
  WHERE xl.student_id = p_student_id
  LIMIT p_limit;
$$;

SELECT pg_notify('pgrst', 'reload schema');
