import { supabase } from './supabase'
import type { Quiz, QuizQuestion, QuizAttempt } from './types'

export async function getCourseQuizzes(courseId: string, studentId?: string): Promise<Quiz[]> {
  const { data, error } = await supabase.rpc('get_course_quizzes', {
    p_course_id: courseId,
    ...(studentId ? { p_student_id: studentId } : {}),
  })
  if (error) throw error
  return data ?? []
}

export async function getQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[]; attempted: boolean }> {
  const { data, error } = await supabase.rpc('get_quiz_with_questions', { p_quiz_id: quizId })
  if (error) throw error
  return data
}

export async function startQuiz(quizId: string): Promise<{ attempt_id: string; quiz: Quiz; questions: QuizQuestion[] }> {
  const { data, error } = await supabase.rpc('start_quiz', { p_quiz_id: quizId })
  if (error) throw error
  return data
}

export async function submitQuiz(quizId: string, answers: Record<string, number>): Promise<QuizAttempt> {
  const { data, error } = await supabase.rpc('submit_quiz', {
    p_quiz_id: quizId,
    p_answers: answers,
  })
  if (error) throw error
  return data
}

export async function createQuiz(
  courseId: string,
  title: string,
  description: string,
  timeLimit: number | null,
  passingScore: number,
  questions: { question_text: string; options: string[]; correct_option_index: number; points: number }[]
): Promise<string> {
  const { data, error } = await supabase.rpc('create_quiz', {
    p_course_id: courseId,
    p_title: title,
    p_description: description,
    p_time_limit_minutes: timeLimit,
    p_passing_score: passingScore,
    p_questions: questions,
  })
  if (error) throw error
  return data
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_quiz', { p_quiz_id: quizId })
  if (error) throw error
}
