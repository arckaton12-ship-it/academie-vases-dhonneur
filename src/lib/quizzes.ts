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

export async function updateQuiz(
  quizId: string,
  title: string,
  description: string,
  timeLimit: number | null,
  passingScore: number,
  questions: { question_text: string; options: string[]; correct_option_index: number; points: number }[]
): Promise<void> {
  const { error } = await supabase.rpc('update_quiz', {
    p_quiz_id: quizId,
    p_title: title,
    p_description: description,
    p_time_limit_minutes: timeLimit,
    p_passing_score: passingScore,
    p_questions: questions,
  })
  if (error) throw error
}

export async function duplicateQuiz(quizId: string, courseId: string, title?: string): Promise<string> {
  const { data, error } = await supabase.rpc('duplicate_quiz', {
    p_quiz_id: quizId,
    p_course_id: courseId,
    p_title: title ?? null,
  })
  if (error) throw error
  return data
}

export interface AdminQuizListItem {
  id: string
  course_id: string
  course_title: string | null
  class_id: string | null
  title: string
  description: string
  question_count: number
}

export async function getAllQuizzes(): Promise<AdminQuizListItem[]> {
  const { data, error } = await supabase.rpc('get_all_quizzes')
  if (error) throw error
  return data ?? []
}

export interface AdminQuizQuestion {
  id: string
  question_text: string
  options: string[]
  correct_option_index: number
  points: number
  order_index: number
}

export async function getAdminQuizQuestions(quizId: string): Promise<AdminQuizQuestion[]> {
  const { data, error } = await supabase.rpc('get_admin_quiz_questions', { p_quiz_id: quizId })
  if (error) throw error
  return data ?? []
}
