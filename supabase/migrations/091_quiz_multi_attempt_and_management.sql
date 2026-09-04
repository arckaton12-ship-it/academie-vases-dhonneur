-- Migration 091: Quiz — passage multiple (entraînement), modification,
-- duplication/réutilisation entre cours, et mise en pratique par cours.

-- ====================================================================
-- 1. PERMETTRE LE PASSAGE MULTIPLE (une tentative par ligne, terminée ou non)
-- ====================================================================
-- Retire l'unicité (quiz_id, student_id) pour autoriser plusieurs tentatives
-- par étudiant (travail d'entraînement).
ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_student_id_key;

-- Index permettant de retrouver rapidement la tentative en cours / l'historique.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_stud_quiz ON quiz_attempts(student_id, quiz_id);

-- ====================================================================
-- 2. start_quiz : réutilise une tentative en cours non terminée, sinon
--    crée une nouvelle tentative. Plus aucune limite "une seule fois".
-- ====================================================================
CREATE OR REPLACE FUNCTION public.start_quiz(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Réutilise une tentative en cours (non terminée) si elle existe.
  SELECT id INTO v_attempt_id
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id
    AND student_id = v_student_id
    AND completed_at IS NULL
  LIMIT 1;

  IF v_attempt_id IS NULL THEN
    INSERT INTO quiz_attempts (quiz_id, student_id, started_at, completed_at)
    VALUES (p_quiz_id, v_student_id, now(), NULL)
    RETURNING id INTO v_attempt_id;
  END IF;

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

-- ====================================================================
-- 3. submit_quiz : termine la tentative en cours (aucun blocage "déjà passé")
-- ====================================================================
CREATE OR REPLACE FUNCTION public.submit_quiz(
  p_quiz_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Prend la tentative en cours (la plus récente non terminée).
  SELECT id, started_at INTO v_attempt_id, v_started_at
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id AND student_id = v_student_id
    AND completed_at IS NULL
  ORDER BY started_at
  LIMIT 1;

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

-- ====================================================================
-- 4. get_quiz_with_questions : expose attempt_count au lieu d'un booléen
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_quiz_with_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quiz jsonb;
  v_questions jsonb;
  v_student_id uuid;
  v_count integer;
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

  SELECT count(*) INTO v_count
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id AND student_id = v_student_id;

  RETURN jsonb_build_object(
    'quiz', v_quiz,
    'questions', COALESCE(v_questions, '[]'::jsonb),
    'attempted', v_count > 0,
    'attempt_count', v_count
  );
END;
$$;

-- ====================================================================
-- 5. update_quiz : modifie le quiz et ses questions (admin/modo)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.update_quiz(
  p_quiz_id uuid,
  p_title text,
  p_description text,
  p_time_limit_minutes integer,
  p_passing_score numeric,
  p_questions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q jsonb;
  v_idx integer := 0;
BEGIN
  -- Vérifie les droits (admin, modérateur ou admin_classe).
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  UPDATE quizzes
  SET title = p_title,
      description = COALESCE(p_description, ''),
      time_limit_minutes = p_time_limit_minutes,
      passing_score = p_passing_score
  WHERE id = p_quiz_id;

  -- Remplace les questions (supprime + réinsère).
  DELETE FROM quiz_questions WHERE quiz_id = p_quiz_id;

  FOR v_q IN SELECT * FROM jsonb_array_elements(COALESCE(p_questions, '[]'::jsonb))
  LOOP
    INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index, points, order_index)
    VALUES (
      p_quiz_id,
      v_q ->> 'question_text',
      v_q -> 'options',
      (v_q ->> 'correct_option_index')::integer,
      COALESCE((v_q ->> 'points')::integer, 1),
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;
END;
$$;

-- ====================================================================
-- 6. duplicate_quiz : copie un quiz (et ses questions) vers un autre cours
-- ====================================================================
CREATE OR REPLACE FUNCTION public.duplicate_quiz(
  p_quiz_id uuid,
  p_course_id uuid,
  p_title text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_quiz_id uuid;
  v_src record;
  v_q record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT course_id, title, description, time_limit_minutes, passing_score INTO v_src
  FROM quizzes WHERE id = p_quiz_id;

  IF v_src.course_id IS NULL THEN
    RAISE EXCEPTION 'Quiz introuvable';
  END IF;

  INSERT INTO quizzes (course_id, title, description, time_limit_minutes, passing_score)
  VALUES (p_course_id, COALESCE(p_title, v_src.title), v_src.description, v_src.time_limit_minutes, v_src.passing_score)
  RETURNING id INTO v_new_quiz_id;

  FOR v_q IN
    SELECT question_text, options, correct_option_index, points, order_index
    FROM quiz_questions
    WHERE quiz_id = p_quiz_id
    ORDER BY order_index
  LOOP
    INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index, points, order_index)
    VALUES (v_new_quiz_id, v_q.question_text, v_q.options, v_q.correct_option_index, v_q.points, v_q.order_index);
  END LOOP;

  RETURN v_new_quiz_id;
END;
$$;

-- ====================================================================
-- 7. get_all_quizzes : liste tous les quiz (admin) pour la réutilisation
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_all_quizzes(p_course_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'course_id', q.course_id,
      'course_title', c.title,
      'class_id', c.class_id,
      'title', q.title,
      'description', q.description,
      'question_count', (SELECT count(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id)
    ) ORDER BY c.class_id, c.title, q.created_at DESC
  )
  INTO v_result
  FROM quizzes q
  LEFT JOIN courses c ON c.id = q.course_id
  WHERE (p_course_id IS NULL OR q.course_id = p_course_id);

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ====================================================================
-- 8. Mise en pratique par cours
-- ====================================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS mise_en_pratique text DEFAULT '';

-- ====================================================================
-- 9. get_admin_quiz_questions : questions AVEC la bonne réponse (admin/modo)
--    Utilisé par l'éditeur admin pour modifier un quiz.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_admin_quiz_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_out jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', qq.id,
      'question_text', qq.question_text,
      'options', qq.options,
      'correct_option_index', qq.correct_option_index,
      'points', qq.points,
      'order_index', qq.order_index
    ) ORDER BY qq.order_index
  ) INTO v_out
  FROM quiz_questions qq
  WHERE qq.quiz_id = p_quiz_id;

  RETURN COALESCE(v_out, '[]'::jsonb);
END;
$$;

-- ====================================================================
-- 10. Corrige l'ambiguïté d'overload get_course_quizzes(uuid) vs (uuid,uuid)
--     Supprime l'ancienne version 1-arg (migration 020). La version 2-arg
--     (avec p_student_id DEFAULT NULL) gère les deux cas : l'admin appelle
--     sans student_id, l'étudiant avec.
-- ====================================================================
DROP FUNCTION IF EXISTS public.get_course_quizzes(uuid);

-- ====================================================================
-- 11. get_course_quizzes enrichi : fournit attempt_count et avg_score
--     (utilisés par l'UI admin du QuizTab). L'étudiant reçoit aussi
--     `attempted` (a déjà tenté) mais n'est plus bloqué (passage multiple).
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_course_quizzes(
  p_course_id uuid,
  p_student_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'title', q.title,
      'description', q.description,
      'time_limit_minutes', q.time_limit_minutes,
      'passing_score', q.passing_score,
      'question_count', (SELECT count(*)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id),
      'attempt_count', (SELECT count(*)::int FROM quiz_attempts qa WHERE qa.quiz_id = q.id),
      'avg_score', (SELECT round(avg(qa.score)::numeric, 2) FROM quiz_attempts qa WHERE qa.quiz_id = q.id),
      'attempted', CASE
        WHEN p_student_id IS NOT NULL THEN EXISTS (
          SELECT 1 FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = p_student_id
        )
        ELSE false
      END
    ) ORDER BY q.created_at
  ) INTO v_result
  FROM quizzes q
  WHERE q.course_id = p_course_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ====================================================================
-- 12. save_course_mise_en_pratique : permet à ADMIN, MODERATEUR et
--     ADMIN_CLASSE de modifier UNIQUEMENT la mise en pratique d'un cours
--     (sans pouvoir toucher aux autres champs du cours, la RLS UPDATE
--     globale restant réservée à l'ADMIN).
-- ====================================================================
CREATE OR REPLACE FUNCTION public.save_course_mise_en_pratique(
  p_course_id uuid,
  p_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_class_id uuid;
BEGIN
  SELECT role, class_id INTO v_role, v_class_id
  FROM profiles WHERE id = auth.uid();

  IF v_role NOT IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  -- Vérification de la portée selon le rôle
  IF v_role = 'ADMIN_CLASSE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM courses c
      JOIN admin_class_classes acc ON acc.class_id = c.class_id
      WHERE c.id = p_course_id AND acc.admin_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Accès refusé';
    END IF;
  ELSIF v_role = 'MODERATEUR' THEN
    IF NOT moderator_manages_class(
      (SELECT class_id FROM courses WHERE id = p_course_id)
    ) THEN
      RAISE EXCEPTION 'Accès refusé';
    END IF;
  END IF;

  UPDATE courses SET mise_en_pratique = p_text WHERE id = p_course_id;
END;
$$;

SELECT pg_notify('pgrst', 'reload schema');
