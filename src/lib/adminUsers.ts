import { supabase } from './supabase'
import type { ClassRow, StudentProfile, ModeratorProfile, ModeratorSchedule, PaginatedResult } from './types'
import { sendEnrollmentToSheets } from './googleSheets'

export async function getStudents(): Promise<StudentProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, class:classes(name, level)')
    .eq('role', 'ETUDIANT')
    .order('last_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as StudentProfile[]
}

export async function deleteStudent(studentId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_student', { p_student_id: studentId })
  if (error) throw error
}

export async function advanceStudent(studentId: string, newClassId: string) {
  const { error } = await supabase.rpc('advance_student', {
    p_student_id: studentId,
    p_new_class_id: newClassId,
  })
  if (error) throw error
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
  const { data: prev, error: fetchErr } = await supabase
    .from('profiles')
    .select('meditation_grade')
    .eq('id', userId)
    .single()
  if (fetchErr) throw fetchErr

  const { error } = await supabase
    .from('profiles')
    .update({ meditation_grade: grade })
    .eq('id', userId)
  if (error) throw error

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { error: logErr } = await supabase
      .from('grade_audit_log')
      .insert({
        student_id: userId,
        graded_by: user.id,
        grade_type: 'meditation',
        ref_id: userId,
        old_grade: prev.meditation_grade,
        new_grade: grade,
      })
    if (logErr) throw logErr
  }
}

// =====================================================
// Gestion des modérateurs (admin) : rôle, classes, planning
// =====================================================
export async function setModeratorRole(userId: string, role: 'MODERATEUR' | 'ETUDIANT' | 'ADMIN_CLASSE') {
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
  specificDate?: string
}) {
  const { error } = await supabase.from('moderator_schedules').insert({
    moderator_id: input.moderatorId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    notes: input.notes ?? null,
    specific_date: input.specificDate ?? null,
  })
  if (error) throw error
}

export async function deleteModeratorSchedule(scheduleId: string) {
  const { error } = await supabase.from('moderator_schedules').delete().eq('id', scheduleId)
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
  role: 'MODERATEUR' | 'ADMINISTRATEUR' | 'ETUDIANT' | 'ADMIN_CLASSE'
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
  if (input.role === 'ETUDIANT') {
    sendEnrollmentToSheets({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      role: input.role,
    }).catch(() => {})
  }
}

export async function assignAdminClassClass(adminId: string, classId: string): Promise<void> {
  const { error } = await supabase.from('admin_class_classes').upsert({ admin_id: adminId, class_id: classId }, { onConflict: 'admin_id,class_id' })
  if (error) throw error
}

export async function removeAdminClassClass(adminId: string, classId: string): Promise<void> {
  const { error } = await supabase.from('admin_class_classes').delete().eq('admin_id', adminId).eq('class_id', classId)
  if (error) throw error
}

export async function getAdminClassClasses(adminId: string): Promise<string[]> {
  const { data, error } = await supabase.from('admin_class_classes').select('class_id').eq('admin_id', adminId)
  if (error) throw error
  return (data ?? []).map(r => r.class_id)
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

export async function getStudentsPaginated(
  page: number = 1,
  pageSize: number = 50,
  search?: string,
  classId?: string
): Promise<PaginatedResult<StudentProfile>> {
  const { data, error } = await supabase.rpc('getStudentsPaginated', {
    p_page: page,
    p_page_size: pageSize,
    p_search: search || null,
    p_class_id: classId || null,
  })
  if (error) throw error
  const rows = (data ?? []) as (StudentProfile & { total_count: number })[]
  const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { data: rows, totalCount }
}

export async function searchProfiles(
  search: string,
  page: number = 1,
  pageSize: number = 20,
  role?: string
): Promise<PaginatedResult<{ id: string; email: string; first_name: string; last_name: string; role: string; class_id: string | null; avatar_url: string | null }>> {
  const { data, error } = await supabase.rpc('searchProfilesPaginated', {
    p_search: search,
    p_page: page,
    p_page_size: pageSize,
    p_role: role || null,
  })
  if (error) throw error
  const rows = (data ?? []) as any[]
  const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { data: rows, totalCount }
}
