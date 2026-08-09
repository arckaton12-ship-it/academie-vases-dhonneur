import { supabase } from './supabase'
import { sniffMime } from './fileValidation'

export interface ClassRow {
  id: string
  name: string
  level: number
  created_at: string | null
}

export interface Course {
  id: string
  class_id: string | null
  title: string
  week: number
  session_date: string | null
  audio_url: string | null
  video_url: string | null
  description: string | null
  created_at: string | null
  class?: Pick<ClassRow, 'name' | 'level'> | null
}

export interface StudentProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  tribe: string | null
  department: string | null
  role: string
  class_id: string | null
  active: boolean
  meditation_grade: number | null
  active_badge: string | null
  binome_id: string | null
  class?: Pick<ClassRow, 'name' | 'level'> | null
}

export interface Submission {
  id: string
  assignment_id: string | null
  student_id: string
  content: string | null
  file_url: string | null
  submitted_at: string | null
  grade: number | null
  feedback: string | null
  type: string
  attachments: string[] | null
  course_id: string | null
  assignment?: { description: string; type: string; course_id?: string | null } | null
  course?: Pick<Course, 'title' | 'week' | 'session_date'> | null
  student?: {
    first_name: string
    last_name: string
    class_id: string | null
  } | null
}

export interface Streak {
  id: string
  student_id: string
  week_start: string
  consecutive_weeks: number
}

const COURSE_BUCKET = 'cours'
const DEVOIRS_BUCKET = 'devoirs'
const NOTES_BUCKET = 'notes-manuscrites'

export const COURSE_MEDIA_MAX_SIZE = 100 * 1024 * 1024
export const ASSIGNMENT_FILE_MAX_SIZE = 10 * 1024 * 1024
export const NOTE_FILE_MAX_SIZE = 10 * 1024 * 1024

const COURSE_FILE_TYPES = /^(audio\/|video\/|image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)/
const ASSIGNMENT_FILE_TYPES = /^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|audio\/|video\/)/
const NOTE_FILE_TYPES = /^(image\/|application\/pdf)/

function isAllowedUpload(file: File, maxSize: number, typePattern: RegExp): boolean {
  return file.size > 0 && file.size <= maxSize && typePattern.test(file.type)
}

async function checkUploadRate(bucket: string): Promise<void> {
  const { error } = await supabase.rpc('check_upload_limit', {
    p_action: 'upload',
    p_bucket: bucket,
  })
  if (error) throw error
}

export function isCourseMediaFile(file: File): boolean {
  return isAllowedUpload(file, COURSE_MEDIA_MAX_SIZE, COURSE_FILE_TYPES)
}

export function isAssignmentFile(file: File): boolean {
  return isAllowedUpload(file, ASSIGNMENT_FILE_MAX_SIZE, ASSIGNMENT_FILE_TYPES)
}

export function isNoteImageFile(file: File): boolean {
  return isAllowedUpload(file, NOTE_FILE_MAX_SIZE, NOTE_FILE_TYPES)
}

export async function getClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('level', { ascending: true })
  if (error) throw error
  return (data ?? []) as ClassRow[]
}

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*, class:classes(name, level)')
    .order('week', { ascending: true })
  if (error) throw error
  return (data ?? []) as Course[]
}

export async function getStudentCourse(classId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*, class:classes(name, level)')
    .eq('class_id', classId)
    .order('week', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Course | null
}

export async function getStudents(): Promise<StudentProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, class:classes(name, level)')
    .eq('role', 'ETUDIANT')
    .order('last_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as StudentProfile[]
}

export async function getSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, assignment:assignments(description, type, course_id)')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Submission[]
}

export async function getStreaks(): Promise<Streak[]> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .order('consecutive_weeks', { ascending: false })
  if (error) throw error
  return (data ?? []) as Streak[]
}

