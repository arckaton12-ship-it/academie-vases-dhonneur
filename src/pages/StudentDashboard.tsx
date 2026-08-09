import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import RegistrationStep2 from '@/components/RegistrationStep2'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Sidebar, SidebarItem } from '@/components/ui/Sidebar'
import { QuizPlayer } from '@/components/QuizPlayer'
import { BulletinPDF } from '@/components/BulletinPDF'
import { StreakBadge } from '@/components/StreakBadge'
import { CoursePlayer, downloadCourseMedia } from '@/components/CoursePlayer'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { AvatarUpload } from '@/components/AvatarUpload'
import { Badge } from '@/components/Badge'
import { BadgeHall } from '@/components/BadgeHall'
import { CertificateView } from '@/components/Certificate'
import { Marquee } from '@/components/ui/Marquee'
import { SoundToggle } from '@/components/SoundToggle'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { DayAccentBand } from '@/components/DayAccentBand'
import { NotificationsBell, NotificationRow } from '@/components/NotificationsBell'
import { getCurrentProfile, signOut, updateProfileInfo } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getDailyVerse, getAnnouncements, Announcement } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { MessagingPanel } from '@/components/MessagingPanel'
import {
  getAssignments,
  getClassCourses,
  getStudentCourse,
  getStudentStreak,
  getResume,
  saveResume,
  markCourseAttendance,
  getMySubmissions,
  getFollowedCourses,
  getStudentProgress,
  submitAssignment,
  getServiceRecord,
  upsertServiceRecord,
  getBadges,
  ensureBadges,
  getCertificates,
  getMiniTask,
  getMiniTaskResponse,
  saveMiniTaskResponse,
  getBadgeProgress,
  getResumesForReview,
  getClosingReflections,
  saveClosingReflection,
  getNotifications,
  markNotificationsRead,
  uploadNoteFile,
  submitNotes,
  isNoteImageFile,
  Assignment,
  Course,
  Streak,
  MySubmission,
  StudentProgress,
  ServiceRecord,
  BadgeRow,
  BadgeProgress,
  Certificate,
  MiniTask,
  ResumeReview,
  ClosingReflection,
} from '@/lib/courses'
import { BADGES, BADGE_ORDER, isBadgeKey } from '@/lib/badges'

type Tab = 'academie' | 'annonces' | 'devoirs' | 'service' | 'revue' | 'profil' | 'messagerie'

interface ProfileState {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  tribe: string | null
  department: string | null
  avatar_url: string | null
  class_id: string | null
  meditation_grade: number | null
  active_badge: string | null
}

interface ServiceDraft {
  group_name: string
  service_days: string
  mission_description: string
  focus: string
}

