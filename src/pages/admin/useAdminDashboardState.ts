import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, toastError } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { generateSecurePassword } from '@/lib/rateLimit'
import { sendSaturdayReminders } from '@/lib/courses'
import {
  getClasses,
  getCourses,
  getStudents,
  getSubmissions,
  getClassCourses,
  getStudentProgress,
  getAttendances,
  setAccessActive,
  setMeditationGrade,
  setModeratorRole,
  getModerators,
  getModeratorClasses,
  getModeratorSchedules,
  setModeratorClasses,
  addModeratorSchedule,
  deleteModeratorSchedule,
  adminCreateUser,
  getStreaks,
  getAllBadges,
  getAllResumes,
  getAllMiniTaskResponses,
  setStudentClass,
  getClassVerses,
  addVerse,
  removeVerse,
  toggleVerseActive,
  setVerseDay,
  ClassRow,
  Course,
  StudentProfile,
  Submission,
  StudentProgress,
  ModeratorProfile,
  ModeratorSchedule,
  Attendance,
  Streak,
  BadgeRow,
  MiniTaskResponseRow,
  MeditationVerse,
} from '@/lib/courses'
import { getCurrentProfile } from '@/lib/auth'
import {
  graduationLevelFor,
  isAlumni,
  promotionFromDate,
  studentStatus,
  type StudentStatus,
} from '@/lib/promotions'
import { ExportRow, exportStudentBulletinPDF } from '@/lib/export'
import { createConversation } from '@/lib/messaging'

export type Section = 'vue' | 'gestion' | 'cours_quiz' | 'notes' | 'messagerie' | 'annonces' | 'export' | 'parametres' | 'cours' | 'classes' | 'etudiants' | 'moderateurs' | 'meditation' | 'notation' | 'quiz' | 'demandes' | 'admin_classe'

export const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

let saturdayRemindersSent = false

interface AdminProfile {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export function useAdminDashboardState() {
  const navigate = useNavigate()