export interface Assignment {
  id: string
  course_id: string
  description: string
  due_date: string | null
  type: string
  created_at: string | null
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

export async function getStudentStreak(studentId: string): Promise<Streak | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('student_id', studentId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Streak | null
}

export async function uploadCourseFile(file: File): Promise<string> {
  if (!isCourseMediaFile(file)) {
    throw new Error(
      'Fichier non autorisé pour un cours : audio, vidéo, image ou PDF de 100 Mo maximum.'
    )
  }
  const sniffed = await sniffMime(file)
  if (sniffed && sniffed.mime !== file.type && !file.type.startsWith(sniffed.mime.split('/')[0])) {
    throw new Error(`Type de fichier réel (${sniffed.mime}) ne correspond pas au type déclaré.`)
  }
  await checkUploadRate(COURSE_BUCKET)
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(COURSE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) throw error
  return path
}

export function courseFileUrl(path: string): string {
  const { data } = supabase.storage.from(COURSE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function createCourse(input: {
  classId: string
  title: string
  week: number
  sessionDate?: string
  description?: string
  audioPath?: string
  videoPath?: string
}): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      class_id: input.classId,
      title: input.title,
      week: input.week,
      session_date: input.sessionDate || null,
      description: input.description ?? null,
      audio_url: input.audioPath ? courseFileUrl(input.audioPath) : null,
      video_url: input.videoPath ? courseFileUrl(input.videoPath) : null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Course
}

export async function advanceStudent(studentId: string, newClassId: string) {
  const { error } = await supabase.rpc('advance_student', {
    p_student_id: studentId,
    p_new_class_id: newClassId,
  })
  if (error) throw error
}

// =====================================================
// Résumés de cours
// =====================================================
export interface Resume {
  id: string
  student_id: string
  course_id: string
  content: string
  grade: number | null
  feedback: string | null
  updated_at: string | null
}

export interface ResumeReview {
  resume: Resume
  course: Course
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

export interface ClosingReflection {
  id: string
  student_id: string
  course_id: string
  content: string
  invited_at: string | null
  answered_at: string | null
  updated_at: string | null
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

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function markNotificationsRead() {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userData.user.id)
    .eq('read', false)
  if (error) throw error
}

export interface BadgeProgress {
  badge_type: string
  earned: boolean
  earned_at: string | null
  current: number
  target: number
}

export async function getBadgeProgress(): Promise<BadgeProgress[]> {
  const { data, error } = await supabase.rpc('get_badge_progress')
  if (error) throw error
  return (data ?? []) as BadgeProgress[]
}

export async function getLandingAvatars(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_landing_avatars')
  if (error) throw error
  return (data ?? []).map((r: { avatar_url: string }) => r.avatar_url).filter(Boolean)
}

export async function getResume(studentId: string, courseId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('resumes')
    .select('content')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw error
  return (data?.content as string | null) ?? null
}

export async function saveResume(studentId: string, courseId: string, content: string) {
  const trimmed = content.trim()
  if (!trimmed) {
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
      { student_id: studentId, course_id: courseId, content: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,course_id' }
    )
  if (error) throw error
}

// =====================================================
// Présence + streak (semaines consécutives)
// =====================================================
export interface Attendance {
  id: string
  student_id: string
  course_id: string
  attended_at: string | null
}

export async function getAttendances(): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .order('attended_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Attendance[]
}

function startOfWeek(date: Date): string {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export async function markCourseAttendance(studentId: string, courseId: string): Promise<{ newlyMarked: boolean; streak: number }> {
  const { data: existing } = await supabase
    .from('attendances')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (existing) {
    const current = await getStudentStreak(studentId)
    return { newlyMarked: false, streak: current?.consecutive_weeks ?? 0 }
  }

  const { error: attError } = await supabase
    .from('attendances')
    .insert({ student_id: studentId, course_id: courseId })
  if (attError) throw attError

  const thisWeek = startOfWeek(new Date())
  const lastWeek = startOfWeek(new Date(Date.now() - 7 * 24 * 3600 * 1000))

  const { data: existingStreak } = await supabase
    .from('streaks')
    .select('consecutive_weeks')
    .eq('student_id', studentId)
    .eq('week_start', thisWeek)
    .maybeSingle()

  if (!existingStreak) {
    const { data: previous } = await supabase
      .from('streaks')
      .select('consecutive_weeks')
      .eq('student_id', studentId)
      .eq('week_start', lastWeek)
      .maybeSingle()
    const consecutive = previous ? (previous.consecutive_weeks as number) + 1 : 1
    const { error: streakError } = await supabase
      .from('streaks')
      .insert({ student_id: studentId, week_start: thisWeek, consecutive_weeks: consecutive })
    if (streakError) throw streakError
    return { newlyMarked: true, streak: consecutive }
  }

  return { newlyMarked: true, streak: existingStreak.consecutive_weeks as number }
}

// =====================================================
// Soumissions de devoirs (avec pièce jointe vers bucket « devoirs »)
// =====================================================

export async function uploadAssignmentFile(file: File, studentId: string): Promise<string> {
  if (!isAssignmentFile(file)) {
    throw new Error(
      'Fichier non autorisé pour un devoir : image, PDF ou audio de 10 Mo maximum.'
    )
  }
  const sniffed = await sniffMime(file)
  if (sniffed && sniffed.mime !== file.type && !file.type.startsWith(sniffed.mime.split('/')[0])) {
    throw new Error(`Type de fichier réel (${sniffed.mime}) ne correspond pas au type déclaré.`)
  }
  await checkUploadRate(DEVOIRS_BUCKET)
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${studentId}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(DEVOIRS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) throw error
  const { data } = supabase.storage.from(DEVOIRS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function submitAssignment(input: {
  studentId: string
  assignmentId: string
  content: string
  file?: File
}): Promise<Submission> {
  const fileUrl = input.file ? await uploadAssignmentFile(input.file, input.studentId) : undefined

  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('assignment_id', input.assignmentId)
    .eq('student_id', input.studentId)
    .maybeSingle()

  const payload = {
    assignment_id: input.assignmentId,
    student_id: input.studentId,
    content: input.content,
    ...(fileUrl ? { file_url: fileUrl } : {}),
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

// =====================================================
// Notes manuscrites (bucket dédié + type de soumission « notes »)
// =====================================================

export async function uploadNoteFile(file: File, studentId: string): Promise<string> {
  if (!isNoteImageFile(file)) {
    throw new Error('Fichier non autorisé pour des notes manuscrites : image ou PDF de 10 Mo maximum.')
  }
  const sniffed = await sniffMime(file)
  if (sniffed && sniffed.mime !== file.type && !file.type.startsWith(sniffed.mime.split('/')[0])) {
    throw new Error(`Type de fichier réel (${sniffed.mime}) ne correspond pas au type déclaré.`)
  }
  await checkUploadRate(NOTES_BUCKET)
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${studentId}/notes/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(NOTES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) throw error
  const { data } = supabase.storage.from(NOTES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function submitNotes(input: {
  studentId: string
  courseId: string
  comment: string
  urls: string[]
}): Promise<Submission> {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      student_id: input.studentId,
      course_id: input.courseId,
      type: 'notes',
      content: input.comment,
      attachments: input.urls,
      file_url: input.urls[0] ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Submission
}

export interface MySubmission extends Submission {
  assignment?: { description: string; type: string; course_id: string } | null
  course_title?: string | null
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
  const { error } = await supabase
    .from('submissions')
    .update({ grade, feedback })
    .eq('id', submissionId)
  if (error) throw error
}

// =====================================================
// Correction des résumés de cours (note + appréciation)
// =====================================================
export interface ResumeForGrading extends Resume {
  student?: { first_name: string; last_name: string; class_id: string | null } | null
  course?: Pick<Course, 'title' | 'week'> | null
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
  const { error } = await supabase
    .from('resumes')
    .update({ grade, feedback })
    .eq('id', resumeId)
  if (error) throw error
}

// =====================================================
// Webhook d'administration (URL configurable par l'admin)
// =====================================================
export interface WebhookConfig {
  id: boolean
  url: string | null
  active: boolean
}

export async function getWebhookConfig(): Promise<WebhookConfig | null> {
  const { data, error } = await supabase
    .from('admin_webhook')
    .select('*')
    .eq('id', true)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as WebhookConfig | null
}

export async function saveWebhookConfig(url: string, active: boolean) {
  const { error } = await supabase
    .from('admin_webhook')
    .upsert({ id: true, url: url.trim() || null, active, updated_at: new Date().toISOString() })
  if (error) throw error
}

// =====================================================
// Progression étudiante (tableau de bord)
// =====================================================
export async function getClassCourses(classId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*, class:classes(name, level)')
    .eq('class_id', classId)
    .order('week', { ascending: true })
  if (error) throw error
  return (data ?? []) as Course[]
}

export async function getFollowedCourses(studentId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('attendances')
    .select('course:courses(*, class:classes(name, level))')
    .eq('student_id', studentId)
  if (error) throw error
  return (data ?? [])
    .map((r) => ((r.course as unknown) as Course | null))
    .filter((c): c is Course => Boolean(c))
}

export interface StudentProgress {
  totalCourses: number
  attendedCourses: number
  presenceRate: number
  resumesCount: number
  resumeRate: number
  averageGrade: string | null
  meditationGrade: number | null
}

export async function getStudentProgress(studentId: string): Promise<StudentProgress> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('class_id, meditation_grade')
    .eq('id', studentId)
    .single()

  const classId = (profile?.class_id as string | null) ?? null

  const [courses, attendances, resumes, submissions] = await Promise.all([
    classId ? getClassCourses(classId) : Promise.resolve([] as Course[]),
    supabase.from('attendances').select('id').eq('student_id', studentId),
    supabase.from('resumes').select('id').eq('student_id', studentId),
    supabase
      .from('submissions')
      .select('grade')
      .eq('student_id', studentId)
      .not('grade', 'is', null),
  ])

  const total = courses.length
  const attended = attendances.data?.length ?? 0
  const resumesCount = resumes.data?.length ?? 0
  const grades = (submissions.data ?? [])
    .map((s) => Number(s.grade))
    .filter((g) => !Number.isNaN(g))
  const average =
    grades.length > 0
      ? (grades.reduce((acc, g) => acc + g, 0) / grades.length).toFixed(2)
      : null

  return {
    totalCourses: total,
    attendedCourses: attended,
    presenceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
    resumesCount,
    resumeRate: total > 0 ? Math.round((resumesCount / total) * 100) : 0,
    averageGrade: average,
    meditationGrade: (profile?.meditation_grade as number | null) ?? null,
  }
}

// =====================================================
// Service
// =====================================================
export interface ServiceRecord {
  id: string
  student_id: string
  group_name: string | null
  service_days: number | null
  service_note: number | null
  mission_description: string | null
  focus: string | null
  updated_at: string | null
}

export async function getServiceRecord(studentId: string): Promise<ServiceRecord | null> {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as ServiceRecord | null
}

export async function upsertServiceRecord(
  studentId: string,
  input: { group_name: string; service_days: number; mission_description: string; focus?: string }
) {
  const { error } = await supabase
    .from('service_records')
    .upsert(
      {
        student_id: studentId,
        group_name: input.group_name || null,
        service_days: input.service_days || 0,
        mission_description: input.mission_description || null,
        focus: input.focus || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' }
    )
  if (error) throw error
}

// =====================================================
// Badges (computation + lecture)
// =====================================================
export interface BadgeRow {
  id: string
  student_id: string
  badge_type: string
  earned_at: string | null
}

export async function getBadges(studentId: string): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('student_id', studentId)
    .order('earned_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as BadgeRow[]
}

export async function ensureBadges(studentId: string): Promise<BadgeRow[]> {
  const [streaksData, resumesData, certsData, attData] = await Promise.all([
    supabase.from('streaks').select('consecutive_weeks').eq('student_id', studentId),
    supabase.from('resumes').select('id').eq('student_id', studentId),
    supabase.from('certificates').select('cycle').eq('student_id', studentId),
    supabase.from('attendances').select('id').eq('student_id', studentId),
  ])

  const maxStreak = Math.max(0, ...(streaksData.data ?? []).map((s) => Number(s.consecutive_weeks)))
  const resumeCount = resumesData.data?.length ?? 0
  const hasAttendance = (attData.data?.length ?? 0) > 0
  const cycles = new Set((certsData.data ?? []).map((c) => Number(c.cycle)))

  const eligible: string[] = []
  if (hasAttendance) eligible.push('premiere-semaine')
  if (maxStreak >= 4) eligible.push('premier-mois')
  if (maxStreak >= 8) eligible.push('assidu-huit')
  if (resumeCount >= 5) eligible.push('cinq-resumes')
  if (resumeCount >= 10) eligible.push('dix-resumes')
  if (cycles.has(1)) eligible.push('cycle-1')
  if (cycles.has(2)) eligible.push('cycle-2')
  if (cycles.has(3)) eligible.push('cycle-3')

  for (const badgeType of eligible) {
    await supabase
      .from('badges')
      .upsert({ student_id: studentId, badge_type: badgeType }, { onConflict: 'student_id,badge_type' })
  }

  return getBadges(studentId)
}

// =====================================================
// Certificats
// =====================================================
export interface Certificate {
  id: string
  student_id: string
  cycle: number
  issued_at: string | null
  number: string | null
}

export async function getCertificates(studentId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId)
    .order('cycle', { ascending: true })
  if (error) throw error
  return (data ?? []) as Certificate[]
}

// =====================================================
// Statistiques d'engagement (lecture admin)
// =====================================================
export async function getAllBadges(): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('earned_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as BadgeRow[]
}

export async function getAllResumes(): Promise<Resume[]> {
  const { data, error } = await supabase.from('resumes').select('student_id, course_id, content, updated_at')
  if (error) throw error
  return (data ?? []) as Resume[]
}

export interface MiniTaskResponseRow {
  id: string
  student_id: string
  mini_task_id: string
  response: string
  submitted_at: string | null
}

export async function getAllMiniTaskResponses(): Promise<MiniTaskResponseRow[]> {
  const { data, error } = await supabase.from('mini_task_responses').select('*')
  if (error) throw error
  return (data ?? []) as MiniTaskResponseRow[]
}

// =====================================================
// Modérateurs (liste pour l'écran modérateur)
// =====================================================
export interface ModeratorProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  tribe: string | null
  department: string | null
  avatar_url: string | null
  class_id: string | null
  active: boolean
  class?: Pick<ClassRow, 'name' | 'level'> | null
}

export async function getModerators(): Promise<ModeratorProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, class:classes(name, level)')
    .eq('role', 'MODERATEUR')
    .order('last_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as ModeratorProfile[]
}

// =====================================================
// Admin : révocation d'accès
// =====================================================
export async function setAccessActive(userId: string, active: boolean) {
  const { error } = await supabase.from('profiles').update({ active }).eq('id', userId)
  if (error) throw error
}

// =====================================================
// Admin : note de méditation
// =====================================================
export async function setMeditationGrade(userId: string, grade: number | null) {
  const { error } = await supabase
    .from('profiles')
    .update({ meditation_grade: grade })
    .eq('id', userId)
  if (error) throw error
}

// =====================================================
// Gestion des modérateurs (admin) : rôle, classes, planning
// =====================================================
export async function setModeratorRole(userId: string, role: 'MODERATEUR' | 'ETUDIANT') {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw error
}

export async function getModeratorClasses(moderatorId: string): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from('moderator_classes')
    .select('class:classes(*)')
    .eq('moderator_id', moderatorId)
    .order('class_id', { ascending: true })
  if (error) throw error
  return (data ?? [])
    .map((r) => ((r.class as unknown) as ClassRow | null))
    .filter((c): c is ClassRow => Boolean(c))
}

export async function setModeratorClasses(moderatorId: string, classIds: string[]) {
  const { error: delError } = await supabase
    .from('moderator_classes')
    .delete()
    .eq('moderator_id', moderatorId)
  if (delError) throw delError
  if (classIds.length === 0) return
  const { error } = await supabase.from('moderator_classes').insert(
    classIds.map((classId) => ({ moderator_id: moderatorId, class_id: classId }))
  )
  if (error) throw error
}

export interface ModeratorSchedule {
  id: string
  moderator_id: string
  day_of_week: number
  start_time: string
  end_time: string
  notes: string | null
}

export async function getModeratorSchedules(moderatorId: string): Promise<ModeratorSchedule[]> {
  const { data, error } = await supabase
    .from('moderator_schedules')
    .select('*')
    .eq('moderator_id', moderatorId)
    .order('day_of_week', { ascending: true })
  if (error) throw error
  return (data ?? []) as ModeratorSchedule[]
}

export async function addModeratorSchedule(input: {
  moderatorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  notes?: string
}) {
  const { error } = await supabase.from('moderator_schedules').insert({
    moderator_id: input.moderatorId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    notes: input.notes ?? null,
  })
  if (error) throw error
}

export async function deleteModeratorSchedule(scheduleId: string) {
  const { error } = await supabase.from('moderator_schedules').delete().eq('id', scheduleId)
  if (error) throw error
}

// =====================================================
// Cours : édition / suppression (modérateur de la classe)
// =====================================================
export async function updateCourse(
  courseId: string,
  input: {
    classId?: string
    title?: string
    week?: number
    sessionDate?: string
    description?: string
    audioPath?: string
    videoPath?: string
  }
) {
  const payload: {
    class_id?: string
    title?: string
    week?: number
    session_date?: string | null
    description?: string | null
    audio_url?: string | null
    video_url?: string | null
  } = {}
  if (input.classId !== undefined) payload.class_id = input.classId
  if (input.title !== undefined) payload.title = input.title
  if (input.week !== undefined) payload.week = input.week
  if (input.sessionDate !== undefined) payload.session_date = input.sessionDate || null
  if (input.description !== undefined) payload.description = input.description || null
  if (input.audioPath !== undefined) payload.audio_url = input.audioPath ? courseFileUrl(input.audioPath) : null
  if (input.videoPath !== undefined) payload.video_url = input.videoPath ? courseFileUrl(input.videoPath) : null
  const { error } = await supabase.from('courses').update(payload).eq('id', courseId)
  if (error) throw error
}

export async function deleteCourse(courseId: string) {
  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) throw error
}

// =====================================================
// Mini-tâches pratiques (modérateur définit, étudiant répond)
// =====================================================
export interface MiniTask {
  id: string
  course_id: string
  instruction: string
  created_at: string | null
}

export interface MiniTaskResponse {
  id: string
  student_id: string
  mini_task_id: string
  response: string
  submitted_at: string | null
}

export async function getMiniTask(courseId: string): Promise<MiniTask | null> {
  const { data, error } = await supabase
    .from('mini_tasks')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as MiniTask | null
}

export async function getMiniTasksAll(): Promise<MiniTask[]> {
  const { data, error } = await supabase.from('mini_tasks').select('*')
  if (error) throw error
  return (data ?? []) as MiniTask[]
}

export async function saveMiniTask(courseId: string, instruction: string) {
  const trimmed = instruction.trim()
  if (!trimmed) {
    const { error } = await supabase.from('mini_tasks').delete().eq('course_id', courseId)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('mini_tasks').upsert(
    { course_id: courseId, instruction: trimmed },
    { onConflict: 'course_id' }
  )
  if (error) throw error
}

export async function getMiniTaskResponse(
  studentId: string,
  miniTaskId: string
): Promise<MiniTaskResponse | null> {
  const { data, error } = await supabase
    .from('mini_task_responses')
    .select('*')
    .eq('student_id', studentId)
    .eq('mini_task_id', miniTaskId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as MiniTaskResponse | null
}

export async function saveMiniTaskResponse(studentId: string, miniTaskId: string, response: string) {
  const trimmed = response.trim()
  if (!trimmed) return
  const { error } = await supabase.from('mini_task_responses').upsert(
    {
      student_id: studentId,
      mini_task_id: miniTaskId,
      response: trimmed,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,mini_task_id' }
  )
  if (error) throw error
}

export interface MiniTaskResponseWithStudent extends MiniTaskResponse {
  student?: { first_name: string; last_name: string } | null
}

export async function getMiniTaskResponses(courseId: string): Promise<MiniTaskResponseWithStudent[]> {
  const task = await getMiniTask(courseId)
  if (!task) return []
  const { data, error } = await supabase
    .from('mini_task_responses')
    .select('*, student:profiles(first_name, last_name)')
    .eq('mini_task_id', task.id)
    .order('submitted_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as MiniTaskResponseWithStudent[]
}

// =====================================================
// Plan / support de modération par cours
// =====================================================
export interface ModerationSupport {
  id: string
  course_id: string
  moderator_id: string
  content: string | null
  file_url: string | null
  updated_at: string | null
}

export async function uploadSupportFile(file: File): Promise<string> {
  if (!isCourseMediaFile(file)) {
    throw new Error(
      'Fichier non autorisé pour un support : image, PDF ou document Word de 100 Mo maximum.'
    )
  }
  await checkUploadRate(COURSE_BUCKET)
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `supports/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(COURSE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) throw error
  const { data } = supabase.storage.from(COURSE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function getModerationSupport(courseId: string): Promise<ModerationSupport | null> {
  const { data, error } = await supabase
    .from('moderation_supports')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as ModerationSupport | null
}

export async function getSupportsAll(): Promise<ModerationSupport[]> {
  const { data, error } = await supabase.from('moderation_supports').select('*')
  if (error) throw error
  return (data ?? []) as ModerationSupport[]
}

export async function saveModerationSupport(
  courseId: string,
  input: { content?: string; fileUrl?: string; removeFile?: boolean }
) {
  const hasContent = (input.content?.trim() ?? '') !== ''
  const hasFile = !input.removeFile && Boolean(input.fileUrl)
  if (!hasContent && !hasFile) {
    const { error } = await supabase.from('moderation_supports').delete().eq('course_id', courseId)
    if (error) throw error
    return
  }
  const { data: userData } = await supabase.auth.getUser()
  const moderatorId = userData.user?.id ?? ''
  const { error } = await supabase.from('moderation_supports').upsert(
    {
      course_id: courseId,
      moderator_id: moderatorId,
      content: input.content?.trim() || null,
      file_url: input.removeFile ? null : input.fileUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'course_id' }
  )
  if (error) throw error
}

// =====================================================
// Rapports de modération (écrits + historique)
// =====================================================
export interface ModerationReport {
  id: string
  moderator_id: string
  course_id: string | null
  session_date: string | null
  content: string
  created_at: string | null
  course?: Pick<Course, 'title' | 'week'> | null
}

export async function createModerationReport(input: {
  courseId?: string
  sessionDate?: string
  content: string
}) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Session introuvable.')
  const { error } = await supabase.from('moderation_reports').insert({
    moderator_id: userData.user.id,
    course_id: input.courseId ?? null,
    session_date: input.sessionDate || null,
    content: input.content.trim(),
  })
  if (error) throw error
}

export async function getModerationReports(moderatorId: string): Promise<ModerationReport[]> {
  const { data, error } = await supabase
    .from('moderation_reports')
    .select('*, course:courses(title, week)')
    .eq('moderator_id', moderatorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ModerationReport[]
}

export async function deleteModerationReport(reportId: string) {
  const { error } = await supabase.from('moderation_reports').delete().eq('id', reportId)
  if (error) throw error
}

// =====================================================
// Création de compte par l'administrateur (RPC security definer)
// =====================================================
export async function adminCreateUser(input: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'MODERATEUR' | 'ADMINISTRATEUR' | 'ETUDIANT'
  phone?: string
  tribe?: string
  department?: string
}) {
  const { error } = await supabase.rpc('admin_create_user', {
    p_email: input.email,
    p_password: input.password,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_role: input.role,
    p_phone: input.phone ?? null,
    p_tribe: input.tribe ?? null,
    p_department: input.department ?? null,
  })
  if (error) throw error
}

// ---- Soul Tracking (Fiche de suivi d'âme) ----

export interface SoulTracking {
  id: string
  student_id: string
  moderator_id: string
  attendance_notes: string | null
  attendance_rating: number | null
  meditation_observations: string | null
  social_context: string | null
  created_at: string
  updated_at: string
}

export interface SoulEntry {
  id: string
  tracking_id: string
  moderator_id: string
  category: 'assiduite' | 'meditation' | 'social' | 'general'
  content: string
  created_at: string
}

export async function getSoulTracking(studentId: string): Promise<SoulTracking | null> {
  const { data, error } = await supabase
    .from('soul_tracking')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSoulTracking(
  studentId: string,
  fields: Partial<Pick<SoulTracking, 'attendance_notes' | 'attendance_rating' | 'meditation_observations' | 'social_context'>>
): Promise<SoulTracking> {
  const { data: userData } = await supabase.auth.getUser()
  const moderatorId = userData.user?.id
  if (!moderatorId) throw new Error('Non authentifié')

  const { data: existing } = await supabase
    .from('soul_tracking')
    .select('id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('soul_tracking')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('soul_tracking')
      .insert({ student_id: studentId, moderator_id: moderatorId, ...fields })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function getSoulEntries(trackingId: string): Promise<SoulEntry[]> {
  const { data, error } = await supabase
    .from('soul_tracking_entries')
    .select('*')
    .eq('tracking_id', trackingId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addSoulEntry(
  trackingId: string,
  category: SoulEntry['category'],
  content: string
): Promise<SoulEntry> {
  const { data: userData } = await supabase.auth.getUser()
  const moderatorId = userData.user?.id
  if (!moderatorId) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('soul_tracking_entries')
    .insert({ tracking_id: trackingId, moderator_id: moderatorId, category, content })
    .select()
    .single()
  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Annonces (modérateur → étudiants de sa classe)
// ──────────────────────────────────────────────

export interface Announcement {
  id: string
  moderator_id: string
  class_id: string
  title: string
  content: string
  created_at: string
  moderator?: { first_name: string; last_name: string } | null
  class?: Pick<ClassRow, 'name'> | null
}

export async function getAnnouncements(classId?: string): Promise<Announcement[]> {
  let query = supabase
    .from('announcements')
    .select('*, moderator:profiles(first_name, last_name), class:classes(name)')
    .order('created_at', { ascending: false })
  if (classId) query = query.eq('class_id', classId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Announcement[]
}

export async function createAnnouncement(classId: string, title: string, content: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Non authentifié')
  const { error } = await supabase.from('announcements').insert({
    moderator_id: userData.user.id,
    class_id: classId,
    title: title.trim(),
    content: content.trim(),
  })
  if (error) throw error
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
  if (error) throw error
}

// ──────────────────────────────────────────────
// Quiz
// ──────────────────────────────────────────────

export interface Quiz {
  id: string
  course_id: string
  title: string
  description: string
  time_limit_minutes: number | null
  passing_score: number
  question_count?: number
  attempt_count?: number
  avg_score?: number | null
}

export interface QuizQuestion {
  id: string
  question_text: string
  options: string[]
  points: number
  order_index: number
}

export interface QuizAttempt {
  score: number
  total_points: number
  max_points: number
  is_passed: boolean
  passing_score: number
  questions: {
    question_id: string
    question_text: string
    options: string[]
    correct_index: number
    your_answer: number | null
    is_correct: boolean
    points: number
  }[]
}

export async function getCourseQuizzes(courseId: string): Promise<Quiz[]> {
  const { data, error } = await supabase.rpc('get_course_quizzes', { p_course_id: courseId })
  if (error) throw error
  return data ?? []
}

export async function getQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[]; attempted: boolean }> {
  const { data, error } = await supabase.rpc('get_quiz_with_questions', { p_quiz_id: quizId })
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

// =====================================================
// Versets à méditer par classe
// =====================================================
export interface MeditationVerse {
  id: string
  verse_text: string
  verse_reference: string
  active: boolean
  created_at: string
}

export async function getDailyVerse(classId: string): Promise<{ verse_text: string; verse_reference: string } | null> {
  const { data, error } = await supabase.rpc('get_daily_verse', { p_class_id: classId })
  if (error) throw error
  return (data ?? null) as { verse_text: string; verse_reference: string } | null
}

export async function getClassVerses(classId: string): Promise<MeditationVerse[]> {
  const { data, error } = await supabase.rpc('get_class_verses', { p_class_id: classId })
  if (error) throw error
  return (data ?? []) as MeditationVerse[]
}

export async function addVerse(classId: string, verseText: string, verseReference: string): Promise<void> {
  const { error } = await supabase.rpc('add_verse', {
    p_class_id: classId,
    p_verse_text: verseText.trim(),
    p_verse_reference: verseReference.trim(),
  })
  if (error) throw error
}

export async function removeVerse(verseId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_verse', { p_verse_id: verseId })
  if (error) throw error
}

export async function toggleVerseActive(verseId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_verse_active', { p_verse_id: verseId })
  if (error) throw error
}

// =====================================================
// Admin : attribution de classe à un étudiant
// =====================================================
export async function setStudentClass(studentId: string, classId: string): Promise<void> {
  const { error } = await supabase.rpc('set_student_class', {
    p_student_id: studentId,
    p_class_id: classId,
  })
  if (error) throw error
}
