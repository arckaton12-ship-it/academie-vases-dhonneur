CREATE OR REPLACE FUNCTION public.get_course_quizzes(
  p_course_id UUID,
  p_student_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        'avg_score', (SELECT round(avg(qa.score), 2) FROM quiz_attempts qa WHERE qa.quiz_id = q.id),
        'attempted', (
          CASE WHEN p_student_id IS NOT NULL THEN
            EXISTS (
              SELECT 1 FROM quiz_attempts qa
              WHERE qa.quiz_id = q.id AND qa.student_id = p_student_id
            )
          ELSE false
          END
        )
      ) ORDER BY q.created_at DESC
    )
    FROM quizzes q
    WHERE q.course_id = p_course_id
  );
END;
$$;
