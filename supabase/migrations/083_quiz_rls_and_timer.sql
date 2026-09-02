DROP POLICY IF EXISTS "quizzes_insert" ON quizzes;
DROP POLICY IF EXISTS "quizzes_update" ON quizzes;
DROP POLICY IF EXISTS "quizzes_delete" ON quizzes;
DROP POLICY IF EXISTS "quiz_questions_insert" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_update" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_delete" ON quiz_questions;

CREATE POLICY "quizzes_insert" ON quizzes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
    )
  );

CREATE POLICY "quizzes_update" ON quizzes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
    )
  );

CREATE POLICY "quizzes_delete" ON quizzes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
    )
  );

CREATE POLICY "quiz_questions_insert" ON quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
    )
  );

CREATE POLICY "quiz_questions_update" ON quiz_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
    )
  );

CREATE POLICY "quiz_questions_delete" ON quiz_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
    )
  );

ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION start_quiz(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_attempt_id uuid;
  v_quiz jsonb;
  v_questions jsonb;
BEGIN
  v_student_id := auth.uid();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_id = p_quiz_id AND student_id = v_student_id
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà passé ce quiz';
  END IF;

  INSERT INTO quiz_attempts (quiz_id, student_id, started_at)
  VALUES (p_quiz_id, v_student_id, now())
  RETURNING id INTO v_attempt_id;

  SELECT jsonb_build_object(
    'id', q.id,
    'course_id', q.course_id,
    'title', q.title,
    'description', q.description,
    'time_limit_minutes', q.time_limit_minutes,
    'passing_score', q.passing_score
  ) INTO v_quiz
  FROM quizzes q WHERE q.id = p_quiz_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', qq.id,
      'question_text', qq.question_text,
      'options', qq.options,
      'points', qq.points,
      'order_index', qq.order_index
    ) ORDER BY qq.order_index
  ) INTO v_questions
  FROM quiz_questions qq
  WHERE qq.quiz_id = p_quiz_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'quiz', v_quiz,
    'questions', COALESCE(v_questions, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION submit_quiz(
  p_quiz_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_question record;
  v_correct integer := 0;
  v_total integer := 0;
  v_score numeric(4,2);
  v_total_points integer;
  v_answer integer;
  v_passing numeric(4,2);
  v_is_passed boolean;
  v_result jsonb := '[]'::jsonb;
  v_time_limit integer;
  v_started_at timestamptz;
  v_attempt_id uuid;
BEGIN
  v_student_id := auth.uid();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  SELECT id, started_at INTO v_attempt_id, v_started_at
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id AND student_id = v_student_id;

  IF v_attempt_id IS NULL THEN
    RAISE EXCEPTION 'Aucune tentative en cours. Veuillez d''abord démarrer le quiz.';
  END IF;

  SELECT time_limit_minutes INTO v_time_limit FROM quizzes WHERE id = p_quiz_id;

  IF v_time_limit IS NOT NULL AND v_started_at IS NOT NULL THEN
    IF now() - v_started_at > (v_time_limit + 2) * interval '1 minute' THEN
      UPDATE quiz_attempts
      SET answers = p_answers,
          score = 0,
          total_points = 0,
          is_passed = false,
          completed_at = now()
      WHERE id = v_attempt_id;

      RAISE EXCEPTION 'Le temps imparti pour ce quiz est écoulé';
    END IF;
  END IF;

  SELECT passing_score INTO v_passing FROM quizzes WHERE id = p_quiz_id;

  FOR v_question IN
    SELECT id, correct_option_index, points, question_text, options
    FROM quiz_questions
    WHERE quiz_id = p_quiz_id
    ORDER BY order_index
  LOOP
    v_total := v_total + v_question.points;
    v_answer := (p_answers ->> (v_question.id)::text)::integer;

    IF v_answer IS NOT NULL AND v_answer = v_question.correct_option_index THEN
      v_correct := v_correct + v_question.points;
    END IF;

    v_result := v_result || jsonb_build_object(
      'question_id', v_question.id,
      'question_text', v_question.question_text,
      'options', v_question.options,
      'correct_index', v_question.correct_option_index,
      'your_answer', v_answer,
      'is_correct', (v_answer IS NOT NULL AND v_answer = v_question.correct_option_index),
      'points', v_question.points
    );
  END LOOP;

  IF v_total > 0 THEN
    v_score := round((v_correct::numeric / v_total::numeric) * 20, 2);
  ELSE
    v_score := 0;
  END IF;

  v_total_points := v_correct;
  v_is_passed := v_score >= COALESCE(v_passing, 10);

  UPDATE quiz_attempts
  SET answers = p_answers,
      score = v_score,
      total_points = v_total_points,
      is_passed = v_is_passed,
      completed_at = now()
  WHERE id = v_attempt_id;

  RETURN jsonb_build_object(
    'score', v_score,
    'total_points', v_total_points,
    'max_points', v_total,
    'is_passed', v_is_passed,
    'passing_score', v_passing,
    'questions', v_result
  );
END;
$$;
