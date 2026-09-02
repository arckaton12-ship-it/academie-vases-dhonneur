import { supabase } from './supabase'
import { sniffMime } from './fileValidation'
import type { ClassRow, Course, WebhookConfig } from './types'

const COURSE_BUCKET = 'cours'
const DEVOIRS_BUCKET = 'devoirs'
const NOTES_BUCKET = 'notes-manuscrites'
const RESUMES_BUCKET = 'resumes'

export const COURSE_MEDIA_MAX_SIZE = 100 * 1024 * 1024
export const ASSIGNMENT_FILE_MAX_SIZE = 10 * 1024 * 1024
export const NOTE_FILE_MAX_SIZE = 10 * 1024 * 1024
export const RESUME_FILE_MAX_SIZE = 10 * 1024 * 1024

const COURSE_FILE_TYPES = /^(audio\/|video\/|image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)/
const ASSIGNMENT_FILE_TYPES = /^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|audio\/|video\/)/
const NOTE_FILE_TYPES = /^(image\/|application\/pdf)/
const RESUME_FILE_TYPES = /^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/

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

export function isResumeFile(file: File): boolean {
  return isAllowedUpload(file, RESUME_FILE_MAX_SIZE, RESUME_FILE_TYPES)
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

export async function getStudentCourse(classId: string, week?: number): Promise<Course | null> {
  let query = supabase
    .from('courses')
    .select('*, class:classes(name, level)')
    .eq('class_id', classId)
  if (week !== undefined) {
    query = query.eq('week', week)
  } else {
    query = query.order('week', { ascending: false }).limit(1)
  }
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return (data ?? null) as Course | null
}

export async function getCurrentWeekForClass(classId: string): Promise<number> {
  const { data, error } = await supabase
    .from('courses')
    .select('week, session_date')
    .eq('class_id', classId)
    .order('week', { ascending: true })
  if (error) throw error
  if (!data || data.length === 0) return 1
  const now = new Date()
  let lastPassedWeek = 1
  let nextUpcomingWeek: number | null = null
  for (const course of data) {
    if (course.session_date) {
      const sessionDate = new Date(course.session_date + 'T23:59:59')
      if (sessionDate < now) {
        lastPassedWeek = course.week
      } else if (nextUpcomingWeek === null) {
        nextUpcomingWeek = course.week
      }
    }
  }
  return nextUpcomingWeek ?? lastPassedWeek
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
  audioUrl?: string
  videoUrl?: string
}): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      class_id: input.classId,
      title: input.title,
      week: input.week,
      session_date: input.sessionDate || null,
      description: input.description ?? null,
      audio_url: input.audioUrl || (input.audioPath ? courseFileUrl(input.audioPath) : null),
      video_url: input.videoUrl || (input.videoPath ? courseFileUrl(input.videoPath) : null),
    })
    .select()
    .single()
  if (error) throw error
  return data as Course
}

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
    audioUrl?: string
    videoUrl?: string
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
  if (input.audioUrl !== undefined) payload.audio_url = input.audioUrl || null
  else if (input.audioPath !== undefined) payload.audio_url = input.audioPath ? courseFileUrl(input.audioPath) : null
  if (input.videoUrl !== undefined) payload.video_url = input.videoUrl || null
  else if (input.videoPath !== undefined) payload.video_url = input.videoPath ? courseFileUrl(input.videoPath) : null
  const { error } = await supabase.from('courses').update(payload).eq('id', courseId)
  if (error) throw error
}

export async function deleteCourse(courseId: string) {
  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) throw error
}

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

export async function getLandingAvatars(): Promise<{ url: string | null; name: string }[]> {
  const { data, error } = await supabase.rpc('get_landing_avatars')
  if (error) throw error
  return (data ?? []).map((r: { avatar_url: string | null; first_name: string }) => ({
    url: r.avatar_url,
    name: r.first_name || '',
  }))
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
// Dynamic course dates
// =====================================================

export async function setClassStartDate(classId: string, startDate: string): Promise<void> {
  const { error } = await supabase.rpc('set_class_start_date', {
    p_class_id: classId,
    p_start_date: startDate,
  })
  if (error) throw error
}

export async function generateCourseDates(classId: string, startDate: string): Promise<number> {
  const { data, error } = await supabase.rpc('generate_course_dates', {
    p_class_id: classId,
    p_start_date: startDate,
  })
  if (error) throw error
  return data as number
}

// =====================================================
// Audio upload to Supabase Storage
// =====================================================

const AUDIO_BUCKET = 'cours-audio'

export async function uploadCourseAudio(file: File, courseId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'mp3'
  const path = `courses/${courseId}/audio.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'audio/mpeg' })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}

export async function deleteCourseAudio(courseId: string): Promise<void> {
  const { data: files } = await supabase.storage.from(AUDIO_BUCKET).list(`courses/${courseId}`)
  if (files && files.length > 0) {
    const paths = files.map(f => `courses/${courseId}/${f.name}`)
    await supabase.storage.from(AUDIO_BUCKET).remove(paths)
  }
}

// =====================================================
// Plan / support de modération par cours
// =====================================================
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

// =====================================================
// Résumé du cours (fichier joint importé par l'étudiant — bucket « resumes »)
// =====================================================

export async function uploadResumeFile(file: File, studentId: string): Promise<string> {
  if (!isResumeFile(file)) {
    throw new Error('Fichier non autorisé pour un résumé : image, PDF ou document Word de 10 Mo maximum.')
  }
  const sniffed = await sniffMime(file)
  if (sniffed && sniffed.mime !== file.type && !file.type.startsWith(sniffed.mime.split('/')[0])) {
    throw new Error(`Type de fichier réel (${sniffed.mime}) ne correspond pas au type déclaré.`)
  }
  await checkUploadRate(RESUMES_BUCKET)
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${studentId}/resumes/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(RESUMES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) throw error
  const { data } = supabase.storage.from(RESUMES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteResumeFile(publicUrl: string): Promise<void> {
  try {
    const bucket = RESUMES_BUCKET
    const marker = `${bucket}/`
    const idx = publicUrl.indexOf(marker)
    if (idx < 0) return
    const path = publicUrl.slice(idx + marker.length).split('?')[0]
    if (!path) return
    await supabase.storage.from(bucket).remove([path])
  } catch {
    // suppression best-effort : un orphelin ne bloque jamais la sauvegarde
  }
}


