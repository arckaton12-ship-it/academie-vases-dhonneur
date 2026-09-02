import { supabase } from './supabase'
import { sendPushNotification } from './pushSend'
import type { ClassRow, Course, Streak, BadgeProgress, BadgeRow, Certificate, Attendance, StudentProgress, ServiceRecord, MiniTask, MiniTaskResponse, MiniTaskResponseWithStudent, MiniTaskResponseRow, WeeklyBilan } from './types'
import { getClassCourses } from './courseData'

export async function getBadgeProgress(): Promise<BadgeProgress[]> {
  const { data, error } = await supabase.rpc('get_badge_progress')
  if (error) throw error
  return (data ?? []) as BadgeProgress[]
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

  // Detect newly earned badges and send push
  const { data: existingBadges } = await supabase.from('badges').select('badge_type').eq('student_id', studentId)
  const existingTypes = new Set((existingBadges ?? []).map(b => b.badge_type))

  for (const badgeType of eligible) {
    await supabase
      .from('badges')
      .upsert({ student_id: studentId, badge_type: badgeType }, { onConflict: 'student_id,badge_type' })
  }

  const newBadges = eligible.filter(b => !existingTypes.has(b))
  for (const badge of newBadges) {
    const names: Record<string, string> = {
      'premiere-semaine': 'Première Semaine',
      'premier-mois': 'Premier Mois',
      'assidu-huit': 'Assidu (8 semaines)',
      'cinq-resumes': '5 Fiches',
      'dix-resumes': '10 Fiches',
      'cycle-1': 'Cycle 1',
      'cycle-2': 'Cycle 2',
      'cycle-3': 'Cycle 3',
    }
    sendPushNotification({ userId: studentId, title: 'Badge débloqué !', body: `Tu as obtenu le badge "${names[badge] ?? badge}".`, tag: 'badge' }).catch(() => {})
  }

  return getBadges(studentId)
}

export async function getAllBadges(): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('earned_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as BadgeRow[]
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

export async function getStreaks(): Promise<Streak[]> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .order('consecutive_weeks', { ascending: false })
  if (error) throw error
  return (data ?? []) as Streak[]
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

  if (attendances.error) console.error('[getStudentProgress] attendances error:', JSON.stringify({ message: attendances.error.message, code: attendances.error.code, details: attendances.error.details, hint: attendances.error.hint }))
  if (resumes.error) console.error('[getStudentProgress] resumes error:', JSON.stringify({ message: resumes.error.message, code: resumes.error.code, details: resumes.error.details, hint: resumes.error.hint }))
  if (submissions.error) console.error('[getStudentProgress] submissions error:', JSON.stringify({ message: submissions.error.message, code: submissions.error.code, details: submissions.error.details, hint: submissions.error.hint }))

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

export async function getAllMiniTaskResponses(): Promise<MiniTaskResponseRow[]> {
  const { data, error } = await supabase.from('mini_task_responses').select('*')
  if (error) throw error
  return (data ?? []) as MiniTaskResponseRow[]
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

export async function getWeeklyBilan(studentId: string, weekNumber: number): Promise<WeeklyBilan | null> {
  const { data, error } = await supabase
    .from('weekly_bilan')
    .select('*')
    .eq('student_id', studentId)
    .eq('week_number', weekNumber)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as WeeklyBilan | null
}

export async function saveWeeklyBilan(bilan: Omit<WeeklyBilan, 'id' | 'created_at'>) {
  const { error } = await supabase
    .from('weekly_bilan')
    .upsert(bilan, { onConflict: 'student_id,week_number' })
  if (error) throw error
}

export async function getAllBilansForWeek(weekNumber: number): Promise<(WeeklyBilan & { student?: { first_name: string; last_name: string; class_id: string | null } | null })[]> {
  const { data, error } = await supabase
    .from('weekly_bilan')
    .select('*, student:profiles(first_name, last_name, class_id)')
    .eq('week_number', weekNumber)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as any
}

export async function getModNotes(courseId: string): Promise<{ id: string | null; notes: string; updated_at: string | null }> {
  const { data, error } = await supabase.rpc('get_mod_notes', { p_course_id: courseId })
  if (error) throw error
  return data as { id: string | null; notes: string; updated_at: string | null }
}

export async function saveModNotes(courseId: string, notes: string): Promise<void> {
  const { error } = await supabase.rpc('save_mod_notes', { p_course_id: courseId, p_notes: notes })
  if (error) throw error
}

export async function getBilanPreferences(studentId: string) {
  const { data, error } = await supabase
    .from('bilan_preferences')
    .select('*')
    .eq('student_id', studentId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function saveBilanPreferences(studentId: string, days: number[]) {
  const { data, error } = await supabase
    .from('bilan_preferences')
    .upsert({ student_id: studentId, bilan_days: days, updated_at: new Date().toISOString() }, { onConflict: 'student_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function awardXp(
  studentId: string,
  action: string,
  refId?: string,
  refType?: string,
  bonusXp?: number
): Promise<{ success: boolean; xp_awarded?: number; total_xp?: number; level?: number } | null> {
  try {
    const { data, error } = await supabase.rpc('award_xp', {
      p_student_id: studentId,
      p_action: action,
      ...(refId ? { p_ref_id: refId } : {}),
      ...(refType ? { p_ref_type: refType } : {}),
      ...(bonusXp ? { p_bonus_xp: bonusXp } : {}),
    })
    if (error) return null
    return data
  } catch {
    return null
  }
}
