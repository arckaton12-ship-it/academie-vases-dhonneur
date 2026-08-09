-- Migration 020: Quiz system (QCM auto-corrigés)

-- Table des quiz
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  time_limit_minutes integer DEFAULT NULL,
  passing_score numeric(4,2) DEFAULT 10.00,
  created_at timestamptz DEFAULT now()
);

-- Table des questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_option_index integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0
);

-- Table des tentatives d'étudiants
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]',
  score numeric(4,2) NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  is_passed boolean NOT NULL DEFAULT false,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(quiz_id, student_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);

-- RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz: anyone authenticated can read, only moderator/admin can write
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quizzes_insert" ON quizzes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quizzes_update" ON quizzes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "quizzes_delete" ON quizzes FOR DELETE USING (auth.role() = 'authenticated');

-- Quiz questions: same
CREATE POLICY "quiz_questions_select" ON quiz_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quiz_questions_insert" ON quiz_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quiz_questions_update" ON quiz_questions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "quiz_questions_delete" ON quiz_questions FOR DELETE USING (auth.role() = 'authenticated');

-- Quiz attempts: students see their own, moderators/admin see all
CREATE POLICY "quiz_attempts_select" ON quiz_attempts FOR SELECT
  USING (auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('MODERATEUR', 'ADMINISTRATEUR')
  ));
CREATE POLICY "quiz_attempts_insert" ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "quiz_attempts_update" ON quiz_attempts FOR UPDATE
  USING (auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('MODERATEUR', 'ADMINISTRATEUR')
  ));

-- RPC: submit a quiz and auto-grade
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
BEGIN
  v_student_id := auth.uid();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Check if already attempted
  IF EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_id = p_quiz_id AND student_id = v_student_id) THEN
    RAISE EXCEPTION 'Vous avez déjà passé ce quiz';
  END IF;

  -- Get passing score
  SELECT passing_score INTO v_passing FROM quizzes WHERE id = p_quiz_id;

  -- Grade each question
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

  -- Calculate score on 20
  IF v_total > 0 THEN
    v_score := round((v_correct::numeric / v_total::numeric) * 20, 2);
  ELSE
    v_score := 0;
  END IF;

  v_total_points := v_correct;
  v_is_passed := v_score >= COALESCE(v_passing, 10);

  -- Insert attempt
  INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, total_points, is_passed)
  VALUES (p_quiz_id, v_student_id, p_answers, v_score, v_total_points, v_is_passed);

  -- Return result
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

-- RPC: get quiz with questions (for students taking the quiz)
CREATE OR REPLACE FUNCTION get_quiz_with_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz jsonb;
  v_questions jsonb;
  v_student_id uuid;
  v_attempted boolean;
BEGIN
  v_student_id := auth.uid();

  SELECT jsonb_build_object(
    'id', q.id,
    'course_id', q.course_id,
    'title', q.title,
    'description', q.description,
    'time_limit_minutes', q.time_limit_minutes,
    'passing_score', q.passing_score
  ) INTO v_quiz
  FROM quizzes q WHERE q.id = p_quiz_id;

  -- Get questions (without correct answers for students)
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

  -- Check if student already attempted
  SELECT EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_id = p_quiz_id AND student_id = v_student_id
  ) INTO v_attempted;

  RETURN jsonb_build_object(
    'quiz', v_quiz,
    'questions', COALESCE(v_questions, '[]'::jsonb),
    'attempted', v_attempted
  );
END;
$$;

-- RPC: get all quizzes for a course (moderator view)
CREATE OR REPLACE FUNCTION get_course_quizzes(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'title', q.title,
        'description', q.description,
        'time_limit_minutes', q.time_limit_minutes,
        'passing_score', q.passing_score,
        'question_count', (SELECT count(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id),
        'attempt_count', (SELECT count(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id),
        'avg_score', (SELECT round(avg(qa.score), 2) FROM quiz_attempts qa WHERE qa.quiz_id = q.id)
      ) ORDER BY q.created_at DESC
    )
    FROM quizzes q
    WHERE q.course_id = p_course_id
  );
END;
$$;

-- RPC: create quiz with questions (moderator)
CREATE OR REPLACE FUNCTION create_quiz(
  p_course_id uuid,
  p_title text,
  p_description text DEFAULT '',
  p_time_limit_minutes integer DEFAULT NULL,
  p_passing_score numeric(4,2) DEFAULT 10.00,
  p_questions jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id uuid;
  v_q jsonb;
  v_idx integer := 0;
BEGIN
  INSERT INTO quizzes (course_id, title, description, time_limit_minutes, passing_score)
  VALUES (p_course_id, p_title, p_description, p_time_limit_minutes, p_passing_score)
  RETURNING id INTO v_quiz_id;

  FOR v_q IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index, points, order_index)
    VALUES (
      v_quiz_id,
      v_q ->> 'question_text',
      v_q -> 'options',
      (v_q ->> 'correct_option_index')::integer,
      COALESCE((v_q ->> 'points')::integer, 1),
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  RETURN v_quiz_id;
END;
$$;

-- RPC: delete quiz
CREATE OR REPLACE FUNCTION delete_quiz(p_quiz_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM quizzes WHERE id = p_quiz_id;
END;
$$;
