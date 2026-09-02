import { supabase } from './supabase'
import type { Submission, Assignment, Resume, ResumeReview, ResumeForGrading, Course, ClosingReflection, MySubmission } from './types'
import { uploadAssignmentFile } from './courseData'

export async function getSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, assignment:assignments(description, type, course_id)')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Submission[]
}

export async function getAssignments(courseId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as Assignment[]
}

export async function submitAssignment(input: {
  studentId: string
  assignmentId: string
  content: string
  file?: File
}): Promise<Submission> {
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('assignment_id', input.assignmentId)
    .eq('student_id', input.studentId)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    assignment_id: input.assignmentId,
    student_id: input.studentId,
    content: input.content,
  }

  let submission: Submission
  if (existing) {
    const { data, error } = await supabase
      .from('submissions')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    submission = data as Submission
  } else {
    const { data, error } = await supabase
      .from('submissions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    submission = data as Submission
  }

  if (input.file) {
    const fileUrl = await uploadAssignmentFile(input.file, input.studentId)
    const { error: updateErr } = await supabase
      .from('submissions')
      .update({ file_url: fileUrl })
      .eq('id', submission.id)
    if (updateErr) throw updateErr
    submission = { ...submission, file_url: fileUrl }
  }

  return submission
}

export async function submitNotes(input: {
  studentId: string
  courseId: string
  comment: string
  urls: string[]
}): Promise<Submission> {
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('student_id', input.studentId)
    .eq('course_id', input.courseId)
    .eq('type', 'notes')
    .maybeSingle()

  const payload = {
    student_id: input.studentId,
    course_id: input.courseId,
    type: 'notes',
    content: input.comment,
    attachments: input.urls,
    file_url: input.urls[0] ?? null,
  }

  if (existing) {
    const { data, error } = await supabase
      .from('submissions')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data as Submission
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Submission
}

export async function getMySubmissions(studentId: string): Promise<MySubmission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, assignment:assignments(description, type, course_id), course:courses(title, week)')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MySubmission[]
}

export async function getSubmissionsForGrading(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      '*, assignment:assignments(description, type), course:courses(title, week), student:profiles(first_name, last_name, class_id)'
    )
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Submission[]
}

export async function gradeSubmission(submissionId: string, grade: number | null, feedback: string) {
  const { data: prev, error: fetchErr } = await supabase
    .from('submissions')
    .select('student_id, grade, feedback')
    .eq('id', submissionId)
    .single()
  if (fetchErr) throw fetchErr

  const { error } = await supabase
    .from('submissions')
    .update({ grade, feedback })
    .eq('id', submissionId)
  if (error) throw error

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { error: logErr } = await supabase
      .from('grade_audit_log')
      .insert({
        student_id: prev.student_id,
        graded_by: user.id,
        grade_type: 'devoir',
        ref_id: submissionId,
        old_grade: prev.grade,
        new_grade: grade,
        old_feedback: prev.feedback,
        new_feedback: feedback,
      })
    if (logErr) throw logErr
  }
}

export interface ResumeDraft {
  content: string
  file_url: string | null
  file_name: string | null
}

export async function getResume(studentId: string, courseId: string): Promise<ResumeDraft> {
  const { data, error } = await supabase
    .from('resumes')
    .select('content, file_url, file_name')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw error
  return {
    content: (data?.content as string | null) ?? '',
    file_url: (data?.file_url as string | null) ?? null,
    file_name: (data?.file_name as string | null) ?? null,
  }
}

export async function saveResume(
  studentId: string,
  courseId: string,
  content: string,
  fileUrl?: string | null,
  fileName?: string | null,
) {
  const trimmed = content.trim()
  const hasFile = Boolean(fileUrl)
  if (!trimmed && !hasFile) {
    const { error: delError } = await supabase
      .from('resumes')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)
    if (delError) throw delError
    return
  }
  const { error } = await supabase
    .from('resumes')
    .upsert(
      {
        student_id: studentId,
        course_id: courseId,
        content: trimmed || '',
        file_url: fileUrl ?? null,
        file_name: fileName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,course_id' }
    )
  if (error) throw error
}

export async function getResumesForReview(studentId: string): Promise<ResumeReview[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*, course:courses(*, class:classes(name, level))')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: true })
  if (error) throw error
  return (data ?? [])
    .map((r) => ({
      resume: r as Resume,
      course: ((r.course as unknown) as Course | null),
    }))
    .filter((r): r is ResumeReview => Boolean(r.course))
}

export async function getResumesForGrading(): Promise<ResumeForGrading[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select(
      '*, student:profiles(first_name, last_name, class_id), course:courses(title, week)'
    )
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ResumeForGrading[]
}

export async function gradeResume(resumeId: string, grade: number | null, feedback: string) {
  const { data: prev, error: fetchErr } = await supabase
    .from('resumes')
    .select('student_id, grade, feedback')
    .eq('id', resumeId)
    .single()
  if (fetchErr) throw fetchErr

  const { error } = await supabase
    .from('resumes')
    .update({ grade, feedback })
    .eq('id', resumeId)
  if (error) throw error

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { error: logErr } = await supabase
      .from('grade_audit_log')
      .insert({
        student_id: prev.student_id,
        graded_by: user.id,
        grade_type: 'resume',
        ref_id: resumeId,
        old_grade: prev.grade,
        new_grade: grade,
        old_feedback: prev.feedback,
        new_feedback: feedback,
      })
    if (logErr) throw logErr
  }
}

export async function getAllResumes(): Promise<Resume[]> {
  const { data, error } = await supabase.from('resumes').select('student_id, course_id, content, updated_at')
  if (error) throw error
  return (data ?? []) as Resume[]
}

export async function getClosingReflections(studentId: string): Promise<ClosingReflection[]> {
  const { data, error } = await supabase
    .from('closing_reflections')
    .select('*')
    .eq('student_id', studentId)
  if (error) throw error
  return (data ?? []) as ClosingReflection[]
}

export async function saveClosingReflection(
  studentId: string,
  courseId: string,
  content: string
) {
  const trimmed = content.trim()
  if (!trimmed) {
    const { error: delError } = await supabase
      .from('closing_reflections')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)
    if (delError) throw delError
    return
  }
  const { error } = await supabase
    .from('closing_reflections')
    .upsert(
      {
        student_id: studentId,
        course_id: courseId,
        content: trimmed,
        answered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,course_id' }
    )
  if (error) throw error
}
