import { supabase } from './supabase'
import { getSafeSession } from './auth'
import type { SoulTracking, SoulEntry, ModerationReport, ModerationSupport } from './types'

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
  const session = getSafeSession()
  const moderatorId = session?.user?.id ?? ''
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

export async function createModerationReport(input: {
  courseId?: string
  sessionDate?: string
  content: string
}) {
  const session = getSafeSession()
  if (!session) throw new Error('Session introuvable.')
  const { error } = await supabase.from('moderation_reports').insert({
    moderator_id: session.user.id,
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
  const session = getSafeSession()
  const moderatorId = session?.user?.id
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
  const session = getSafeSession()
  const moderatorId = session?.user?.id
  if (!moderatorId) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('soul_tracking_entries')
    .insert({ tracking_id: trackingId, moderator_id: moderatorId, category, content })
    .select()
    .single()
  if (error) throw error
  return data
}