function AnnoncesEtudiantTab({ classId }: { classId: string | null }) {
  const [annonces, setAnnonces] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classId) { setLoading(false); return }
    getAnnouncements(classId)
      .then(setAnnonces)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classId])

  if (!classId) return <Card><CardDescription>Tu n'as pas encore de classe assignée.</CardDescription></Card>

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Annonces</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Messages et informations de ton modérateur.
        </CardDescription>
        {loading ? (
          <p className="text-sm text-pierre">Chargement…</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce pour le moment.</p>
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

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('academie')

  const [profile, setProfile] = useState<ProfileState | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [summary, setSummary] = useState('')
  const [summarySaved, setSummarySaved] = useState(false)
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [summarySaving, setSummarySaving] = useState(false)
  const [attended, setAttended] = useState(false)
  const [attending, setAttending] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<MySubmission[]>([])
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [followed, setFollowed] = useState<Course[]>([])
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [service, setService] = useState<ServiceRecord | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [miniTask, setMiniTask] = useState<MiniTask | null>(null)
  const [miniTaskResponse, setMiniTaskResponse] = useState('')
  const [miniTaskSaving, setMiniTaskSaving] = useState(false)
  const [miniTaskSaved, setMiniTaskSaved] = useState(false)

  // ---- Salle des badges + badge actif
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([])
  const [badgeHallOpen, setBadgeHallOpen] = useState(false)
  const [badgeBusy, setBadgeBusy] = useState(false)

  // ---- Notifications in-app
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  // ---- Verset du jour par classe
  const [dailyVerse, setDailyVerse] = useState<{ verse_text: string; verse_reference: string } | null>(null)

  // ---- Recherche de cours (page Académie)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchWeek, setSearchWeek] = useState('')

  // ---- Page Revue
  const [resumesReview, setResumesReview] = useState<ResumeReview[]>([])
  const [reflections, setReflections] = useState<ClosingReflection[]>([])
  const [revueFilter, setRevueFilter] = useState<'all' | 'pending' | 'graded'>('all')
  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, string>>({})
  const [reflectionSaving, setReflectionSaving] = useState<Record<string, boolean>>({})
  const [reflectionMsg, setReflectionMsg] = useState<string | null>(null)

  // ---- Notes manuscrites
  const [notesFiles, setNotesFiles] = useState<File[]>([])
  const [notesComment, setNotesComment] = useState('')
  const [notesSubmitting, setNotesSubmitting] = useState(false)
  const [notesMsg, setNotesMsg] = useState<string | null>(null)

  // ---- onglet Profil
  const [formName, setFormName] = useState('')
  const [formFirst, setFormFirst] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formTribe, setFormTribe] = useState('')
  const [formDept, setFormDept] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileDone, setProfileDone] = useState<string | null>(null)

  // ---- onglet Service
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>({
    group_name: '',
    service_days: '0',
    mission_description: '',
    focus: 'enseignement',
  })
  const [serviceSaving, setServiceSaving] = useState(false)
  const [serviceMsg, setServiceMsg] = useState<string | null>(null)

  // ---- onglet Devoirs
  const [drafts, setDrafts] = useState<Record<string, { content: string; file: File | null }>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [submitMsg, setSubmitMsg] = useState<Record<string, string>>({})

  const loadProfile = useMemo(
    () => async () => {
      const p = (await getCurrentProfile()) as ProfileState | null
      if (!p) {
        navigate('/')
        return null
      }
      setProfile(p)
      return p
    },
    [navigate]
  )

  const loadCourse = useCallback(async (c: Course, studentId: string) => {
    const [resumeContent, followedData, progressData, classAssignments, task] = await Promise.all([
      getResume(studentId, c.id),
      getFollowedCourses(studentId),
      getStudentProgress(studentId),
      getAssignments(c.id),
      getMiniTask(c.id),
    ])
    setCourse(c)
    setSummary(resumeContent ?? '')
    setFollowed(followedData)
    setAttended(followedData.some((x) => x.id === c.id))
    setProgress(progressData)
    setAssignments(classAssignments)
    setMiniTask(task)
    setMiniTaskResponse('')
    setMiniTaskSaved(false)
    if (task) {
      const resp = await getMiniTaskResponse(studentId, task.id)
      setMiniTaskResponse(resp?.response ?? '')
    }
  }, [])

  const refreshBadgeProgress = useCallback(async (studentId: string) => {
    try {
      setBadges(await ensureBadges(studentId))
      setBadgeProgress(await getBadgeProgress())
    } catch {
      // rafraîchissement silencieux
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const p = await loadProfile()
        if (!p || cancelled) return

        // Check if registration step 2 is completed
        const { data: reg } = await supabase
          .from('academy_registrations')
          .select('id')
          .eq('student_id', p.id)
          .maybeSingle()
        if (!cancelled && !reg) {
          setShowRegistration(true)
        }

        const classId = p.class_id
        const [streakData, mySubmissions, allBadges, certs, serviceRec, progressData, notifs, resumeReviews, reflectionsData] =
          await Promise.all([
            getStudentStreak(p.id),
            getMySubmissions(p.id),
            getBadges(p.id),
            getCertificates(p.id),
            getServiceRecord(p.id),
            getBadgeProgress(),
            getNotifications(),
            getResumesForReview(p.id),
            getClosingReflections(p.id),
          ])
        if (cancelled) return
        setStreak(streakData)
        setSubmissions(mySubmissions)
        setBadges(allBadges)
        setCertificates(certs)
        setService(serviceRec)
        setBadgeProgress(progressData)
        setNotifications(notifs)
        setResumesReview(resumeReviews)
        setReflections(reflectionsData)

        if (serviceRec) {
          setServiceDraft({
            group_name: serviceRec.group_name ?? '',
            service_days: String(serviceRec.service_days ?? 0),
            mission_description: serviceRec.mission_description ?? '',
            focus: (serviceRec as ServiceRecord & { focus?: string | null }).focus ?? 'enseignement',
          })
        }

        if (classId) {
          const [courseData, classCourses, verse] = await Promise.all([
            getStudentCourse(classId),
            getClassCourses(classId),
            getDailyVerse(classId),
          ])
          if (cancelled) return
          setAllCourses(classCourses)
          setDailyVerse(verse)
          if (courseData) {
            await loadCourse(courseData, p.id)
          }
        }
      } catch {
        if (!cancelled) navigate('/')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadProfile, loadCourse])

  const submissionByAssignment = useMemo(() => {
    const map = new Map<string, MySubmission>()
    for (const s of submissions) {
      if (s.assignment_id) map.set(s.assignment_id, s)
    }
    return map
  }, [submissions])

  async function handleSaveSummary() {
    if (!profile || !course) return
    setSummarySaving(true)
    setSummarySaved(false)
    try {
      await saveResume(profile.id, course.id, summary)
      setSummarySaved(true)
      setMessage('Résumé enregistré. Merci pour ta fidélité.')
      playSuccess()
      setProgress(await getStudentProgress(profile.id))
      await refreshBadgeProgress(profile.id)
      setResumesReview(await getResumesForReview(profile.id))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur à la sauvegarde du résumé.')
    } finally {
      setSummarySaving(false)
    }
  }

  async function handleAttend() {
    if (!profile || !course || attended) return
    setAttending(true)
    setMessage(null)
    try {
      const result = await markCourseAttendance(profile.id, course.id)
      setAttended(true)
      if (result.newlyMarked) playSuccess()
      setStreak((prev) =>
        prev
          ? { ...prev, consecutive_weeks: result.streak }
          : { id: '', student_id: profile.id, week_start: '', consecutive_weeks: result.streak }
      )
      setProgress(await getStudentProgress(profile.id))
      await refreshBadgeProgress(profile.id)
      setMessage(
        result.newlyMarked
          ? 'Présence marquée. Ta série continue.'
          : 'Tu avais déjà marqué ta présence pour ce cours.'
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors du marquage de présence.')
    } finally {
      setAttending(false)
    }
  }

  async function handleSaveMiniTask() {
    if (!profile || !miniTask) return
    setMiniTaskSaving(true)
    setMiniTaskSaved(false)
    try {
      await saveMiniTaskResponse(profile.id, miniTask.id, miniTaskResponse)
      setMiniTaskSaved(true)
      setMessage('Mini-tâche enregistrée. Merci pour ta fidélité.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur à la sauvegarde de la mini-tâche.')
    } finally {
      setMiniTaskSaving(false)
    }
  }

  async function handleSubmitAssignment(assignmentId: string, e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    const draft = drafts[assignmentId] ?? { content: '', file: null }
    setSubmitting((prev) => ({ ...prev, [assignmentId]: true }))
    setSubmitMsg((prev) => ({ ...prev, [assignmentId]: '' }))
    try {
      await submitAssignment({
        studentId: profile.id,
        assignmentId,
        content: draft.content,
        ...(draft.file ? { file: draft.file } : {}),
      })
      setSubmissions(await getMySubmissions(profile.id))
      setSubmitMsg((prev) => ({ ...prev, [assignmentId]: 'Rendu enregistré.' }))
      setProgress(await getStudentProgress(profile.id))
    } catch (err) {
      setSubmitMsg((prev) => ({ ...prev, [assignmentId]: err instanceof Error ? err.message : 'Erreur.' }))
    } finally {
      setSubmitting((prev) => ({ ...prev, [assignmentId]: false }))
    }
  }

  function openDraft(assignmentId: string) {
    const existing = submissionByAssignment.get(assignmentId)
    if (!drafts[assignmentId]) {
      setDrafts((prev) => ({
        ...prev,
        [assignmentId]: { content: existing?.content ?? '', file: null },
      }))
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileDone(null)
    try {
      await updateProfileInfo({
        firstName: formFirst,
        lastName: formName,
        phone: formPhone,
        tribe: formTribe,
        department: formDept,
      })
      setProfileDone('Informations enregistrées.')
      const p = await loadProfile()
      if (p) {
        setFormName(p.last_name ?? '')
        setFormFirst(p.first_name ?? '')
        setFormPhone(p.phone ?? '')
        setFormTribe(p.tribe ?? '')
        setFormDept(p.department ?? '')
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleSaveService(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setServiceSaving(true)
    setServiceMsg(null)
    try {
      await upsertServiceRecord(profile.id, {
        group_name: serviceDraft.group_name,
        service_days: Number(serviceDraft.service_days) || 0,
        mission_description: serviceDraft.mission_description,
        focus: serviceDraft.focus,
      })
      setService(await getServiceRecord(profile.id))
      setServiceMsg('Fiche de service enregistrée.')
    } catch (err) {
      setServiceMsg(err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement.')
    } finally {
      setServiceSaving(false)
    }
  }

  async function handleSelectCourse(c: Course) {
    if (!profile) return
    setMessage(null)
    await loadCourse(c, profile.id)
    setSearchQuery('')
    setSearchWeek('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openBadgeHall() {
    if (!profile) return
    void refreshBadgeProgress(profile.id)
    setBadgeHallOpen(true)
  }

  async function handleSelectActiveBadge(type: string) {
    if (!profile) return
    setBadgeBusy(true)
    try {
      const next = profile.active_badge === type ? null : type
      await updateProfileInfo({
        firstName: profile.first_name,
        lastName: profile.last_name,
        activeBadge: next,
      })
      setProfile((prev) => (prev ? { ...prev, active_badge: next } : prev))
      playSuccess()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors du choix du badge actif.')
    } finally {
      setBadgeBusy(false)
    }
  }

  async function handleMarkNotificationsRead() {
    try {
      await markNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silencieux
    }
  }

  async function handleSubmitNotes(e: FormEvent) {
    e.preventDefault()
    if (!profile || !course) return
    if (notesFiles.length === 0) {
      setNotesMsg('Ajoute au moins une photo de tes notes manuscrites.')
      return
    }
    setNotesSubmitting(true)
    setNotesMsg(null)
    try {
      const urls: string[] = []
      for (const file of notesFiles) {
        if (!isNoteImageFile(file)) {
          setNotesMsg('Fichier non autorisé : image ou PDF de 10 Mo maximum.')
          return
        }
        urls.push(await uploadNoteFile(file, profile.id))
      }
      await submitNotes({
        studentId: profile.id,
        courseId: course.id,
        comment: notesComment,
        urls,
      })
      setNotesFiles([])
      setNotesComment('')
      setSubmissions(await getMySubmissions(profile.id))
      setNotesMsg('Notes manuscrites envoyées au modérateur.')
      playSuccess()
    } catch (err) {
      setNotesMsg(err instanceof Error ? err.message : 'Erreur lors de l\u2019envoi des notes.')
    } finally {
      setNotesSubmitting(false)
    }
  }

  async function handleSaveReflection(c: Course) {
    if (!profile) return
    setReflectionSaving((prev) => ({ ...prev, [c.id]: true }))
    setReflectionMsg(null)
    try {
      const content = reflectionDrafts[c.id] ?? ''
      await saveClosingReflection(profile.id, c.id, content)
      setReflections(await getClosingReflections(profile.id))
      setReflectionMsg(
        content ? 'Réflexion de clôture enregistrée.' : 'Réflexion de clôture retirée.'
      )
    } catch (err) {
      setReflectionMsg(
        err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement de la réflexion.'
      )
    } finally {
      setReflectionSaving((prev) => ({ ...prev, [c.id]: false }))
    }
  }

  const weeks = streak?.consecutive_weeks ?? 0
  // dailyVerse is loaded in the useEffect below
  const earnedBadgeKeys = useMemo(() => new Set(badges.map((b) => b.badge_type)), [badges])
  const earnedBadges = useMemo(() => BADGE_ORDER.filter((k) => earnedBadgeKeys.has(k)), [earnedBadgeKeys])
  const followedCount = followed.length

  const resumeByCourse = useMemo(() => {
    const map = new Map<string, ResumeReview>()
    for (const r of resumesReview) map.set(r.course.id, r)
    return map
  }, [resumesReview])

  const reflectionByCourse = useMemo(() => {
    const map = new Map<string, ClosingReflection>()
    for (const r of reflections) map.set(r.course_id, r)
    return map
  }, [reflections])

  const weekOptions = useMemo(
    () => [...new Set(allCourses.map((c) => c.week))].sort((a, b) => a - b),
    [allCourses]
  )

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const weekMatch = q.match(/(?:semaine\s*)?(\d+)/)
    const term = q.replace(/(semaine\s*)?\d+/g, '').trim()
    return allCourses.filter((c) => {
      if (searchWeek && c.week !== Number(searchWeek)) return false
      if (!q) return true
      if (weekMatch && c.week === Number(weekMatch[1])) return true
      return (
        (c.title?.toLowerCase().includes(term) ?? false) ||
        (c.description?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [allCourses, searchQuery, searchWeek])

  const followedChronological = useMemo(
    () =>
      [...followed].sort(
        (a, b) => a.week - b.week || (a.session_date ?? '').localeCompare(b.session_date ?? '')
      ),
    [followed]
  )

  const revueItems = useMemo(
    () =>
      followedChronological
        .map((c) => {
          const rev = resumeByCourse.get(c.id) ?? null
          const graded = rev !== null && rev.resume.grade !== null && rev.resume.grade !== undefined
          return { course: c, rev, graded }
        })
        .filter((item) => {
          if (revueFilter === 'graded') return item.graded
          if (revueFilter === 'pending') return !item.graded
          return true
        }),
    [followedChronological, resumeByCourse, revueFilter]
  )

  const notesSubmissions = useMemo(
    () =>
      submissions.filter((s) => s.type === 'notes' && s.course_id === course?.id),
    [submissions, course]
  )

  const gradedReviews = useMemo(
    () =>
      resumesReview
        .filter((r) => r.resume.grade !== null && r.resume.grade !== undefined)
        .sort(
          (a, b) => a.course.week - b.course.week || (a.course.session_date ?? '').localeCompare(b.course.session_date ?? '')
        ),
    [resumesReview]
  )

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-48 rounded-card bg-pierre/10" />
          <div className="h-20 rounded-card bg-pierre/10" />
          <div className="h-44 rounded-card bg-pierre/10" />
        </div>
      </div>
    )
  }

  if (showRegistration && profile) {
    return (
      <RegistrationStep2
        profile={{ first_name: profile.first_name, last_name: profile.last_name, avatar_url: profile.avatar_url ?? undefined, tribe: profile.tribe ?? undefined, department: profile.department ?? undefined }}
        onComplete={() => setShowRegistration(false)}
      />
    )
  }

  const studentSidebarItems: SidebarItem[] = [
    { key: 'academie', label: 'Académie', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { key: 'annonces', label: 'Annonces', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { key: 'devoirs', label: 'Devoirs', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { key: 'revue', label: 'Revue', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { key: 'service', label: 'Service', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8m-4-4v4m-4-8a4 4 0 0 1-4-4V4h16v5a4 4 0 0 1-4 4h-4z"/><circle cx="12" cy="7" r="3"/></svg> },
    { key: 'messagerie', label: 'Messagerie', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { key: 'profil', label: 'Profil', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]

  return (
    <div className="relative min-h-screen md:pl-[68px]">
      <Sidebar
        items={studentSidebarItems}
        activeKey={tab}
        onSelect={(k) => setTab(k as Tab)}
        header={<Logo showText={false} size={28} />}
      />
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
      <SectionWatermark
        kind={tab === 'devoirs' || tab === 'revue' ? 'livre' : tab === 'service' ? 'mains' : 'flamme'}
      />
      <div className="relative z-10 page-enter">
      <DayAccentBand />
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo showText={false} size={34} />
            <div>
              <h1 className="font-display text-2xl text-bordeaux">Ton espace Académie</h1>
              {profile && (
                <p className="flex items-center gap-2 text-sm text-pierre">
                  {profile.first_name} {profile.last_name}
                  <VerseReference />
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell notifications={notifications} onMarkRead={handleMarkNotificationsRead} />
            <Avatar
              url={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              size={40}
              badgeType={profile?.active_badge ?? null}
              onClick={() => setTab('profil')}
              onBadgeClick={openBadgeHall}
            />
            <SoundToggle />
          </div>
        </div>
      </header>

      {message && (
        <p className="mb-4 rounded-md border border-olive/30 bg-olive/5 px-3 py-2 text-sm text-bordeaux">
          {message}
        </p>
      )}

      {tab === 'academie' && (
        <div className="space-y-5">
          <Card>
            <div className="quote-in relative pl-10">
              <span
                className="absolute left-0 top-1 font-display text-5xl leading-none text-or"
                aria-hidden="true"
              >
                "
              </span>
              {dailyVerse ? (
                <>
                  <p className="font-display text-lg leading-snug text-bordeaux">{dailyVerse.verse_text}</p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-wide text-pierre">
                    {dailyVerse.verse_reference}
                  </p>
                </>
              ) : (
                <p className="text-sm text-pierre italic">
                  Le verset du jour n'est pas encore disponible pour ta classe.
                </p>
              )}
            </div>
          </Card>

          <StreakBadge weeks={weeks} />

          <Card>
            <CardTitle>Rechercher un cours</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Parcours les cours de ta classe par mot-clé et par semaine.
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titre, description… (ex. semaine 3)"
                className="max-w-xs"
              />
              <select
                value={searchWeek}
                onChange={(e) => setSearchWeek(e.target.value)}
                aria-label="Filtrer par semaine"
                className="rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              >
                <option value="">Toutes les semaines</option>
                {weekOptions.map((w) => (
                  <option key={w} value={w}>
                    Semaine {w}
                  </option>
                ))}
              </select>
            </div>
            {searchQuery.trim() !== '' || searchWeek !== '' ? (
              <div className="mt-3">
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-pierre">Aucun cours ne correspond à ta recherche.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {filteredCourses.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectCourse(c)}
                          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-pierre/15 px-3 py-2 text-left text-sm transition-colors hover:border-or/60 hover:bg-or/5"
                        >
                          <span className="font-medium text-bordeaux">
                            Semaine {c.week} — {c.title}
                          </span>
                          <span className="shrink-0 text-xs text-pierre">Ouvrir →</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-pierre">
                Astuce : tape « semaine 3 » ou un mot du titre pour retrouver un cours.
              </p>
            )}
          </Card>

          {earnedBadges.length > 0 && (
            <Card>
              <CardTitle>Les médailles de ton parcours</CardTitle>
              <CardDescription className="mt-1 mb-3">
                Elles défilent à l'image de ta fidélité — passe la souris dessus pour les contempler.
              </CardDescription>
              <Marquee pauseOnHover className="py-2">
                {earnedBadges.map((key) => (
                  <span key={key} className="w-24 shrink-0">
                    <Badge type={key} size={64} />
                  </span>
                ))}
              </Marquee>
            </Card>
          )}

          <Card>
            <CardTitle>{course ? course.title : 'Cours de la semaine'}</CardTitle>
            {course && (
              <CardDescription className="mt-1 mb-4">
                Semaine {course.week} · {course.class?.name ?? 'Ta classe'}
                {course.session_date ? ` · ${formatDateFR(course.session_date)}` : ''}
              </CardDescription>
            )}

            {course ? (
              <>
                <div className="mb-4">
                  <CoursePlayer audioUrl={course.audio_url} videoUrl={course.video_url} />
                </div>

                {/* Quiz button */}
                {course.id && (
                  <QuizButtonSection courseId={course.id} onOpenQuiz={setActiveQuizId} />
                )}

                {course.audio_url && (
                  <>
                    <p className="mb-1 text-xs font-medium text-pierre">Écoute hors-ligne</p>
                    <Button
                      variant="ghost"
                      className="mb-4 !px-0 text-xs underline"
                      onClick={() =>
                        downloadCourseMedia(course.audio_url as string, `cours-semaine-${course.week}.mp3`)
                      }
                    >
                      Télécharger l'audio de ce cours
                    </Button>
                  </>
                )}

                <label className="mb-1.5 block text-sm font-medium text-bordeaux">Ton résumé du cours</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ce que je retiens de ce cours…"
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={handleSaveSummary}
                    disabled={summarySaving}
                  >
                    {summarySaving ? 'Enregistrement…' : 'Enregistrer le résumé'}
                  </Button>
                  {summarySaved && <span className="text-xs text-olive">Résumé sauvegardé.</span>}
                </div>

                <div className="mt-4 rounded-card border border-or/40 bg-parchemin p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">Ta présence</p>
                  <p className="mt-1 text-sm text-pierre">
                    Marque ta présence pour confirmer que tu as suivi le cours de la semaine.
                  </p>
                  <Button
                    className="mt-2 !px-3 !py-1.5 text-xs"
                    onClick={handleAttend}
                    disabled={attended || attending}
                  >
                    {attended ? 'Présence marquée' : attending ? 'Enregistrement…' : "J'ai suivi ce cours"}
                  </Button>
                </div>

                {miniTask && (
                  <div className="mt-4 rounded-card border border-olive/30 bg-olive/5 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-olive">
                      Mini-tâche de la semaine
                    </p>
                    <p className="mt-1 text-sm text-bordeaux">{miniTask.instruction}</p>
                    <textarea
                      rows={3}
                      value={miniTaskResponse}
                      onChange={(e) => setMiniTaskResponse(e.target.value)}
                      placeholder={
                        miniTaskResponse || miniTaskSaved ? '' : "Raconte comment tu l'as mise en pratique…"
                      }
                      className="mt-2 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        className="!px-3 !py-1.5 text-xs"
                        onClick={handleSaveMiniTask}
                        disabled={miniTaskSaving}
                      >
                        {miniTaskSaving
                          ? 'Enregistrement…'
                          : miniTaskSaved
                            ? 'Réponse enregistrée'
                            : 'Enregistrer ma réponse'}
                      </Button>
                      {miniTaskSaved && <span className="text-xs text-olive">C'est enregistré !</span>}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-card border border-olive/30 bg-olive/5 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-olive">Mise en pratique</p>
                  <p className="mt-1 text-sm text-bordeaux">
                    Cette semaine, identifie une situation où tu as dû agir par la foi. Reviens raconter
                    comment cela s'est passé — ce témoignage fait partie de ta formation.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-pierre">Aucun cours publié pour ta classe pour le moment.</p>
            )}
          </Card>

          <Card>
            <CardTitle>Ton tableau de bord</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Cours déjà suivis : {followedCount}. Voici ta progression sur la session.
            </CardDescription>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <ProgressStat label="Présence" value={`${progress?.presenceRate ?? 0}%`} />
              <ProgressStat label="Résumés faits" value={`${progress?.resumeRate ?? 0}%`} />
              <ProgressStat label="Moyenne exercices & devoirs" value={progress?.averageGrade ?? '—'} />
              <ProgressStat label="Méditation de la Parole" value={String(progress?.meditationGrade ?? '—')} />
            </dl>
            {followed.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-sable/60 pt-3 text-sm text-pierre">
                {followed.map((c) => (
                  <li key={c.id}>• Semaine {c.week} — {c.title}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Badges</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Chaque étape franchie dessine ta fidélité. Les badges encore scellés attendent la suite de ton parcours.
            </CardDescription>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {BADGE_ORDER.map((key) => (
                <Badge key={key} type={key} locked={!earnedBadgeKeys.has(key)} />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={openBadgeHall}>
                Salle des badges — progression
              </Button>
            </div>
          </Card>

          {certificates.length > 0 && (
            <Card>
              <CardTitle>Ton certificat</CardTitle>
              <CardDescription className="mt-1 mb-4">
                Félicitations pour avoir mené ton cycle à son terme.
              </CardDescription>
              {[...certificates]
                .sort((a, b) => b.cycle - a.cycle)
                .map((cert) => (
                  <CertificateView
                    key={cert.id}
                    certificate={cert}
                    firstName={profile?.first_name ?? ''}
                    lastName={profile?.last_name ?? ''}
                    className="mb-4"
                  />
                ))}
            </Card>
          )}
        </div>
      )}

      {tab === 'annonces' && (
        <AnnoncesEtudiantTab classId={profile?.class_id ?? null} />
      )}

      {tab === 'devoirs' && (
        <div className="space-y-5">
          <Card>
            <CardTitle>Devoirs & exercices</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Rend tes réponses ici : ta réponse écrite et, si besoin, une pièce jointe (photo, document).
            </CardDescription>
            {assignments.length === 0 ? (
              <p className="text-sm text-pierre">Aucun devoir ni exercice publié pour ce cours.</p>
            ) : (
              <ul className="space-y-4">
                {assignments.map((a) => {
                  const submitted = submissionByAssignment.get(a.id)
                  return (
                    <li key={a.id} className="rounded-card border border-pierre/15 p-4">
                      <p className="font-medium text-bordeaux">
                        {a.type === 'DEVOIR' ? 'Devoir' : 'Exercice'} — {a.description}
                      </p>
                      {a.due_date && (
                        <p className="mt-0.5 text-xs text-pierre">À rendre : {formatDate(a.due_date)}</p>
                      )}
                      {submitted && (
                        <div className="mt-3 rounded-md border border-olive/30 bg-olive/5 p-3 text-sm">
                          <p className="text-olive">
                            Rendu le {submitted.submitted_at ? formatDate(submitted.submitted_at) : '—'}
                          </p>
                          {submitted.grade !== null && submitted.grade !== undefined && (
                            <p className="mt-1 font-medium text-bordeaux">Note : {submitted.grade}/20</p>
                          )}
                          {submitted.feedback && <p className="mt-1 text-pierre">{submitted.feedback}</p>}
                          <Button
                            variant="ghost"
                            className="mt-2 !px-3 !py-1 text-xs underline"
                            onClick={() => openDraft(a.id)}
                          >
                            Renvoyer une nouvelle réponse
                          </Button>
                        </div>
                      )}
                      {(submitted === undefined || drafts[a.id] !== undefined) && (
                        <form
                          className="mt-3 space-y-2"
                          onSubmit={(e) => handleSubmitAssignment(a.id, e)}
                          onClick={() => openDraft(a.id)}
                        >
                          <textarea
                            rows={3}
                            placeholder="Ta réponse…"
                            className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                            value={drafts[a.id]?.content ?? ''}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [a.id]: { content: e.target.value, file: prev[a.id]?.file ?? null },
                              }))
                            }
                          />
                          <input
                            type="file"
                            accept="image/*,application/pdf,audio/*"
                            className="block w-full text-xs text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-xs file:text-parchemin"
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [a.id]: {
                                  content: prev[a.id]?.content ?? '',
                                  file: e.target.files?.[0] ?? null,
                                },
                              }))
                            }
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="!px-3 !py-1.5 text-xs"
                            disabled={submitting[a.id]}
                          >
                            {submitting[a.id] ? 'Envoi…' : submitted ? 'Renvoyer' : 'Répondre'}
                          </Button>
                          {submitMsg[a.id] && <p className="text-xs text-olive">{submitMsg[a.id]}</p>}
                        </form>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Notes manuscrites</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Photographie ou scanne tes notes du cours et envoie-les au modérateur : il pourra les
              corriger, les noter et t'écrire un retour.
            </CardDescription>
            {!course ? (
              <p className="text-sm text-pierre">Aucun cours actif pour le moment.</p>
            ) : (
              <form onSubmit={handleSubmitNotes} className="space-y-3">
                <div>
                  <Label htmlFor="notes-files">Photos de tes notes</Label>
                  <input
                    id="notes-files"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="block w-full text-xs text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-xs file:text-parchemin"
                    onChange={(e) => setNotesFiles(Array.from(e.target.files ?? []))}
                  />
                  {notesFiles.length > 0 && (
                    <p className="mt-1 text-xs text-pierre">
                      {notesFiles.length} fichier{notesFiles.length > 1 ? 's' : ''} sélectionné
                      {notesFiles.length > 1 ? 's' : ''}.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes-comment">Commentaire libre</Label>
                  <textarea
                    id="notes-comment"
                    rows={3}
                    value={notesComment}
                    onChange={(e) => setNotesComment(e.target.value)}
                    placeholder="Un mot sur ces notes : la partie du cours, une difficulté, une question…"
                    className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                  />
                </div>
                <Button type="submit" disabled={notesSubmitting}>
                  {notesSubmitting ? 'Envoi…' : 'Envoyer mes notes manuscrites'}
                </Button>
                {notesMsg && <p className="text-sm text-olive">{notesMsg}</p>}
              </form>
            )}

            {notesSubmissions.length > 0 && (
              <ul className="mt-4 space-y-3 border-t border-sable/60 pt-3">
                {notesSubmissions.map((s) => (
                  <li key={s.id} className="rounded-card border border-pierre/15 p-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {(s.attachments ?? (s.file_url ? [s.file_url] : [])).map((url, i) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={url}
                            alt={`Photo de notes ${i + 1}`}
                            className="h-16 w-16 rounded-md object-cover ring-1 ring-or/40"
                          />
                        </a>
                      ))}
                    </div>
                    {s.content && <p className="mt-2 text-pierre">{s.content}</p>}
                    <p className="mt-1 font-mono text-[10px] text-pierre/70">
                      Envoyé le {s.submitted_at ? formatDate(s.submitted_at) : '—'}
                    </p>
                    {s.grade !== null && s.grade !== undefined && (
                      <p className="mt-1 font-medium text-bordeaux">Note : {s.grade}/20</p>
                    )}
                    {s.feedback && <p className="mt-0.5 text-pierre">{s.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'service' && (
        <Card>
          <CardTitle>Service</CardTitle>
          <CardDescription className="mt-1 mb-4">
            Ta place dans le corps de l'Académie : ton groupe, tes jours de service et tes missions.
          </CardDescription>
          <form onSubmit={handleSaveService} className="space-y-4">
            <div>
              <Label htmlFor="group">Groupe de service</Label>
              <Input
                id="group"
                value={serviceDraft.group_name}
                onChange={(e) => setServiceDraft((prev) => ({ ...prev, group_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="days">Jours de service effectués</Label>
              <Input
                id="days"
                type="number"
                min={0}
                value={serviceDraft.service_days}
                onChange={(e) => setServiceDraft((prev) => ({ ...prev, service_days: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="mission">Missions & sorties (évangélisation, service…)</Label>
              <textarea
                id="mission"
                rows={3}
                value={serviceDraft.mission_description}
                onChange={(e) =>
                  setServiceDraft((prev) => ({ ...prev, mission_description: e.target.value }))
                }
                placeholder="Les missions auxquelles tu as participé cette session…"
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="focus">Domaine de service</Label>
              <select
                id="focus"
                value={serviceDraft.focus}
                onChange={(e) => setServiceDraft((prev) => ({ ...prev, focus: e.target.value }))}
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
              >
                {['enseignement', 'accueil', 'louange', 'intercession', 'logistique', 'autre'].map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="rounded-md border border-sable/60 bg-white/60 px-3 py-2 text-sm">
              <span className="text-pierre">Note de service : </span>
              <span className="font-display font-semibold text-bordeaux">
                {service?.service_note ?? 'En attente'}
              </span>
            </div>
            <Button type="submit" disabled={serviceSaving}>
              {serviceSaving ? 'Enregistrement…' : 'Enregistrer ma fiche de service'}
            </Button>
            {serviceMsg && <p className="text-sm text-olive">{serviceMsg}</p>}
          </form>
        </Card>
      )}

      {tab === 'revue' && (
        <div className="space-y-5">
          <Card>
            <CardTitle>Revue des cours suivis</CardTitle>
            <CardDescription className="mt-1 mb-3">
              L'historique complet de ta session : cours → résumé → correction → réflexion finale.
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'Tout'],
                  ['pending', 'En attente de correction'],
                  ['graded', 'Corrigés'],
                ] as ['all' | 'pending' | 'graded', string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRevueFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    revueFilter === key ? 'bg-bordeaux text-parchemin' : 'text-pierre hover:bg-bordeaux/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          {gradedReviews.length > 0 && (
            <Card>
              <CardTitle>Progression des notes</CardTitle>
              <CardDescription className="mt-1 mb-3">
                L'évolution de tes notes de résumés au fil des semaines.
              </CardDescription>
              <div className="space-y-2">
                {gradedReviews.map((r) => {
                  const grade = Number(r.resume.grade) || 0
                  return (
                    <div key={r.resume.id} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 font-mono text-xs text-pierre">
                        Semaine {r.course.week}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-pierre/15">
                        <div
                          className="h-full rounded-full bg-or"
                          style={{ width: `${Math.min(100, (grade / 20) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-display text-sm text-bordeaux">
                        {grade}/20
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {revueItems.length === 0 ? (
            <Card>
              <p className="text-sm text-pierre">
                Aucun cours suivi pour le moment : valide ta présence sur un cours pour le retrouver ici.
              </p>
            </Card>
          ) : (
            revueItems.map(({ course: c, rev }) => {
              const reflection = reflectionByCourse.get(c.id)
              const graded =
                rev !== null && rev.resume.grade !== null && rev.resume.grade !== undefined
              const draft = reflectionDrafts[c.id] ?? reflection?.content ?? ''
              const saving = reflectionSaving[c.id]
              return (
                <Card key={c.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>
                        Semaine {c.week} — {c.title}
                      </CardTitle>
                      {c.session_date && (
                        <CardDescription className="mt-0.5">{formatDateFR(c.session_date)}</CardDescription>
                      )}
                    </div>
                    {graded ? (
                      <span className="rounded-full bg-olive/15 px-2.5 py-1 text-xs font-medium text-olive">
                        Corrigé — {rev.resume.grade}/20
                      </span>
                    ) : (
                      <span className="rounded-full bg-or/15 px-2.5 py-1 text-xs font-medium text-or">
                        En attente de correction
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="rounded-md border border-pierre/15 bg-white/50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">Ton résumé</p>
                      {rev && rev.resume.content ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-pierre">{rev.resume.content}</p>
                      ) : (
                        <p className="mt-1 text-sm italic text-pierre/70">Pas encore de résumé écrit.</p>
                      )}
                    </div>

                    {graded && (
                      <div className="rounded-md border border-olive/30 bg-olive/5 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-olive">Correction</p>
                        <p className="mt-1 text-sm text-pierre">
                          Note :{' '}
                          <span className="font-display font-semibold text-bordeaux">
                            {rev.resume.grade}/20
                          </span>
                          {rev.resume.feedback ? (
                            <span className="mt-0.5 block">Appréciation : {rev.resume.feedback}</span>
                          ) : null}
                        </p>
                      </div>
                    )}

                    {(c.audio_url || c.video_url) && (
                      <div className="flex flex-wrap gap-2">
                        {c.audio_url && (
                          <Button
                            variant="ghost"
                            className="!px-3 !py-1.5 text-xs underline"
                            onClick={() =>
                              downloadCourseMedia(c.audio_url as string, `cours-semaine-${c.week}.mp3`)
                            }
                          >
                            Télécharger l'audio
                          </Button>
                        )}
                        {c.video_url && (
                          <a
                            href={c.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-pierre/25 px-3 py-1.5 text-xs text-bordeaux underline"
                          >
                            Revoir la vidéo
                          </a>
                        )}
                      </div>
                    )}

                    {graded && (
                      <div className="rounded-card border border-or/40 bg-parchemin p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">
                          Clôture de la session
                        </p>
                        <p className="mt-1 text-sm text-pierre">
                          « Que retenez-vous de cette session qui s'achève ? »
                        </p>
                        <textarea
                          rows={2}
                          value={draft}
                          onChange={(e) => setReflectionDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder={reflection?.content ? '' : 'Ta réflexion, en quelques mots…'}
                          className="mt-2 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            className="!px-3 !py-1.5 text-xs"
                            disabled={saving}
                            onClick={() => handleSaveReflection(c)}
                          >
                            {saving ? 'Enregistrement…' : 'Enregistrer ma réflexion'}
                          </Button>
                          {reflection?.answered_at && (
                            <span className="text-xs text-olive">
                              Réfléchi le {formatDate(reflection.answered_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })
          )}
          {reflectionMsg && <p className="text-sm text-olive">{reflectionMsg}</p>}
        </div>
      )}

      {tab === 'messagerie' && (
        <div className="space-y-4">
          <MessagingPanel currentUserId={profile?.id ?? ''} userRole="ETUDIANT" />
        </div>
      )}

      {tab === 'profil' && profile && (
        <div className="space-y-5">
          <Card>
            <CardTitle>Paramètres du profil</CardTitle>
            <CardDescription className="mt-2 mb-4">
              Photo de profil et informations personnelles. Tout reste entre les mains de l'Académie.
            </CardDescription>
            <AvatarUpload
              url={profile.avatar_url}
              firstName={profile.first_name}
              lastName={profile.last_name}
              userId={profile.id}
              onSaved={(url) => setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev))}
            />
          </Card>

          <Card>
            <CardTitle>Badge actif sur ton avatar</CardTitle>
            <CardDescription className="mt-2 mb-3">
              Choisis parmi tes badges obtenus celui qui s'affiche en médaillon doré sur ta photo de
              profil. Un simple clic sur le médaillon ouvre la salle des badges.
              {profile.active_badge && (
                <span className="mt-2 block text-xs text-olive">
                  Badge actif :{' '}
                  {isBadgeKey(profile.active_badge) ? BADGES[profile.active_badge].label : profile.active_badge}
                </span>
              )}
            </CardDescription>
            {earnedBadges.length === 0 ? (
              <p className="text-sm text-pierre">Aucun badge obtenu pour le moment.</p>
            ) : (
              <div className="flex flex-wrap items-start gap-3">
                {earnedBadges.map((key) => (
                  <button
                    key={key}
                    type="button"
                    disabled={badgeBusy}
                    onClick={() => handleSelectActiveBadge(key)}
                    aria-pressed={profile.active_badge === key}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-card border p-2 transition-colors disabled:cursor-wait ${
                      profile.active_badge === key
                        ? 'border-or bg-or/10'
                        : 'border-pierre/15 hover:border-or/50'
                    }`}
                  >
                    <Badge type={key} size={44} />
                    {profile.active_badge === key && (
                      <span className="rounded-full bg-bordeaux px-2 py-0.5 font-mono text-[10px] text-parchemin">
                        Actif
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3">
              <Button variant="ghost" className="!px-3 !py-1.5 text-xs underline" onClick={openBadgeHall}>
                Voir toute la salle des badges
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Mes informations</CardTitle>
            <CardDescription className="mt-2 mb-4">
              Modifie tes coordonnées : elles servent au suivi de la session.
            </CardDescription>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pf-first">Prénom</Label>
                  <Input
                    id="pf-first"
                    required
                    value={formFirst}
                    onChange={(e) => setFormFirst(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pf-last">Nom</Label>
                  <Input
                    id="pf-last"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pf-phone">Téléphone</Label>
                <Input
                  id="pf-phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pf-tribe">Tribu</Label>
                  <Input
                    id="pf-tribe"
                    value={formTribe}
                    onChange={(e) => setFormTribe(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pf-dept">Département</Label>
                  <Input
                    id="pf-dept"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-md border border-sable/60 bg-white/60 px-3 py-2 text-sm">
                <span className="text-pierre">Classe : </span>
                <span className="font-display font-semibold text-bordeaux">
                  {course?.class?.name ?? 'Non assignée'}
                </span>
              </div>
              <FieldError>{profileError ?? undefined}</FieldError>
              {profileDone && <p className="text-sm text-olive">{profileDone}</p>}
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? 'Enregistrement…' : 'Enregistrer mes informations'}
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Compte</CardTitle>
            <CardDescription className="mt-2 mb-3">
              Tu peux télécharger ton bulletin ou te déconnecter.
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              <BulletinPDF studentId={profile.id} />
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut()
                  navigate('/')
              }}
            >
              Se déconnecter
            </Button>
            </div>
          </Card>
        </div>
      )}

      {badgeHallOpen && (
        <BadgeHall
          progress={badgeProgress}
          activeBadge={profile?.active_badge ?? null}
          busy={badgeBusy}
          onClose={() => setBadgeHallOpen(false)}
          onSelect={handleSelectActiveBadge}
        />
      )}

      {activeQuizId && (
        <QuizPlayer quizId={activeQuizId} onClose={() => setActiveQuizId(null)} />
      )}
      </div>
      </div>
    </div>
  )
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card !p-3 text-center">
      <dt className="text-xs text-pierre dark:text-slate-400">{label}</dt>
      <dd className="font-display text-xl text-bordeaux dark:text-or">{value}</dd>
    </div>
  )
}

function QuizButtonSection({ courseId, onOpenQuiz }: { courseId: string; onOpenQuiz: (id: string) => void }) {
  const [quizzes, setQuizzes] = useState<{ id: string; title: string; attempted?: boolean }[]>([])

  useEffect(() => {
    import('@/lib/courses').then(({ getCourseQuizzes }) =>
      getCourseQuizzes(courseId).then((data) => setQuizzes(data))
    ).catch(() => undefined)
  }, [courseId])

  if (quizzes.length === 0) return null

  return (
    <div className="mb-4 rounded-lg border border-or/20 bg-or/5 p-3">
      <p className="mb-2 text-xs font-medium text-bordeaux">Quiz disponibles</p>
      <div className="space-y-1">
        {quizzes.map((q) => (
          <button
            key={q.id}
            onClick={() => !q.attempted && onOpenQuiz(q.id)}
            disabled={q.attempted}
            className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
              q.attempted ? 'cursor-default text-pierre/60' : 'hover:bg-or/10 text-bordeaux'
            }`}
          >
            <span>{q.title}</span>
            <span className={`text-xs ${q.attempted ? 'text-olive' : 'text-or font-medium'}`}>
              {q.attempted ? '✓ Passé' : 'Passer →'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function NavItem({
  label,
  active,
  icon,
  onClick,
}: {
  label: string
  active: boolean
  icon: 'vase' | 'parchemin' | 'revue' | 'coupe' | 'medaille'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
        active ? 'text-bordeaux' : 'text-pierre hover:text-bordeaux'
      }`}
    >
      <NavIcon name={icon} active={active} />
      {label}
    </button>
  )
}

function NavIcon({ name, active }: { name: 'vase' | 'parchemin' | 'revue' | 'coupe' | 'medaille'; active: boolean }) {
  const color = active ? '#5D2A41' : '#6B6B6B'
  const accent = '#CFAF5B'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === 'vase' && (
        <>
          <path
            d="M12 3c0 4-4 5-4 8.5A4 4 0 0012 15a4 4 0 004-3.5C16 8 12 7 12 3z"
            stroke={color}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 15v5" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {name === 'parchemin' && (
        <>
          <rect x="5" y="5" width="14" height="14" rx="1.5" stroke={color} strokeWidth="1.6" />
          <path d="M5 10 h14 M5 14 h14" stroke={accent} strokeWidth="1.4" />
        </>
      )}
      {name === 'revue' && (
        <>
          <path d="M4 5.5 A8 4 0 0 1 12 5.5 A8 4 0 0 1 20 5.5 V18.5 A8 4 0 0 0 12 18.5 A8 4 0 0 0 4 18.5 Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 5.5 V18.5" stroke={accent} strokeWidth="1.4" />
        </>
      )}
      {name === 'coupe' && (
        <>
          <path
            d="M7 4 a5 5 0 0 0 10 0 M8 4 h8"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M12 9 v3 a4 4 0 0 1-4 4 c0 3 2 4 4 4 c2 0 4-1 4-4 a4 4 0 0 1-4-4z" stroke={accent} strokeWidth="1.6" fill="none" />
        </>
      )}
      {name === 'medaille' && (
        <>
          <circle cx="12" cy="14" r="5.5" stroke={color} strokeWidth="1.6" />
          <circle cx="12" cy="14" r="2" fill={accent} />
          <path d="M9 3 l3 4 3-4 M9 3 v3 M15 3 v3" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}

function formatDateFR(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}
