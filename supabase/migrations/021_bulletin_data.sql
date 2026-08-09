-- Migration 021: Bulletin PDF data RPC

-- RPC: Get complete student bulletin data
CREATE OR REPLACE FUNCTION get_student_bulletin(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student jsonb;
  v_resumes jsonb;
  v_submissions jsonb;
  v_quizzes jsonb;
  v_attendance jsonb;
  v_streak jsonb;
  v_meditation numeric;
  v_class_name text;
  v_avg_resume numeric;
  v_avg_submission numeric;
  v_avg_quiz numeric;
  v_attendance_rate numeric;
  v_total_courses integer;
  v_attended_courses integer;
BEGIN
  -- Student info
  SELECT jsonb_build_object(
    'first_name', p.first_name,
    'last_name', p.last_name,
    'email', p.email,
    'class_name', c.name,
    'meditation_grade', p.meditation_grade
  ) INTO v_student
  FROM profiles p
  LEFT JOIN classes c ON c.id = p.class_id
  WHERE p.id = p_student_id;

  -- Resume grades
  SELECT jsonb_agg(
    jsonb_build_object(
      'course_title', co.title,
      'week', co.week,
      'grade', r.grade,
      'feedback', r.feedback
    )
  ), round(avg(r.grade), 2)
  INTO v_resumes, v_avg_resume
  FROM resumes r
  JOIN courses co ON co.id = r.course_id
  WHERE r.student_id = p_student_id AND r.grade IS NOT NULL;

  -- Submission grades
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', s.type,
      'grade', s.grade,
      'feedback', s.feedback
    )
  ), round(avg(s.grade), 2)
  INTO v_submissions, v_avg_submission
  FROM submissions s
  WHERE s.student_id = p_student_id AND s.grade IS NOT NULL;

  -- Quiz scores
  SELECT jsonb_agg(
    jsonb_build_object(
      'quiz_title', q.title,
      'score', qa.score,
      'is_passed', qa.is_passed
    )
  ), round(avg(qa.score), 2)
  INTO v_quizzes, v_avg_quiz
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.student_id = p_student_id;

  -- Attendance
  SELECT count(DISTINCT co.id), count(DISTINCT a.course_id)
  INTO v_total_courses, v_attended_courses
  FROM courses co
  LEFT JOIN attendances a ON a.course_id = co.id AND a.student_id = p_student_id
  WHERE co.class_id = (SELECT class_id FROM profiles WHERE id = p_student_id);

  IF v_total_courses > 0 THEN
    v_attendance_rate := round((v_attended_courses::numeric / v_total_courses::numeric) * 100, 1);
  ELSE
    v_attendance_rate := 0;
  END IF;

  -- Streak
  SELECT jsonb_build_object(
    'consecutive_weeks', max(consecutive_weeks)
  ) INTO v_streak
  FROM streaks
  WHERE student_id = p_student_id;

  -- Meditation grade
  SELECT meditation_grade INTO v_meditation
  FROM profiles WHERE id = p_student_id;

  RETURN jsonb_build_object(
    'student', v_student,
    'resumes', COALESCE(v_resumes, '[]'::jsonb),
    'submissions', COALESCE(v_submissions, '[]'::jsonb),
    'quizzes', COALESCE(v_quizzes, '[]'::jsonb),
    'avg_resume', v_avg_resume,
    'avg_submission', v_avg_submission,
    'avg_quiz', v_avg_quiz,
    'attendance_rate', v_attendance_rate,
    'total_courses', v_total_courses,
    'attended_courses', v_attended_courses,
    'streak', v_streak,
    'meditation_grade', v_meditation,
    'general_average', round((
      COALESCE(v_avg_resume, 0) + COALESCE(v_avg_submission, 0) + COALESCE(v_avg_quiz, 0) + COALESCE(v_meditation, 0)
    ) / 4.0, 2)
  );
END;
$$;