  const [section, setSection] = useState<Section>('vue')

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [allBadges, setAllBadges] = useState<BadgeRow[]>([])
  const [allResumes, setAllResumes] = useState<{ student_id: string; course_id: string }[]>([])
  const [miniResponses, setMiniResponses] = useState<MiniTaskResponseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classCourses, setClassCourses] = useState<Course[]>([])
  const [classStudents, setClassStudents] = useState<StudentProfile[]>([])

  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null)
  const profileCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profileStudentId && profileCardRef.current) {
      profileCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [profileStudentId])

  const [bulletin, setBulletin] = useState<{ progress: StudentProgress; courses: Course[] } | null>(null)
  const [bulletinLoading, setBulletinLoading] = useState(false)
  const [meditationDraft, setMeditationDraft] = useState('')
  const [bulletinMsg, setBulletinMsg] = useState<string | null>(null)
  const [accessMsg, setAccessMsg] = useState<string | null>(null)
  const [exportClassId, setExportClassId] = useState('')

  const [moderators, setModerators] = useState<ModeratorProfile[]>([])
  const [moderatorClasses, setModeratorClassesState] = useState<Record<string, string[]>>({})
  const [moderatorSchedules, setModeratorSchedulesState] = useState<Record<string, ModeratorSchedule[]>>({})
  const [moderatorMsg, setModeratorMsg] = useState<string | null>(null)
  const [promoteStudentId, setPromoteStudentId] = useState('')
  const [slotDrafts, setSlotDrafts] = useState<
    Record<string, { day: string; start: string; end: string; notes: string; date: string }>
  >({})
  const [slotSavingId, setSlotSavingId] = useState<string | null>(null)

  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'MODERATEUR',
    phone: '',
    tribe: '',
    department: '',
  })
  const [accountMsg, setAccountMsg] = useState<string | null>(null)
  const [accountSaving, setAccountSaving] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [showModPwd, setShowModPwd] = useState(false)

  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null)

  // ---- Versets à méditer
  const [verseClassId, setVerseClassId] = useState('')
  const [verses, setVerses] = useState<MeditationVerse[]>([])
  const [verseText, setVerseText] = useState('')
  const [verseReference, setVerseReference] = useState('')
  const [verseMsg, setVerseMsg] = useState<string | null>(null)
  const [verseSaving, setVerseSaving] = useState(false)
  const [verseLoading, setVerseLoading] = useState(false)
  const [verseDay, setVerseDayVal] = useState<number | ''>('')

  // ---- Students filter + sort
  const [studentFilterClass, setStudentFilterClass] = useState('')
  const [studentFilterPromotion, setStudentFilterPromotion] = useState('')
  const [studentFilterStatus, setStudentFilterStatus] = useState<'' | StudentStatus | 'ANCIENS'>('')
  const [studentSort, setStudentSort] = useState<'name' | 'class' | 'date'>('name')
  const [studentSearch, setStudentSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ---- Paginated student list (client-side from filteredStudents)
  const [studentPage, setStudentPage] = useState(1)
  const STUDENT_PAGE_SIZE = 50

  // Settings form state
  const [formFirst, setFormFirst] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileDone, setProfileDone] = useState<string | null>(null)

  useEffect(() => {
    getCurrentProfile()
      .then((p) => {
        if (p) {
          setAdminProfile(p as AdminProfile)
          setFormFirst(p.first_name ?? '')
          setFormName(p.last_name ?? '')
          setFormEmail(p.email ?? '')
        }
      })
      .catch(() => undefined)
    Promise.all([
      getStudents(),
      getClasses(),
      getCourses(),
      getSubmissions(),
      getAttendances(),
      getStreaks(),
      getAllBadges(),
      getAllResumes(),
      getAllMiniTaskResponses(),
    ])
      .then(async ([s, c, co, su, at, st, badges, resumes, minis]) => {
        setStudents(s)
        setClasses(c)
        setCourses(co)
        setSubmissions(su)
        setAttendances(at)
        setStreaks(st)
        setAllBadges(badges)
        setAllResumes(resumes)
        setMiniResponses(minis)
        if (c.length > 0) {
          setSelectedClassId(c[0].id)
          const [courseData, studentData] = await Promise.all([
            getClassCourses(c[0].id),
            s.filter((st) => st.class_id === c[0].id),
          ])
          setClassCourses(courseData)
          setClassStudents(studentData)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false))
    loadModerators().catch(() => undefined)
    if (!saturdayRemindersSent) {
      saturdayRemindersSent = true
      sendSaturdayReminders().catch(() => {})
    }
  }, [])

  // Realtime refresh: when profiles table changes, reload students
  const refreshStudents = useCallback(() => {
    getStudents().then(setStudents).catch(() => {})
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('admin-profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refreshStudents)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [refreshStudents])

  const loadModerators = useCallback(async () => {
    const mods = await getModerators()
    setModerators(mods)
    const classesMap: Record<string, string[]> = {}
    const schedulesMap: Record<string, ModeratorSchedule[]> = {}
    await Promise.all(
      mods.map(async (m) => {
        const [cls, sched] = await Promise.all([
          getModeratorClasses(m.id),
          getModeratorSchedules(m.id),
        ])
        classesMap[m.id] = cls.map((c) => c.id)
        schedulesMap[m.id] = sched
      })
    )
    setModeratorClassesState(classesMap)
    setModeratorSchedulesState(schedulesMap)
  }, [])

  const loadAll = useCallback(async () => {
    const [sRes, cRes, coRes, suRes, atRes, stRes, badgesRes, resumesRes, minisRes] = await Promise.allSettled([
      getStudents(),
      getClasses(),
      getCourses(),
      getSubmissions(),
      getAttendances(),
      getStreaks(),
      getAllBadges(),
      getAllResumes(),
      getAllMiniTaskResponses(),
    ])
    if (sRes.status === 'fulfilled') setStudents(sRes.value)
    if (cRes.status === 'fulfilled') setClasses(cRes.value)
    if (coRes.status === 'fulfilled') setCourses(coRes.value)
    if (suRes.status === 'fulfilled') setSubmissions(suRes.value)
    if (atRes.status === 'fulfilled') setAttendances(atRes.value)
    if (stRes.status === 'fulfilled') setStreaks(stRes.value)
    if (badgesRes.status === 'fulfilled') setAllBadges(badgesRes.value)
    if (resumesRes.status === 'fulfilled') setAllResumes(resumesRes.value)
    if (minisRes.status === 'fulfilled') setMiniResponses(minisRes.value)
  }, [])

  const byClass = useMemo(() => {
    const studentCount = new Map<string, number>()
    for (const s of students) {
      if (s.class_id) studentCount.set(s.class_id, (studentCount.get(s.class_id) ?? 0) + 1)
    }
    const courseCount = new Map<string, number>()
    for (const c of courses) {
      if (c.class_id) courseCount.set(c.class_id, (courseCount.get(c.class_id) ?? 0) + 1)
    }
    return classes.map((c) => ({
      className: c.name,
      students: studentCount.get(c.id) ?? 0,
      courses: courseCount.get(c.id) ?? 0,
    }))
  }, [classes, students, courses])

  const graded = useMemo(() => submissions.filter((s) => s.grade !== null && s.grade !== undefined), [submissions])
  const averageGrade = graded.length
    ? (graded.reduce((acc, s) => acc + Number(s.grade), 0) / graded.length).toFixed(2)
    : '—'

  const submissionsByStudent = useMemo(() => {
    const map = new Map<string, Submission[]>()
    for (const s of submissions) {
      const list = map.get(s.student_id) ?? []
      list.push(s)
      map.set(s.student_id, list)
    }
    return map
  }, [submissions])

  const averagePresence = useMemo(() => {
    const coursesByClass = new Map<string, number>()
    for (const c of courses) {
      if (c.class_id) coursesByClass.set(c.class_id, (coursesByClass.get(c.class_id) ?? 0) + 1)
    }
    const attendedByStudent = new Map<string, number>()
    for (const a of attendances) {
      attendedByStudent.set(a.student_id, (attendedByStudent.get(a.student_id) ?? 0) + 1)
    }
    const rates = students
      .map((s) => {
        const total = s.class_id ? coursesByClass.get(s.class_id) ?? 0 : 0
        const attended = attendedByStudent.get(s.id) ?? 0
        return total > 0 ? Math.round((attended / total) * 100) : 0
      })
    if (rates.length === 0) return '—'
    return `${Math.round(rates.reduce((acc, r) => acc + r, 0) / rates.length)}%`
  }, [students, courses, attendances])

  const activeStudents = useMemo(() => students.filter((s) => s.active), [students])
  const studentClassId = useMemo(() => new Map(students.map((s) => [s.id, s.class_id])), [students])

  const resumeCount = allResumes.length
  const resumeRate = activeStudents.length
    ? Math.round((new Set(allResumes.map((r) => r.student_id)).size / activeStudents.length) * 100)
    : 0

  const avgStreak = useMemo(() => {
    const maxByStudent = new Map<string, number>()
    for (const st of streaks) {
      const prev = maxByStudent.get(st.student_id) ?? 0
      if (st.consecutive_weeks > prev) maxByStudent.set(st.student_id, st.consecutive_weeks)
    }
    const values = [...maxByStudent.values()]
    if (values.length === 0) return '—'
    return `${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)} sem.`
  }, [streaks])

  const engagementByClass = useMemo(() => {
    const coursesByClass = new Map<string, number>()
    for (const c of courses) {
      if (c.class_id) coursesByClass.set(c.class_id, (coursesByClass.get(c.class_id) ?? 0) + 1)
    }
    const attendedByStudent = new Map<string, number>()
    for (const a of attendances) {
      attendedByStudent.set(a.student_id, (attendedByStudent.get(a.student_id) ?? 0) + 1)
    }
    const resumeSetByClass = new Map<string, Set<string>>()
    for (const r of allResumes) {
      const cid = studentClassId.get(r.student_id)
      if (!cid) continue
      const set = resumeSetByClass.get(cid) ?? new Set<string>()
      set.add(r.student_id)
      resumeSetByClass.set(cid, set)
    }
    const badgeByClass = new Map<string, number>()
    for (const b of allBadges) {
      const cid = studentClassId.get(b.student_id)
      if (!cid) continue
      badgeByClass.set(cid, (badgeByClass.get(cid) ?? 0) + 1)
    }
    const gradedByClass = new Map<string, { count: number; sum: number }>()
    for (const s of submissions) {
      const cid = studentClassId.get(s.student_id)
      if (!cid || s.grade === null || s.grade === undefined) continue
      const rec = gradedByClass.get(cid) ?? { count: 0, sum: 0 }
      rec.count += 1
      rec.sum += Number(s.grade)
      gradedByClass.set(cid, rec)
    }
    return classes.map((c) => {
      const classStudents = students.filter((s) => s.class_id === c.id && s.active)
      const total = coursesByClass.get(c.id) ?? 0
      const classRates = classStudents.map((s) => {
        const attended = attendedByStudent.get(s.id) ?? 0
        return total > 0 ? Math.round((attended / total) * 100) : 0
      })
      const presence = classRates.length > 0
        ? Math.round(classRates.reduce((a, r) => a + r, 0) / classRates.length)
        : 0
      const graded = gradedByClass.get(c.id)
      return {
        className: c.name,
        students: classStudents.length,
        presence: total > 0 && classStudents.length > 0 ? `${presence}%` : '—',
        resumes: resumeSetByClass.get(c.id)?.size ?? 0,
        badges: badgeByClass.get(c.id) ?? 0,
        graded: graded?.count ?? 0,
        avgGrade: graded && graded.count > 0 ? (graded.sum / graded.count).toFixed(2) : '—',
      }
    })
  }, [classes, students, courses, attendances, allResumes, allBadges, submissions, studentClassId])

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes])

  const graduationLevel = useMemo(() => graduationLevelFor(classes), [classes])

  // Filtered + sorted students
  const filteredStudents = useMemo(() => {
    let list = [...students]
    if (studentFilterClass) {
      list = list.filter((s) => s.class_id === studentFilterClass)
    }
    if (studentFilterPromotion) {
      list = list.filter(
        (s) => promotionFromDate(s.created_at)?.shortLabel === studentFilterPromotion
      )
    }
    if (studentFilterStatus) {
      list = list.filter((s) => {
        const status = studentStatus(s, graduationLevel)
        return studentFilterStatus === 'ANCIENS'
          ? isAlumni(status)
          : status === studentFilterStatus
      })
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase()
      list = list.filter((s) =>
        `${s.last_name} ${s.first_name}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    }
    if (studentSort === 'name') list.sort((a, b) => a.last_name.localeCompare(b.last_name))
    else if (studentSort === 'class') list.sort((a, b) => (a.class?.name ?? 'ZZZ').localeCompare(b.class?.name ?? 'ZZZ'))
    else list.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    return list
  }, [
    students,
    studentFilterClass,
    studentFilterPromotion,
    studentFilterStatus,
    graduationLevel,
    studentSearch,
    studentSort,
  ])

  const studentTotal = filteredStudents.length
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * STUDENT_PAGE_SIZE
    return filteredStudents.slice(start, start + STUDENT_PAGE_SIZE)
  }, [filteredStudents, studentPage])

  const classRows = (): ExportRow[] => byClass.map((r) => [r.className, r.students, r.courses])
  const studentRows = (): ExportRow[] =>
    students.map((s) => [
      `${s.last_name} ${s.first_name}`,
      s.email,
      s.class?.name ?? '—',
      s.tribe ?? '—',
      s.department ?? '—',
    ])

  const classHeaders = ['Classe', 'Étudiants', 'Cours publiés']
  const studentHeaders = ['Étudiant', 'Email', 'Classe', 'Tribu', 'Département']

  const gradeRows = (): ExportRow[] => {
    const filtered = exportClassId ? students.filter((s) => s.class_id === exportClassId) : students
    return filtered.map((s) => {
      const subs = submissionsByStudent.get(s.id) ?? []
      const grades = subs
        .map((x) => x.grade)
        .filter((g): g is number => g !== null && g !== undefined)
      const avg =
        grades.length > 0
          ? (grades.reduce((acc, g) => acc + Number(g), 0) / grades.length).toFixed(2)
          : '—'
      const total = s.class_id
        ? courses.filter((c) => c.class_id === s.class_id).length
        : 0
      const attended = attendances.filter((a) => a.student_id === s.id).length
      const presence = total > 0 ? `${Math.round((attended / total) * 100)}%` : '—'
      return [
        `${s.last_name} ${s.first_name}`,
        s.email,
        s.class?.name ?? '—',
        avg,
        presence,
        String(s.meditation_grade ?? '—'),
      ]
    })
  }
  const gradeHeaders = ['Étudiant', 'Email', 'Classe', 'Moyenne devoirs', 'Présence', 'Méditation']

  const loadClassDetail = useCallback(
    async (classId: string) => {
      setSelectedClassId(classId)
      setError(null)
      try {
        const [courseData, studentData] = await Promise.all([
          getClassCourses(classId),
          getStudents().then((all) => all.filter((s) => s.class_id === classId)),
        ])
        setClassCourses(courseData)
        setClassStudents(studentData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement de la classe.')
      }
    },
    []
  )

  async function openBulletin(studentId: string) {
    setExpandedStudentId(studentId)
    setBulletin(null)
    setBulletinMsg(null)
    setBulletinLoading(true)
    try {
      const freshStudents = await getStudents()
      const st = freshStudents.find((s) => s.id === studentId)
      const [progress, coursesData] = await Promise.all([
        getStudentProgress(studentId),
        st?.class_id ? getClassCourses(st.class_id) : Promise.resolve([]),
      ])
      const meditation = st?.meditation_grade ?? null
      setBulletin({ progress, courses: coursesData })
      setMeditationDraft(meditation === null ? '' : String(meditation))
    } catch (err) {
      setBulletinMsg(err instanceof Error ? err.message : 'Erreur de chargement du bulletin.')
    } finally {
      setBulletinLoading(false)
    }
  }

  async function saveMeditation(studentId: string) {
    const value = meditationDraft.trim()
    const grade = value === '' ? null : Number(value)
    if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 20)) {
      setBulletinMsg('La note de méditation doit être entre 0 et 20.')
      return
    }
    try {
      await setMeditationGrade(studentId, grade)
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, meditation_grade: grade } : s))
      )
      setBulletinMsg('Note de méditation enregistrée.')
      toast('Note de méditation enregistrée.')
    } catch (err) {
      setBulletinMsg(err instanceof Error ? err.message : 'Erreur.')
      toastError('Erreur.')
    }
  }

  async function toggleAccess(studentId: string, current: boolean) {
    try {
      await setAccessActive(studentId, !current)
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, active: !current } : s)))
      setModerators((prev) => prev.map((m) => (m.id === studentId ? { ...m, active: !current } : m)))
      setAccessMsg(current ? 'Accès révoqué.' : 'Accès restauré.')
    } catch (err) {
      setAccessMsg(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function promoteStudent() {
    if (!promoteStudentId) return
    setModeratorMsg(null)
    try {
      await setModeratorRole(promoteStudentId, 'MODERATEUR')
      setModeratorMsg('Étudiant promu modérateur.')
      setPromoteStudentId('')
      await Promise.all([loadModerators(), refreshStudents()])
    } catch (err) {
      setModeratorMsg(err instanceof Error ? err.message : 'Erreur de promotion.')
    }
  }

  const [graduationStudentId, setGraduationStudentId] = useState('')
  const [graduationMsg, setGraduationMsg] = useState<string | null>(null)

  async function promoteToGraduation() {
    if (!graduationStudentId) return
    setGraduationMsg(null)
    try {
      const graduationClass = classes.find(c => c.level === 4)
      if (!graduationClass) { setGraduationMsg('Classe Graduation non trouvée.'); return }
      const { error } = await supabase.from('profiles').update({ class_id: graduationClass.id }).eq('id', graduationStudentId)
      if (error) throw error
      setGraduationMsg('Étudiant promu en Graduation !')
      toast('Étudiant promu en Graduation !')
      setGraduationStudentId('')
      const all = await getStudents()
      setStudents(all)
    } catch (err) {
      setGraduationMsg(err instanceof Error ? err.message : 'Erreur de promotion.')
    }
  }

  async function demoteModerator(moderatorId: string) {
    if (!window.confirm('Repasser ce modérateur en étudiant ?')) return
    setModeratorMsg(null)
    try {
      await setModeratorRole(moderatorId, 'ETUDIANT')
      setModeratorMsg('Modérateur repassé en étudiant.')
      await loadModerators()
    } catch (err) {
      setModeratorMsg(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function toggleModeratorClass(moderatorId: string, classId: string) {
    setModeratorMsg(null)
    let next: string[] = []
    setModeratorClassesState((prev) => {
      const current = prev[moderatorId] ?? []
      next = current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId]
      return { ...prev, [moderatorId]: next }
    })
    try {
      await setModeratorClasses(moderatorId, next)
      setModeratorMsg('Attribution des classes mise à jour.')
    } catch (err) {
      setModeratorMsg(err instanceof Error ? err.message : 'Erreur d\u2019attribution.')
      setModeratorClassesState((prev) => ({ ...prev, [moderatorId]: (prev[moderatorId] ?? []).filter((id) => id !== classId) || prev[moderatorId] }))
    }
  }

  async function addSlot(moderatorId: string) {
    const draft = slotDrafts[moderatorId] ?? { day: '0', start: '09:00', end: '11:00', notes: '', date: '' }
    if (!draft.start || !draft.end) return
    setSlotSavingId(moderatorId)
    setModeratorMsg(null)
    try {
      await addModeratorSchedule({
        moderatorId,
        dayOfWeek: Number(draft.day) || 0,
        startTime: draft.start,
        endTime: draft.end,
        notes: draft.notes.trim() || undefined,
        specificDate: draft.date || undefined,
      })
      const sched = await getModeratorSchedules(moderatorId)
      setModeratorSchedulesState((prev) => ({ ...prev, [moderatorId]: sched }))
      setSlotDrafts((prev) => ({ ...prev, [moderatorId]: { day: '0', start: '09:00', end: '11:00', notes: '', date: '' } }))
      setModeratorMsg('Créneau de modération ajouté.')
    } catch (err) {
      setModeratorMsg(err instanceof Error ? err.message : 'Erreur d\u2019ajout.')
    } finally {
      setSlotSavingId(null)
    }
  }

  async function removeSlot(moderatorId: string, scheduleId: string) {
    setModeratorMsg(null)
    try {
      await deleteModeratorSchedule(scheduleId)
      const sched = await getModeratorSchedules(moderatorId)
      setModeratorSchedulesState((prev) => ({ ...prev, [moderatorId]: sched }))
      setModeratorMsg('Créneau supprimé.')
    } catch (err) {
      setModeratorMsg(err instanceof Error ? err.message : 'Erreur de suppression.')
    }
  }

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault()
    setAccountMsg(null)
    setCreatedPassword(null)
    if (!newAccount.email.trim() || !newAccount.firstName.trim() || !newAccount.lastName.trim()) {
      setAccountMsg('Email, prénom et nom sont obligatoires.')
      return
    }
    // Auto-generate password for moderators
    const pwd = newAccount.role === 'MODERATEUR' && !newAccount.password
      ? generateSecurePassword(14)
      : newAccount.password
    if (!pwd) {
      setAccountMsg('Le mot de passe est obligatoire.')
      return
    }
    setAccountSaving(true)
    try {
      await adminCreateUser({
        email: newAccount.email.trim(),
        password: pwd,
        firstName: newAccount.firstName.trim(),
        lastName: newAccount.lastName.trim(),
        role: newAccount.role as 'MODERATEUR' | 'ADMINISTRATEUR' | 'ETUDIANT' | 'ADMIN_CLASSE',
        phone: newAccount.phone.trim() || undefined,
        tribe: newAccount.tribe.trim() || undefined,
        department: newAccount.department.trim() || undefined,
      })
      if (newAccount.role === 'MODERATEUR') {
        setCreatedPassword(pwd)
        setAccountMsg('Compte modérateur créé. Mot de passe temporaire à transmettre :')
      } else {
        setAccountMsg('Compte créé avec succès.')
      }
      toast('Compte créé.')
      setNewAccount({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'MODERATEUR',
        phone: '',
        tribe: '',
        department: '',
      })
      await loadModerators()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue.'
      console.error('[CoursTab] submit error:', err)
      setError(msg)
      toastError(msg)
    } finally {
      setAccountSaving(false)
    }
  }

  // ---- Versets à méditer
  async function loadVerses(classId: string) {
    setVerseClassId(classId)
    setVerseLoading(true)
    setVerseMsg(null)
    try {
      const data = await getClassVerses(classId)
      setVerses(data)
    } catch (err) {
      setVerseMsg(err instanceof Error ? err.message : 'Erreur de chargement des versets.')
    } finally {
      setVerseLoading(false)
    }
  }

  async function handleAddVerse(e: FormEvent) {
    e.preventDefault()
    if (!verseClassId || !verseText.trim() || !verseReference.trim()) return
    setVerseSaving(true)
    setVerseMsg(null)
    try {
      await addVerse(verseClassId, verseText.trim(), verseReference.trim(), verseDay === '' ? null : verseDay)
      setVerseText('')
      setVerseReference('')
      setVerseDayVal('')
      setVerseMsg('Verset ajouté avec succès.')
      await loadVerses(verseClassId)
    } catch (err) {
      setVerseMsg(err instanceof Error ? err.message : 'Erreur lors de l\'ajout.')
    } finally {
      setVerseSaving(false)
    }
  }

  async function handleRemoveVerse(verseId: string) {
    if (!window.confirm('Supprimer ce verset ?')) return
    setVerseMsg(null)
    try {
      await removeVerse(verseId)
      setVerseMsg('Verset supprimé.')
      if (verseClassId) await loadVerses(verseClassId)
    } catch (err) {
      setVerseMsg(err instanceof Error ? err.message : 'Erreur de suppression.')
    }
  }

  async function handleToggleVerse(verseId: string) {
    setVerseMsg(null)
    try {
      await toggleVerseActive(verseId)
      if (verseClassId) await loadVerses(verseClassId)
    } catch (err) {
      setVerseMsg(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function handleSetVerseDay(verseId: string, dayOfWeek: number | null) {
    setVerseMsg(null)
    try {
      await setVerseDay(verseId, dayOfWeek)
      if (verseClassId) await loadVerses(verseClassId)
    } catch (err) {
      setVerseMsg(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function handleAssignClass(studentId: string, classId: string) {
    try {
      await setStudentClass(studentId, classId || '')
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== studentId) return s
          const cls = classes.find((c) => c.id === classId)
          return { ...s, class_id: classId || null, class: cls ? { name: cls.name, level: cls.level } : null }
        })
      )
      setAccessMsg('Classe attribuée avec succès.')
      toast('Classe attribuée.')
    } catch (err) {
      setAccessMsg(err instanceof Error ? err.message : 'Erreur d\'attribution de classe.')
      toastError('Erreur.')
    }
  }

  function downloadBulletin(student: StudentProfile) {
    const subs = submissionsByStudent.get(student.id) ?? []
    const progress = bulletin?.progress ?? { presenceRate: 0, resumeRate: 0 }
    exportStudentBulletinPDF({
      filename: `bulletin-${student.last_name}-${student.first_name}.pdf`,
      studentName: `${student.first_name} ${student.last_name}`,
      className: student.class?.name ?? 'Sans classe',
      courses: bulletin?.courses ?? [],
      submissions: subs,
      meditationGrade: student.meditation_grade,
      presenceRate: progress.presenceRate,
      resumeRate: progress.resumeRate,
    })
  }

  const selectedClass = classById.get(selectedClassId)

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!adminProfile) return
    setProfileSaving(true)
    setProfileError(null)
    setProfileDone(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: formFirst, last_name: formName })
        .eq('id', adminProfile.id)
      if (error) throw error
      setAdminProfile((prev) => prev ? { ...prev, first_name: formFirst, last_name: formName } : prev)
      setProfileDone('Profil enregistré.')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleMessageUser = async (userId: string) => {
    try {
      await createConversation(userId, 'DIRECT')
      setSection('messagerie')
      toast('Conversation ouverte.')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const adminSections: [string, string][] = [
    ['vue', "Vue d'ensemble"],
    ['classes', 'Classes'],
    ['cours', 'Cours & Quiz'],
    ['notation', 'Notes'],
    ['etudiants', 'Élèves'],
    ['moderateurs', 'Modérateurs'],
    ['admin_classe', 'Admin Classe'],
    ['meditation', 'Méditation'],
  ['quiz', 'Quiz'],
    ['messagerie', 'Messagerie'],
    ['annonces', 'Annonces'],
    ['demandes', 'Demandes'],
    ['export', 'Export'],
    ['parametres', 'Paramètres'],
  ]
  return {
    navigate,
    section,
    setSection,
    adminProfile,
    setAdminProfile,
    students,
    setStudents,
    classes,
    setClasses,
    graduationLevel,
    courses,
    setCourses,
    submissions,
    setSubmissions,
    attendances,
    setAttendances,
    streaks,
    setStreaks,
    allBadges,
    setAllBadges,
    allResumes,
    setAllResumes,
    miniResponses,
    setMiniResponses,
    loading,
    setLoading,
    error,
    setError,
    selectedClassId,
    setSelectedClassId,
    classCourses,
    setClassCourses,
    classStudents,
    setClassStudents,
    expandedStudentId,
    setExpandedStudentId,
    profileStudentId,
    setProfileStudentId,
    profileCardRef,
    bulletin,
    setBulletin,
    bulletinLoading,
    setBulletinLoading,
    meditationDraft,
    setMeditationDraft,
    bulletinMsg,
    setBulletinMsg,
    accessMsg,
    setAccessMsg,
    exportClassId,
    setExportClassId,
    moderators,
    setModerators,
    moderatorClasses,
    setModeratorClassesState,
    moderatorSchedules,
    setModeratorSchedulesState,
    moderatorMsg,
    setModeratorMsg,
    promoteStudentId,
    setPromoteStudentId,
    slotDrafts,
    setSlotDrafts,
    slotSavingId,
    setSlotSavingId,
    newAccount,
    setNewAccount,
    accountMsg,
    setAccountMsg,
    accountSaving,
    setAccountSaving,
    createdPassword,
    setCreatedPassword,
    showModPwd,
    setShowModPwd,
    broadcastText,
    setBroadcastText,
    broadcastSending,
    setBroadcastSending,
    broadcastResult,
    setBroadcastResult,
    verseClassId,
    setVerseClassId,
    verses,
    setVerses,
    verseText,
    setVerseText,
    verseReference,
    setVerseReference,
    verseMsg,
    setVerseMsg,
    verseSaving,
    setVerseSaving,
    verseLoading,
    setVerseLoading,
    verseDay,
    setVerseDayVal,
    studentFilterClass,
    setStudentFilterClass,
    studentFilterPromotion,
    setStudentFilterPromotion,
    studentFilterStatus,
    setStudentFilterStatus,
    studentSort,
    setStudentSort,
    studentSearch,
    setStudentSearch,
    deleteConfirmId,
    setDeleteConfirmId,
    studentPage,
    setStudentPage,
    STUDENT_PAGE_SIZE,
    formFirst,
    setFormFirst,
    formName,
    setFormName,
    formEmail,
    setFormEmail,
    profileSaving,
    setProfileSaving,
    profileError,
    setProfileError,
    profileDone,
    setProfileDone,
    refreshStudents,
    loadModerators,
    loadAll,
    byClass,
    graded,
    averageGrade,
    submissionsByStudent,
    averagePresence,
    activeStudents,
    studentClassId,
    resumeCount,
    resumeRate,
    avgStreak,
    engagementByClass,
    classById,
    filteredStudents,
    studentTotal,
    paginatedStudents,
    classRows,
    studentRows,
    classHeaders,
    studentHeaders,
    gradeRows,
    gradeHeaders,
    loadClassDetail,
    openBulletin,
    saveMeditation,
    toggleAccess,
    promoteStudent,
    graduationStudentId,
    setGraduationStudentId,
    graduationMsg,
    setGraduationMsg,
    promoteToGraduation,
    demoteModerator,
    toggleModeratorClass,
    addSlot,
    removeSlot,
    handleCreateAccount,
    loadVerses,
    handleAddVerse,
    handleRemoveVerse,
    handleToggleVerse,
    handleSetVerseDay,
    handleAssignClass,
    downloadBulletin,
    selectedClass,
    handleSaveProfile,
    handleMessageUser,
    adminSections,
  }
}
