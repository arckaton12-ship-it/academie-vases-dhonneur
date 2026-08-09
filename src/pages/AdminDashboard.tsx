import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { SidebarLayout } from '@/components/ui/SidebarLayout'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { AvatarUpload } from '@/components/AvatarUpload'
import { SoundToggle } from '@/components/SoundToggle'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { toast, toastError } from '@/components/ui/Toast'
import { playSuccess } from '@/lib/sound'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { DayAccentBand } from '@/components/DayAccentBand'
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
  getWebhookConfig,
  saveWebhookConfig,
  setStudentClass,
  getClassVerses,
  addVerse,
  removeVerse,
  toggleVerseActive,
  WebhookConfig,
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
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseFile,
  uploadSupportFile,
  getMiniTask,
  saveMiniTask,
  getModerationSupport,
  saveModerationSupport,
  getSubmissionsForGrading,
  gradeSubmission,
  getResumesForGrading,
  gradeResume,
  ResumeForGrading,
} from '@/lib/courses'
import { getCurrentProfile, signOut } from '@/lib/auth'
import { exportToCSV, exportToPDF, exportStudentBulletinPDF, ExportRow } from '@/lib/export'
import { FieldError } from '@/components/ui/Input'
import { MessagingPanel } from '@/components/MessagingPanel'
import { QuizTab } from '@/components/QuizTab'
import { getAnnouncements, createAnnouncement, Announcement } from '@/lib/courses'

type Section = 'vue' | 'classes' | 'cours' | 'notation' | 'etudiants' | 'moderateurs' | 'versets' | 'messagerie' | 'export' | 'quiz' | 'annonces'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const sectionIcons: Record<Section, React.ReactNode> = {
  vue: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  classes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  cours: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  notation: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  etudiants: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  moderateurs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  versets: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  messagerie: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  export: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  quiz: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  annonces: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
}

interface AdminProfile {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export default function AdminDashboard() {
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
    Record<string, { day: string; start: string; end: string; notes: string }>
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

  const [webhook, setWebhook] = useState<WebhookConfig | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookActive, setWebhookActive] = useState(true)
  const [webhookMsg, setWebhookMsg] = useState<string | null>(null)

  // ---- Versets à méditer
  const [verseClassId, setVerseClassId] = useState('')
  const [verses, setVerses] = useState<MeditationVerse[]>([])
  const [verseText, setVerseText] = useState('')
  const [verseReference, setVerseReference] = useState('')
  const [verseMsg, setVerseMsg] = useState<string | null>(null)
  const [verseSaving, setVerseSaving] = useState(false)
  const [verseLoading, setVerseLoading] = useState(false)

  useEffect(() => {
    getCurrentProfile()
      .then((p) => {
        if (p) setAdminProfile(p as AdminProfile)
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
      .then(([s, c, co, su, at, st, badges, resumes, minis]) => {
        setStudents(s)
        setClasses(c)
        setCourses(co)
        setSubmissions(su)
        setAttendances(at)
        setStreaks(st)
        setAllBadges(badges)
        setAllResumes(resumes)
        setMiniResponses(minis)
        if (c.length > 0) setSelectedClassId(c[0].id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false))
    loadModerators().catch(() => undefined)
    getWebhookConfig()
      .then((cfg) => {
        if (cfg) {
          setWebhook(cfg)
          setWebhookUrl(cfg.url ?? '')
          setWebhookActive(cfg.active)
        }
      })
      .catch(() => undefined)
  }, [])

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
      .filter((r) => r > 0)
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
    const attendanceByClass = new Map<string, { attended: number; total: number }>()
    for (const a of attendances) {
      const cid = studentClassId.get(a.student_id)
      if (!cid) continue
      const rec = attendanceByClass.get(cid) ?? { attended: 0, total: coursesByClass.get(cid) ?? 0 }
      rec.attended += 1
      attendanceByClass.set(cid, rec)
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
      const at = attendanceByClass.get(c.id)
      const presence = at && at.total > 0 ? Math.round((at.attended / at.total) * 100) : 0
      const graded = gradedByClass.get(c.id)
      return {
        className: c.name,
        students: students.filter((s) => s.class_id === c.id && s.active).length,
        presence: at && at.total > 0 ? `${presence}%` : '—',
        resumes: resumeSetByClass.get(c.id)?.size ?? 0,
        badges: badgeByClass.get(c.id) ?? 0,
        graded: graded?.count ?? 0,
        avgGrade: graded && graded.count > 0 ? (graded.sum / graded.count).toFixed(2) : '—',
      }
    })
  }, [classes, students, courses, attendances, allResumes, allBadges, submissions, studentClassId])

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes])

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
      const [progress, coursesData] = await Promise.all([
        getStudentProgress(studentId),
        (async () => {
          const st = students.find((s) => s.id === studentId)
          return st?.class_id ? getClassCourses(st.class_id) : []
        })(),
      ])
      const meditation = students.find((s) => s.id === studentId)?.meditation_grade ?? null
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
      await loadModerators()
    } catch (err) {
      setModeratorMsg(err instanceof Error ? err.message : 'Erreur de promotion.')
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
    const current = moderatorClasses[moderatorId] ?? []
    const next = current.includes(classId)
      ? current.filter((id) => id !== classId)
      : [...current, classId]
    setModeratorClassesState((prev) => ({ ...prev, [moderatorId]: next }))
    setModeratorMsg(null)
    try {
      await setModeratorClasses(moderatorId, next)
      setModeratorMsg('Attribution des classes mise à jour.')
    } catch (err) {
      setModeratorMsg(err instanceof Error ? err.message : 'Erreur d\u2019attribution.')
      setModeratorClassesState((prev) => ({ ...prev, [moderatorId]: current }))
    }
  }

  async function addSlot(moderatorId: string) {
    const draft = slotDrafts[moderatorId] ?? { day: '0', start: '09:00', end: '11:00', notes: '' }
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
      })
      const sched = await getModeratorSchedules(moderatorId)
      setModeratorSchedulesState((prev) => ({ ...prev, [moderatorId]: sched }))
      setSlotDrafts((prev) => ({ ...prev, [moderatorId]: { day: '0', start: '09:00', end: '11:00', notes: '' } }))
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
    if (!newAccount.email.trim() || !newAccount.password || !newAccount.firstName.trim() || !newAccount.lastName.trim()) {
      setAccountMsg('Email, mot de passe, prénom et nom sont obligatoires.')
      return
    }
    setAccountSaving(true)
    try {
      await adminCreateUser({
        email: newAccount.email.trim(),
        password: newAccount.password,
        firstName: newAccount.firstName.trim(),
        lastName: newAccount.lastName.trim(),
        role: newAccount.role as 'MODERATEUR' | 'ADMINISTRATEUR' | 'ETUDIANT',
        phone: newAccount.phone.trim() || undefined,
        tribe: newAccount.tribe.trim() || undefined,
        department: newAccount.department.trim() || undefined,
      })
      setAccountMsg('Compte créé avec succès.')
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
      setAccountMsg(err instanceof Error ? err.message : 'Erreur de création du compte.')
      toastError('Erreur.')
    } finally {
      setAccountSaving(false)
    }
  }

  async function saveWebhook() {
    setWebhookMsg(null)
    const url = webhookUrl.trim()
    if (webhookActive && !/^https?:\/\/.+/i.test(url)) {
      setWebhookMsg('L\u2019URL doit commencer par http:// ou https:// (ou désactive le webhook).')
      return
    }
    try {
      await saveWebhookConfig(url, webhookActive)
      setWebhook({ id: true, url: url || null, active: webhookActive })
      setWebhookMsg('Configuration du webhook enregistrée.')
    } catch (err) {
      setWebhookMsg(err instanceof Error ? err.message : 'Erreur d\u2019enregistrement.')
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
      await addVerse(verseClassId, verseText.trim(), verseReference.trim())
      setVerseText('')
      setVerseReference('')
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

  const adminSections: [Section, string][] = [
    ['vue', "Vue d'ensemble"],
    ['classes', 'Classes'],
    ['cours', 'Cours'],
    ['notation', 'Notation'],
    ['etudiants', 'Étudiants'],
    ['moderateurs', 'Modérateurs'],
    ['versets', 'Versets'],
    ['messagerie', 'Messagerie'],
    ['quiz', 'Quiz'],
    ['annonces', 'Annonces'],
    ['export', 'Export'],
  ]

  return (
    <SidebarLayout
      items={adminSections.map(([k, label]) => ({ key: k, label, icon: sectionIcons[k] }))}
      activeKey={section}
      onSelect={(k) => setSection(k as Section)}
    >
      <SectionWatermark kind="croix" />
      <div className="relative z-10 page-enter">
      <DayAccentBand />
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo showText={false} size={34} />
          <div>
            <h1 className="font-display text-2xl text-bordeaux">Administration</h1>
            {adminProfile && (
              <p className="flex items-center gap-2 text-sm text-pierre">
                {adminProfile.first_name} {adminProfile.last_name}
                <VerseReference />
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SoundToggle />
          <Avatar
            url={adminProfile?.avatar_url}
            firstName={adminProfile?.first_name}
            lastName={adminProfile?.last_name}
            size={40}
            onClick={() =>
              document.getElementById('mon-profil')?.scrollIntoView({ behavior: 'smooth' })
            }
          />
          <Button
            variant="ghost"
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
          >
            Déconnexion
          </Button>
        </div>
      </header>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {accessMsg && <p className="mb-4 text-sm text-olive">{accessMsg}</p>}

      {section === 'vue' && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardDescription>Étudiants inscrits</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : students.length}</p>
            </Card>
            <Card>
              <CardDescription>Présence moyenne</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : averagePresence}</p>
            </Card>
            <Card>
              <CardDescription>Devoirs soumis</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : submissions.length}</p>
            </Card>
            <Card>
              <CardDescription>Classes actives</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : classes.length}</p>
            </Card>
          </div>

          <Card className="mt-4">
            <CardTitle>Engagement des étudiants</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Comment la formation prend corps : résumés, séries, badges et mini-tâches à travers toute l'Académie.
            </CardDescription>
            <div className="grid gap-4 sm:grid-cols-5">
              <Card>
                <CardDescription>Résumés rédigés</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : resumeCount}</p>
              </Card>
              <Card>
                <CardDescription>Taux de résumés</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : `${resumeRate}%`}</p>
              </Card>
              <Card>
                <CardDescription>Streak moyen</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : avgStreak}</p>
              </Card>
              <Card>
                <CardDescription>Badges délivrés</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : allBadges.length}</p>
              </Card>
              <Card>
                <CardDescription>Mini-tâches rendues</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : miniResponses.length}</p>
              </Card>
            </div>
          </Card>

          <Card className="mt-4">
            <CardTitle>Engagement par classe</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Présence, résumés, badges et notes corrigées — la vie de chaque classe en un regard.
            </CardDescription>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-or bg-white/60 text-left">
                    <th className="px-3 py-2 font-medium text-bordeaux">Classe</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Étudiants actifs</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Présence</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Résumés</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Badges</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Devoirs notés</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {engagementByClass.map((r) => (
                    <tr key={r.className} className="border-b border-pierre/15">
                      <td className="px-3 py-2 text-bordeaux">{r.className}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.students}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.presence}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.resumes}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.badges}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.graded}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.avgGrade}</td>
                    </tr>
                  ))}
                  {engagementByClass.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-pierre">
                        Aucune donnée d'engagement disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-4">
            <CardTitle>Suivi par classe</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Effectif et nombre de cours publiés par classe. Moyenne générale des soumissions notées : {averageGrade}.
            </CardDescription>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-or bg-white/60 text-left">
                    <th className="px-3 py-2 font-medium text-bordeaux">Classe</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Étudiants</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Cours publiés</th>
                  </tr>
                </thead>
                <tbody>
                  {byClass.map((r) => (
                    <tr key={r.className} className="border-b border-pierre/15">
                      <td className="px-3 py-2 text-bordeaux">{r.className}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.students}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.courses}</td>
                    </tr>
                  ))}
                  {byClass.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-pierre">
                        Aucune classe disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {section === 'classes' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>Tableau de bord par classe</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Sélectionne une classe pour voir ses étudiants et ses cours.
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadClassDetail(c.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedClassId === c.id
                      ? 'bg-bordeaux text-parchemin'
                      : 'border border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Card>

          {selectedClass && (
            <Card>
              <CardTitle>{selectedClass.name}</CardTitle>
              <CardDescription className="mt-1 mb-3">
                {classStudents.length} étudiant{classStudents.length > 1 ? 's' : ''} ·{' '}
                {classCourses.length} cours publié{classCourses.length > 1 ? 's' : ''}
              </CardDescription>
              <p className="mb-2 text-sm font-medium text-bordeaux">Étudiants</p>
              {classStudents.length === 0 ? (
                <p className="text-sm text-pierre">Aucun étudiant dans cette classe.</p>
              ) : (
                <ul className="mb-4 space-y-1 text-sm text-pierre">
                  {classStudents.map((s) => (
                    <li key={s.id}>
                      {s.last_name} {s.first_name} — {s.email}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mb-2 text-sm font-medium text-bordeaux">Cours publiés</p>
              {classCourses.length === 0 ? (
                <p className="text-sm text-pierre">Aucun cours publié.</p>
              ) : (
                <ul className="space-y-1 text-sm text-pierre">
                  {classCourses.map((c) => (
                    <li key={c.id}>
                      Semaine {c.week} — {c.title}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}

      {section === 'cours' && (
        <CoursTab classes={classes} courses={courses} onRefresh={() => {
          getCourses().then(setCourses).catch(() => {})
        }} />
      )}

      {section === 'notation' && (
        <NotationTab onGraded={() => {}} />
      )}

      {section === 'etudiants' && (
        <Card>
          <CardTitle>Étudiants</CardTitle>
          <CardDescription className="mt-1 mb-3">
            Suivi des notes étudiant par étudiant, cours après cours. Tu peux aussi révoquer un accès.
          </CardDescription>
          {students.length === 0 ? (
            <p className="text-sm text-pierre">Aucun étudiant inscrit.</p>
          ) : (
            <ul className="space-y-3">
              {students.map((s) => (
                <li key={s.id} className="rounded-card border border-pierre/15 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-bordeaux">
                        {s.last_name} {s.first_name}
                      </p>
                      <p className="text-xs text-pierre">
                        {s.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={s.class_id ?? ''}
                        onChange={(e) => handleAssignClass(s.id, e.target.value)}
                        className="rounded-md border border-pierre/30 bg-white px-2 py-1 text-xs text-bordeaux focus-visible:border-or"
                      >
                        <option value="">Sans classe</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        className="!px-3 !py-1 text-xs"
                        onClick={() => openBulletin(s.id)}
                      >
                        Bulletin
                      </Button>
                      <Button
                        variant="outline"
                        className="!px-3 !py-1 text-xs"
                        onClick={() => setProfileStudentId(profileStudentId === s.id ? null : s.id)}
                      >
                        Fiche complète
                      </Button>
                      <Button
                        variant={s.active ? 'ghost' : 'primary'}
                        className="!px-3 !py-1 text-xs"
                        onClick={() => toggleAccess(s.id, s.active)}
                      >
                        {s.active ? 'Révoquer l\u2019accès' : 'Restaurer l\u2019accès'}
                      </Button>
                    </div>
                  </div>

                  {expandedStudentId === s.id && (
                    <div className="mt-4 border-t border-sable/60 pt-4">
                      {bulletinLoading ? (
                        <p className="text-sm text-pierre">Chargement du bulletin…</p>
                      ) : bulletin ? (
                        <>
                          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                            <StatCell label="Présence" value={`${bulletin.progress.presenceRate}%`} />
                            <StatCell label="Résumés" value={`${bulletin.progress.resumeRate}%`} />
                            <StatCell label="Moyenne" value={bulletin.progress.averageGrade ?? '—'} />
                            <StatCell label="Méditation" value={String(s.meditation_grade ?? '—')} />
                          </dl>
                          <div className="mt-4 overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="border-b-2 border-or bg-white/60 text-left">
                                  <th className="px-3 py-1.5 font-medium text-bordeaux">Cours</th>
                                  <th className="px-3 py-1.5 font-medium text-bordeaux">Note</th>
                                  <th className="px-3 py-1.5 font-medium text-bordeaux">Appréciation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bulletin.courses.map((c) => {
                                  const sub = submissionsByStudent.get(s.id)?.find(
                                    (x) => x.assignment?.course_id === c.id
                                  )
                                  return (
                                    <tr key={c.id} className="border-b border-pierre/15">
                                      <td className="px-3 py-1.5 text-bordeaux">
                                        Semaine {c.week} — {c.title}
                                      </td>
                                      <td className="px-3 py-1.5 font-mono text-pierre">
                                        {sub && sub.grade !== null && sub.grade !== undefined
                                          ? sub.grade
                                          : '—'}
                                      </td>
                                      <td className="px-3 py-1.5 text-pierre">{sub?.feedback ?? '—'}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 flex flex-wrap items-end gap-3">
                            <div className="w-32">
                              <Label htmlFor="meditation">Méditation /20</Label>
                              <Input
                                id="meditation"
                                type="number"
                                min={0}
                                max={20}
                                value={meditationDraft}
                                onChange={(e) => setMeditationDraft(e.target.value)}
                              />
                            </div>
                            <Button
                              variant="outline"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => saveMeditation(s.id)}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              variant="outline"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => downloadBulletin(s)}
                            >
                              Bulletin PDF
                            </Button>
                          </div>
                          {bulletinMsg && <p className="mt-2 text-sm text-olive">{bulletinMsg}</p>}
                        </>
                      ) : (
                        <p className="text-sm text-pierre">{bulletinMsg ?? 'Bulletin indisponible.'}</p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {section === 'etudiants' && profileStudentId && (
        <StudentProfileCard
          studentId={profileStudentId}
          onClose={() => setProfileStudentId(null)}
        />
      )}

      {section === 'moderateurs' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>Promouvoir un étudiant</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Transforme un compte étudiant en modérateur, puis attribue-lui ses classes ci-dessous.
            </CardDescription>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-56 flex-1">
                <Label htmlFor="promote-student">Étudiant</Label>
                <select
                  id="promote-student"
                  value={promoteStudentId}
                  onChange={(e) => setPromoteStudentId(e.target.value)}
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                >
                  <option value="">Sélectionner un étudiant…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} — {s.email} ({s.class?.name ?? 'sans classe'})
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="primary" onClick={promoteStudent} disabled={!promoteStudentId}>
                Promouvoir
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription className="mt-1 mb-4">
              Crée directement un compte modérateur, administrateur ou étudiant. La personne pourra se
              connecter aussitôt.
            </CardDescription>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="acc-first">Prénom</Label>
                  <Input
                    id="acc-first"
                    required
                    value={newAccount.firstName}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-last">Nom</Label>
                  <Input
                    id="acc-last"
                    required
                    value={newAccount.lastName}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="acc-email">Email</Label>
                  <Input
                    id="acc-email"
                    type="email"
                    required
                    value={newAccount.email}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-password">Mot de passe</Label>
                  <Input
                    id="acc-password"
                    type="password"
                    required
                    minLength={6}
                    value={newAccount.password}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="acc-role">Rôle</Label>
                  <select
                    id="acc-role"
                    value={newAccount.role}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                  >
                    <option value="MODERATEUR">Modérateur</option>
                    <option value="ADMINISTRATEUR">Administrateur</option>
                    <option value="ETUDIANT">Étudiant</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="acc-phone">Téléphone</Label>
                  <Input
                    id="acc-phone"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-tribe">Tribu</Label>
                  <Input
                    id="acc-tribe"
                    value={newAccount.tribe}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, tribe: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="acc-dept">Département</Label>
                <Input
                  id="acc-dept"
                  value={newAccount.department}
                  onChange={(e) => setNewAccount((prev) => ({ ...prev, department: e.target.value }))}
                />
              </div>
              {accountMsg && (
                <p
                  className={`text-sm ${accountMsg.startsWith('Compte') ? 'text-olive' : 'text-red-700'}`}
                >
                  {accountMsg}
                </p>
              )}
              <Button type="submit" disabled={accountSaving}>
                {accountSaving ? 'Création…' : 'Créer le compte'}
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Modérateurs de l'Académie</CardTitle>
            <CardDescription className="mt-1 mb-4">
              Classes rattachées et planning de modération de chaque modérateur.
            </CardDescription>

            {moderators.length === 0 ? (
              <p className="text-sm text-pierre">Aucun modérateur enregistré.</p>
            ) : (
              <ul className="space-y-5">
                {moderators.map((m) => {
                  const selectedClasses = moderatorClasses[m.id] ?? []
                  const slots = moderatorSchedules[m.id] ?? []
                  const draft = slotDrafts[m.id] ?? { day: '0', start: '09:00', end: '11:00', notes: '' }
                  return (
                    <li key={m.id} className="rounded-card border border-pierre/15 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-bordeaux">
                            {m.last_name} {m.first_name}
                          </p>
                          <p className="text-xs text-pierre">
                            {m.email} · {m.active ? 'accès actif' : 'accès révoqué'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant={m.active ? 'ghost' : 'primary'}
                            className="!px-3 !py-1 text-xs"
                            onClick={() => toggleAccess(m.id, m.active)}
                          >
                            {m.active ? 'Révoquer l\u2019accès' : 'Restaurer l\u2019accès'}
                          </Button>
                          <Button
                            variant="outline"
                            className="!px-3 !py-1 text-xs text-red-700"
                            onClick={() => demoteModerator(m.id)}
                          >
                            Repasser en étudiant
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-sable/60 pt-3">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-bordeaux">
                          Classes rattachées
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {classes.map((c) => {
                            const checked = selectedClasses.includes(c.id)
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleModeratorClass(m.id, c.id)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  checked
                                    ? 'bg-bordeaux text-parchemin'
                                    : 'border border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                                }`}
                              >
                                {c.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-3 border-t border-sable/60 pt-3">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-bordeaux">
                          Planning de modération
                        </p>
                        {slots.length === 0 ? (
                          <p className="text-sm text-pierre">Aucun créneau défini.</p>
                        ) : (
                          <ul className="mb-3 space-y-1 text-sm">
                            {slots.map((slot) => (
                              <li
                                key={slot.id}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-1.5 ${
                                  slot.day_of_week === 0 ? 'border-or/60 bg-or/10' : 'border-pierre/15'
                                }`}
                              >
                                <span className="text-bordeaux">
                                  {DAY_NAMES[slot.day_of_week] ?? slot.day_of_week}
                                  {slot.day_of_week === 0 && (
                                    <span className="ml-2 rounded-full bg-or/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide">
                                      Jour du Seigneur
                                    </span>
                                  )}{' '}
                                  ·{' '}
                                  <span className="font-mono text-xs">
                                    {slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)}
                                  </span>
                                  {slot.notes ? <span className="ml-2 text-pierre">— {slot.notes}</span> : null}
                                </span>
                                <button
                                  onClick={() => removeSlot(m.id, slot.id)}
                                  className="text-xs text-red-700 underline"
                                >
                                  Retirer
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="grid gap-2 sm:grid-cols-[120px_100px_100px_1fr_auto]">
                          <select
                            value={draft.day}
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, day: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          >
                            {DAY_NAMES.map((name, i) => (
                              <option key={i} value={i}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={draft.start}
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, start: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          />
                          <input
                            type="time"
                            value={draft.end}
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, end: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          />
                          <input
                            value={draft.notes}
                            placeholder="Notes (optionnel)"
                            onChange={(e) =>
                              setSlotDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, notes: e.target.value },
                              }))
                            }
                            className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                          />
                          <Button
                            variant="outline"
                            className="!px-3 !py-1.5 text-xs"
                            disabled={slotSavingId === m.id}
                            onClick={() => addSlot(m.id)}
                          >
                            {slotSavingId === m.id ? '…' : 'Ajouter'}
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {moderatorMsg && <p className="mt-3 text-sm text-olive">{moderatorMsg}</p>}
          </Card>
        </div>
      )}

      {section === 'versets' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>Versets à méditer</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Ajoute un verset biblique pour chaque classe. L'étudiant verra un verset différent chaque jour.
            </CardDescription>
            <div className="mb-4">
              <Label htmlFor="verse-class">Sélectionner une classe</Label>
              <select
                id="verse-class"
                value={verseClassId}
                onChange={(e) => loadVerses(e.target.value)}
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
              >
                <option value="">Choisir une classe…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {verseClassId && (
              <>
                <form onSubmit={handleAddVerse} className="mb-4 space-y-3 rounded-md border border-sable/60 p-4">
                  <p className="text-sm font-medium text-bordeaux">Ajouter un verset</p>
                  <div>
                    <Label htmlFor="verse-text">Texte du verset</Label>
                    <textarea
                      id="verse-text"
                      required
                      rows={3}
                      value={verseText}
                      onChange={(e) => setVerseText(e.target.value)}
                      placeholder="Ex: Car Dieu a tant aimé le monde qu'il a donné son Fils unique…"
                      className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <Label htmlFor="verse-ref">Référence</Label>
                      <Input
                        id="verse-ref"
                        required
                        value={verseReference}
                        onChange={(e) => setVerseReference(e.target.value)}
                        placeholder="Ex: Jean 3:16"
                      />
                    </div>
                    <Button type="submit" variant="primary" disabled={verseSaving} className="self-end">
                      {verseSaving ? 'Ajout…' : 'Ajouter'}
                    </Button>
                  </div>
                </form>

                {verseLoading ? (
                  <p className="text-sm text-pierre">Chargement des versets…</p>
                ) : verses.length === 0 ? (
                  <p className="text-sm text-pierre">Aucun verset pour cette classe.</p>
                ) : (
                  <ul className="space-y-2">
                    {verses.map((v) => (
                      <li
                        key={v.id}
                        className={`rounded-md border p-3 ${v.active ? 'border-pierre/15' : 'border-or/40 bg-or/5 opacity-60'}`}
                      >
                        <p className="text-sm text-bordeaux">{v.verse_text}</p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-pierre">
                          {v.verse_reference}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() => handleToggleVerse(v.id)}
                            className="text-xs text-or underline"
                          >
                            {v.active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            onClick={() => handleRemoveVerse(v.id)}
                            className="text-xs text-red-700 underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {verseMsg && <p className="mt-3 text-sm text-olive">{verseMsg}</p>}
          </Card>
        </div>
      )}

      {section === 'messagerie' && (
        <div className="space-y-4">
          <MessagingPanel currentUserId={adminProfile?.id ?? ''} userRole="ADMINISTRATEUR" />
        </div>
      )}

      {section === 'quiz' && (
        <QuizTab courses={courses} />
      )}

      {section === 'annonces' && (
        <AdminAnnoncesTab
          classes={classes}
          allCourses={courses}
        />
      )}

      {section === 'export' && (
        <Card>
          <CardTitle>Export des données</CardTitle>
          <CardDescription className="mt-1 mb-3">
            Exports à la demande : CSV de suivi et bulletins PDF individuels par étudiant.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportToCSV('suivi-par-classe.csv', classHeaders, classRows())}>
              Suivi par classe → CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportToPDF(
                  'suivi-par-classe.pdf',
                  'Suivi par classe — Académie Vases d\'Honneur',
                  'Effectifs et cours publiés par classe',
                  classHeaders,
                  classRows()
                )
              }
            >
              Suivi par classe → PDF
            </Button>
            <Button variant="outline" onClick={() => exportToCSV('liste-etudiants.csv', studentHeaders, studentRows())}>
              Étudiants → CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportToPDF(
                  'liste-etudiants.pdf',
                  'Liste des étudiants',
                  'Répertoire des étudiants inscrits',
                  studentHeaders,
                  studentRows()
                )
              }
            >
              Étudiants → PDF
            </Button>
          </div>

          <div className="mt-6 rounded-md border border-sable/60 p-4">
            <p className="mb-3 text-sm font-medium text-bordeaux">
              Notes, présence et méditation par classe
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-64">
                <Label htmlFor="export-class">Classe</Label>
                <select
                  id="export-class"
                  value={exportClassId}
                  onChange={(e) => setExportClassId(e.target.value)}
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                >
                  <option value="">Toutes les classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                onClick={() => exportToCSV('notes-et-presence.csv', gradeHeaders, gradeRows())}
              >
                Notes & présence → CSV
              </Button>
            </div>
          </div>
          <div className="mt-6 border-t border-sable/60 pt-4">
            <p className="mb-3 text-sm font-medium text-bordeaux">Bulletins individuels</p>
            <ul className="space-y-2 text-sm">
              {students.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-pierre/15 px-3 py-2">
                  <span className="text-pierre">
                    {s.last_name} {s.first_name} — {s.class?.name ?? 'Sans classe'}
                  </span>
                  <Button
                    variant="outline"
                    className="!px-3 !py-1 text-xs"
                    onClick={() => downloadBulletin(s)}
                  >
                    Bulletin PDF
                  </Button>
                </li>
              ))}
              {students.length === 0 && <p className="text-pierre">Aucun étudiant.</p>}
            </ul>
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardTitle>Webhook d'administration</CardTitle>
        <CardDescription className="mt-1 mb-3">
          URL générique qui reçoit les événements de l'Académie (inscription, badge obtenu, note
          corrigée, résumé corrigé). Laisse le champ vide pour ne recevoir que les notifications
          dans l'application.
        </CardDescription>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <Label htmlFor="webhook-url">URL du webhook</Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              placeholder="https://exemple.fr/hooks/academie"
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-bordeaux">
              <input
                type="checkbox"
                checked={webhookActive}
                onChange={(e) => setWebhookActive(e.target.checked)}
                className="h-4 w-4 accent-[#5D2A41]"
              />
              Actif
            </label>
            <Button variant="primary" className="!px-4" onClick={saveWebhook}>
              Enregistrer
            </Button>
          </div>
        </div>
        {webhookMsg && <p className="mt-3 text-sm text-olive">{webhookMsg}</p>}
      </Card>

      {adminProfile && (
        <Card className="mt-6" id="mon-profil">
          <CardTitle>Mon profil</CardTitle>
          <CardDescription className="mt-2 mb-4">
            Gérez votre photo de profil. Les autres informations sont rattachées à votre compte.
          </CardDescription>
          <AvatarUpload
            url={adminProfile.avatar_url}
            firstName={adminProfile.first_name}
            lastName={adminProfile.last_name}
            userId={adminProfile.id}
            onSaved={(url) => setAdminProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev))}
          />
        </Card>
      )}
      </div>
    </SidebarLayout>
  )
}

function CoursTab({
  classes,
  courses,
  onRefresh,
}: {
  classes: ClassRow[]
  courses: Course[]
  onRefresh: () => void
}) {
  const [editingId, setEditingId] = useState('')
  const [classId, setClassId] = useState('')
  const [week, setWeek] = useState('1')
  const [sessionDate, setSessionDate] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [miniTask, setMiniTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(classes[0].id)
  }, [classes, classId])

  useEffect(() => {
    if (!editingId) return
    const course = courses.find((c) => c.id === editingId)
    if (!course) return
    setClassId(course.class_id ?? '')
    setWeek(String(course.week))
    setSessionDate(course.session_date ?? '')
    setTitle(course.title)
    setDescription(course.description ?? '')
    setAudioFile(null)
    setVideoFile(null)
    setAudioUrl(course.audio_url ?? '')
    setVideoUrl(course.video_url ?? '')
    getMiniTask(editingId).then((t) => setMiniTask(t?.instruction ?? '')).catch(() => setMiniTask(''))
  }, [editingId, courses])

  function resetForm() {
    setEditingId('')
    setClassId(classes[0]?.id ?? '')
    setWeek('1')
    setSessionDate('')
    setTitle('')
    setDescription('')
    setAudioFile(null)
    setVideoFile(null)
    setAudioUrl('')
    setVideoUrl('')
    setMiniTask('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!classId || !title.trim()) {
      setError('La classe et le titre sont obligatoires.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (editingId) {
        const audioPath = audioFile ? await uploadCourseFile(audioFile) : undefined
        const videoPath = videoFile ? await uploadCourseFile(videoFile) : undefined
        await updateCourse(editingId, {
          classId,
          title: title.trim(),
          week: Number(week) || 1,
          sessionDate: sessionDate || undefined,
          description: description.trim() || undefined,
          ...(audioPath !== undefined ? { audioPath } : {}),
          ...(videoPath !== undefined ? { videoPath } : {}),
        })
        await saveMiniTask(editingId, miniTask)
        setSuccess('Cours modifié.')
        toast('Cours modifié.')
      } else {
        const audioPath = audioFile ? await uploadCourseFile(audioFile) : undefined
        const videoPath = videoFile ? await uploadCourseFile(videoFile) : undefined
        const created = await createCourse({
          classId,
          title: title.trim(),
          week: Number(week) || 1,
          sessionDate: sessionDate || undefined,
          description: description.trim() || undefined,
          audioPath,
          videoPath,
        })
        await saveMiniTask(created.id, miniTask)
        setSuccess('Cours publié.')
        toast('Cours publié.')
      }
      onRefresh()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
      toastError('Erreur.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    if (!window.confirm('Supprimer ce cours définitivement ?')) return
    setLoading(true)
    try {
      await deleteCourse(editingId)
      setSuccess('Cours supprimé.')
      toast('Cours supprimé.')
      onRefresh()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
      toastError('Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>{editingId ? 'Modifier un cours' : 'Créer un cours'}</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Gère les cours de chaque classe : titre, semaine, média (lien OU upload), mini-tâche.
        </CardDescription>

        <div className="mb-4">
          <Label htmlFor="admin-course-pick">Cours existant</Label>
          <select
            id="admin-course-pick"
            value={editingId}
            onChange={(e) => (e.target.value ? setEditingId(e.target.value) : resetForm())}
            className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
          >
            <option value="">— Nouveau cours —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>Semaine {c.week} — {c.title}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-course-class">Classe</Label>
            <select
              id="admin-course-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="admin-course-week">Semaine</Label>
              <Input id="admin-course-week" type="number" min={1} value={week} onChange={(e) => setWeek(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="admin-course-date">Date</Label>
              <Input id="admin-course-date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="admin-course-title">Titre</Label>
            <Input id="admin-course-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. La foi qui agit" />
          </div>

          <div>
            <Label htmlFor="admin-course-desc">Description</Label>
            <textarea id="admin-course-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Résumé ou thème…" className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Vidéo</Label>
              <Input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setVideoFile(null) }} placeholder="Lien YouTube (optionnel)" />
              <input type="file" accept="video/*" onChange={(e) => { setVideoFile(e.target.files?.[0] ?? null); setVideoUrl('') }} className="mt-2 block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-sm file:text-parchemin" />
              <p className="mt-1 text-[11px] text-pierre italic">Les fichiers uploadés consomment la bande passante Supabase. Préfère un lien YouTube.</p>
            </div>
            <div>
              <Label>Audio</Label>
              <Input value={audioUrl} onChange={(e) => { setAudioUrl(e.target.value); setAudioFile(null) }} placeholder="Lien externe (optionnel)" />
              <input type="file" accept="audio/*" onChange={(e) => { setAudioFile(e.target.files?.[0] ?? null); setAudioUrl('') }} className="mt-2 block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-sm file:text-parchemin" />
            </div>
          </div>

          <div className="rounded-md border border-or/40 bg-parchemin p-3">
            <Label htmlFor="admin-course-mt">Mini-tâche pratique</Label>
            <textarea id="admin-course-mt" rows={2} value={miniTask} onChange={(e) => setMiniTask(e.target.value)} placeholder="La tâche que l'étudiant devra réaliser…" className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
          </div>

          <FieldError>{error ?? undefined}</FieldError>
          {success && <p className="text-sm text-olive">{success}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement…' : editingId ? 'Modifier' : 'Publier'}</Button>
            {editingId && <Button type="button" variant="ghost" className="text-red-700" onClick={handleDelete}>Supprimer</Button>}
          </div>
        </form>
      </Card>
    </div>
  )
}

function NotationTab({ onGraded }: { onGraded: () => void }) {
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resumes, setResumes] = useState<ResumeForGrading[]>([])
  const [rGrades, setRGrades] = useState<Record<string, string>>({})
  const [rFeedbacks, setRFeedbacks] = useState<Record<string, string>>({})
  const [rSavingId, setRSavingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getSubmissionsForGrading(), getResumesForGrading()])
      .then(([data, rdata]) => {
        setItems(data)
        const g: Record<string, string> = {}
        const f: Record<string, string> = {}
        for (const s of data) {
          if (s.grade !== null && s.grade !== undefined) g[s.id] = String(s.grade)
          f[s.id] = s.feedback ?? ''
        }
        setGrades(g)
        setFeedbacks(f)
        setResumes(rdata)
        const rg: Record<string, string> = {}
        const rf: Record<string, string> = {}
        for (const r of rdata) {
          if (r.grade !== null && r.grade !== undefined) rg[r.id] = String(r.grade)
          rf[r.id] = r.feedback ?? ''
        }
        setRGrades(rg)
        setRFeedbacks(rf)
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleGrade(sub: Submission) {
    const raw = grades[sub.id]?.trim()
    const grade = raw === '' ? null : Number(raw)
    if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 20)) {
      setMessage('La note doit être entre 0 et 20.'); return
    }
    setSavingId(sub.id); setMessage(null)
    try {
      await gradeSubmission(sub.id, grade, feedbacks[sub.id]?.trim() ?? '')
      setItems((prev) => prev.map((s) => s.id === sub.id ? { ...s, grade, feedback: feedbacks[sub.id]?.trim() ?? '' } : s))
      setMessage('Note enregistrée.'); playSuccess(); toast('Note enregistrée.'); onGraded()
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Erreur.'); toastError('Erreur.') } finally { setSavingId(null) }
  }

  async function handleGradeResume(r: ResumeForGrading) {
    const raw = rGrades[r.id]?.trim()
    const grade = raw === '' ? null : Number(raw)
    if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 20)) {
      setMessage('La note doit être entre 0 et 20.'); return
    }
    setRSavingId(r.id); setMessage(null)
    try {
      await gradeResume(r.id, grade, rFeedbacks[r.id]?.trim() ?? '')
      setResumes((prev) => prev.map((x) => x.id === r.id ? { ...x, grade, feedback: rFeedbacks[r.id]?.trim() ?? '' } : x))
      setMessage('Correction enregistrée.'); playSuccess(); toast('Correction enregistrée.'); onGraded()
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Erreur.'); toastError('Erreur.') } finally { setRSavingId(null) }
  }

  if (loading) return <Card><CardDescription>Chargement…</CardDescription></Card>

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Notation des rendus</CardTitle>
        <CardDescription className="mt-1 mb-3">Note les devoirs, exercices et notes manuscrites des étudiants.</CardDescription>
        {items.length === 0 ? <p className="text-sm text-pierre">Aucun rendu à noter.</p> : (
          <ul className="space-y-4">
            {items.map((sub) => (
              <li key={sub.id} className="rounded-card border border-pierre/15 p-4">
                <p className="text-sm font-medium text-bordeaux">{sub.student?.first_name} {sub.student?.last_name}</p>
                <p className="mt-0.5 text-xs text-pierre">{sub.type === 'notes' ? `Notes manuscrites — Semaine ${sub.course?.week ?? '?'} — ${sub.course?.title ?? ''}` : `${sub.assignment?.type === 'DEVOIR' ? 'Devoir' : 'Exercice'} — ${sub.assignment?.description ?? '—'}`}</p>
                {sub.content && <p className="mt-2 rounded-md bg-white/60 px-3 py-2 text-sm text-pierre">{sub.content}</p>}
                {sub.type === 'notes' && sub.attachments && sub.attachments.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">{sub.attachments.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-sable/70"><img src={url} alt="Note" className="h-24 w-32 object-cover" /></a>)}</div>
                ) : sub.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-bordeaux underline">Pièce jointe</a>}
                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div><Label>Note /20</Label><Input type="number" min={0} max={20} value={grades[sub.id] ?? ''} onChange={(e) => setGrades((p) => ({ ...p, [sub.id]: e.target.value }))} /></div>
                  <div><Label>Appréciation</Label><Input value={feedbacks[sub.id] ?? ''} placeholder="Encouragement…" onChange={(e) => setFeedbacks((p) => ({ ...p, [sub.id]: e.target.value }))} /></div>
                </div>
                <Button variant="outline" className="mt-3 !px-3 !py-1.5 text-xs" disabled={savingId === sub.id} onClick={() => handleGrade(sub)}>{savingId === sub.id ? '…' : 'Enregistrer'}</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardTitle>Correction des résumés</CardTitle>
        {resumes.length === 0 ? <p className="text-sm text-pierre">Aucun résumé à corriger.</p> : (
          <ul className="space-y-4">
            {resumes.map((r) => (
              <li key={r.id} className="rounded-card border border-pierre/15 p-4">
                <p className="text-sm font-medium text-bordeaux">{r.student?.first_name} {r.student?.last_name}</p>
                <p className="text-xs text-pierre">Semaine {r.course?.week ?? '?'} — {r.course?.title ?? ''}</p>
                <p className="mt-2 rounded-md bg-white/60 px-3 py-2 text-sm text-pierre">{r.content}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div><Label>Note /20</Label><Input type="number" min={0} max={20} value={rGrades[r.id] ?? ''} onChange={(e) => setRGrades((p) => ({ ...p, [r.id]: e.target.value }))} /></div>
                  <div><Label>Appréciation</Label><Input value={rFeedbacks[r.id] ?? ''} placeholder="Encouragement…" onChange={(e) => setRFeedbacks((p) => ({ ...p, [r.id]: e.target.value }))} /></div>
                </div>
                <Button variant="outline" className="mt-3 !px-3 !py-1.5 text-xs" disabled={rSavingId === r.id} onClick={() => handleGradeResume(r)}>{rSavingId === r.id ? '…' : 'Enregistrer'}</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {message && <p className="text-sm text-olive">{message}</p>}
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card !p-3 text-center">
      <dt className="text-xs text-pierre dark:text-slate-400">{label}</dt>
      <dd className="font-display text-lg text-bordeaux dark:text-or">{value}</dd>
    </div>
  )
}

function AdminAnnoncesTab({ classes, allCourses }: { classes: ClassRow[]; allCourses: Course[] }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [annonces, setAnnonces] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedClassId) { setLoading(false); return }
    setLoading(true)
    getAnnouncements(selectedClassId)
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
      .finally(() => setLoading(false))
  }, [selectedClassId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!selectedClassId || !title.trim() || !content.trim()) return
    setSaving(true)
    setMsg(null)
    try {
      await createAnnouncement(selectedClassId, title.trim(), content.trim())
      setTitle('')
      setContent('')
      setMsg('Annonce publiée.')
      toast('Annonce publiée.')
      playSuccess()
      const data = await getAnnouncements(selectedClassId)
      setAnnonces(data)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur lors de la publication.')
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Publier une annonce</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Envoie une annonce à tous les étudiants d'une classe.
        </CardDescription>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <Label>Classe</Label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'annonce..."
              required
            />
          </div>
          <div>
            <Label>Contenu</Label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ton message pour la classe..."
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Publication...' : 'Publier l\'annonce'}
          </Button>
          {msg && <p className="text-sm text-olive">{msg}</p>}
        </form>
      </Card>

      <Card>
        <CardTitle>Annonces publiées</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Historique des annonces pour la classe sélectionnée.
        </CardDescription>
        {loading ? (
          <p className="text-sm text-pierre">Chargement...</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce pour cette classe.</p>
        ) : (
          <ul className="space-y-3">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-card border border-pierre/15 p-4">
                <p className="font-medium text-bordeaux">{a.title}</p>
                <p className="mt-1 text-sm text-pierre whitespace-pre-wrap">{a.content}</p>
                <p className="mt-2 text-[11px] text-pierre">
                  {a.moderator?.first_name} {a.moderator?.last_name} —{' '}
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
