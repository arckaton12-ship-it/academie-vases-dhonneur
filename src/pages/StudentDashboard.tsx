import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RegistrationStep2 from '@/components/RegistrationStep2'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { CollapsibleCard } from '@/components/ui/CollapsibleCard'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Sidebar, SidebarItem } from '@/components/ui/Sidebar'
import { QuizPlayer } from '@/components/QuizPlayer'
import { BulletinPDF } from '@/components/BulletinPDF'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { CoursePlayer, downloadCourseMedia } from '@/components/CoursePlayer'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { AvatarUpload } from '@/components/AvatarUpload'
import { Badge } from '@/components/Badge'
import { BadgeDrawer } from '@/components/BadgeDrawer'
import { BadgeEarnModal } from '@/components/BadgeEarnModal'
import { BadgePath } from '@/components/BadgePath'
import { StreakFlame } from '@/components/StreakFlame'
import { CertificateView } from '@/components/Certificate'
import { SoundToggle } from '@/components/SoundToggle'
import { SettingsTab } from '@/components/SettingsTab'
import { MascotCompanion, MascotMood } from '@/components/MascotCompanion'
import { FloatingMascot } from '@/components/FloatingMascot'
import { NotificationPrompt } from '@/components/NotificationPrompt'
import { NotificationBanner } from '@/components/NotificationBanner'
import { CoursePath } from '@/components/CoursePath'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { registerServiceWorker } from '@/lib/pushNotifications'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { DayAccentBand } from '@/components/DayAccentBand'
import { NotificationsBell, NotificationRow } from '@/components/NotificationsBell'
import { getCurrentProfile, signOut, updateProfileInfo } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getDailyVerse, getAnnouncements, Announcement } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'
import { MessagingPanel } from '@/components/MessagingPanel'
import { DevoirsTab } from '@/components/DevoirsTab'
import { LevelBadge } from '@/components/LevelBadge'
import { Leaderboard } from '@/components/Leaderboard'
import { XpBar } from '@/components/XpBar'
import { AttendanceGauge } from '@/components/AttendanceGauge'
import { ClassPicker } from '@/components/ClassPicker'
import BilanPopup from '@/components/BilanPopup'
import {
  getAssignments,
  getClassCourses,
  getCourses,
  getClasses,
  getStudentCourse,
  getCurrentWeekForClass,
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
  uploadResumeFile,
  deleteResumeFile,
  isResumeFile,
  RESUME_FILE_MAX_SIZE,
  getWeeklyBilan,
  saveWeeklyBilan,
  awardXp,
  getBilanPreferences,
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

type Tab = 'academie' | 'annonces' | 'devoirs' | 'service' | 'revue' | 'parametres' | 'messagerie' | 'parcours'

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

function AnnoncesEtudiantTab({ classId, studentFirstName }: { classId: string | null; studentFirstName: string | null }) {
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
                <p className="mt-1 text-sm text-pierre whitespace-pre-wrap">{studentFirstName ? `Bonjour ${studentFirstName},\n\n` : ''}{a.content}</p>
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

  const TAB_ORDER: Tab[] = ['academie', 'annonces', 'devoirs', 'revue', 'parcours', 'service', 'messagerie', 'parametres']
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      const idx = TAB_ORDER.indexOf(tab)
      if (idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1])
    },
    onSwipeRight: () => {
      const idx = TAB_ORDER.indexOf(tab)
      if (idx > 0) setTab(TAB_ORDER[idx - 1])
    },
  })

  const [profile, setProfile] = useState<ProfileState | null>(null)
  const { current: currentNotif, dismiss: dismissNotif } = useInAppNotifications({ userId: profile?.id })
  const [showRegistration, setShowRegistration] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [summary, setSummary] = useState('')
  const [summaryFileUrl, setSummaryFileUrl] = useState<string | null>(null)
  const [summaryFileName, setSummaryFileName] = useState<string | null>(null)
  const [summarySaved, setSummarySaved] = useState(false)
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [summarySaving, setSummarySaving] = useState(false)
  const [summaryUploading, setSummaryUploading] = useState(false)
  const [attended, setAttended] = useState(false)
  const [attending, setAttending] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<MySubmission[]>([])
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [followed, setFollowed] = useState<Course[]>([])
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [celebrateBadge, setCelebrateBadge] = useState<string | null>(null)
  const prevBadgeTypesRef = useRef(new Set<string>())
  const searchOverlayRef = useRef<HTMLDivElement>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [service, setService] = useState<ServiceRecord | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [miniTask, setMiniTask] = useState<MiniTask | null>(null)
  const [miniTaskResponse, setMiniTaskResponse] = useState('')
  const [miniTaskSaving, setMiniTaskSaving] = useState(false)
  const [miniTaskSaved, setMiniTaskSaved] = useState(false)

  // ---- XP / Gamification
  const [xpData, setXpData] = useState<{ xp: number; level: number; levelLabel: string; nextLevelLabel: string | null; xpInLevel: number; xpForNextLevel: number } | null>(null)

  // ---- Mascot companion mood
  const mascotMood = useMemo<MascotMood>(() => {
    if (!streak || streak.consecutive_weeks === 0) return 'welcoming'
    if (progress && progress.presenceRate >= 80) return 'proud'
    const hour = new Date().getHours()
    if (hour >= 20 && (!progress || progress.presenceRate < 50)) return 'attentive'
    return 'happy'
  }, [streak, progress])

  // ---- Salle des badges + badge actif
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([])
  const [badgeDrawerOpen, setBadgeDrawerOpen] = useState(false)
  const [badgeBusy, setBadgeBusy] = useState(false)

  // ---- Notifications in-app
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  // ---- Verset du jour par classe
  const [dailyVerse, setDailyVerse] = useState<{ verse_text: string; verse_reference: string } | null>(null)

  // ---- Bilan hebdomadaire
  const [bilanResume, setBilanResume] = useState(false)
  const [bilanMeditation, setBilanMeditation] = useState<'all_days' | 'some_days' | 'none'>('none')
  const [bilanMeditationDays, setBilanMeditationDays] = useState(0)
  const [bilanEvangelisation, setBilanEvangelisation] = useState<'soul_won' | 'evangelized_no_soul' | 'none'>('none')
  const [bilanContactName, setBilanContactName] = useState('')
  const [bilanContactPhone, setBilanContactPhone] = useState('')
  const [bilanSaved, setBilanSaved] = useState(false)
  const [bilanSaving, setBilanSaving] = useState(false)

  // ---- Bilan popup
  const [showBilanPopup, setShowBilanPopup] = useState(false)
  const [bilanPopupData, setBilanPopupData] = useState<{ studentName: string; weekNumber: number; currentBilanDay: number; missingDays: number[]; existingBilan: any } | null>(null)

  // ---- Recherche de cours (page Académie)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchWeek, setSearchWeek] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (!searchOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [searchOpen])

  // ---- Page Revue
  const [resumesReview, setResumesReview] = useState<ResumeReview[]>([])
  const [reflections, setReflections] = useState<ClosingReflection[]>([])
  const [revueFilter, setRevueFilter] = useState<'all' | 'pending' | 'graded'>('all')
  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, string>>({})
  const [reflectionSaving, setReflectionSaving] = useState<Record<string, boolean>>({})
  const [reflectionMsg, setReflectionMsg] = useState<string | null>(null)
  const [reflectionIsError, setReflectionIsError] = useState(false)

  // ---- Notes manuscrites
  const [notesFiles, setNotesFiles] = useState<File[]>([])
  const [notesComment, setNotesComment] = useState('')
  const [notesSubmitting, setNotesSubmitting] = useState(false)
  const [notesMsg, setNotesMsg] = useState<string | null>(null)
  const [notesIsError, setNotesIsError] = useState(false)

  // ---- onglet Profil
  const [formName, setFormName] = useState('')
  const [formFirst, setFormFirst] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formTribe, setFormTribe] = useState('')
  const [formDept, setFormDept] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileDone, setProfileDone] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFormFirst(profile.first_name ?? '')
      setFormName(profile.last_name ?? '')
      setFormPhone(profile.phone ?? '')
      setFormTribe(profile.tribe ?? '')
      setFormDept(profile.department ?? '')
    }
  }, [profile?.id])

  // ---- onglet Service
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>({
    group_name: '',
    service_days: '0',
    mission_description: '',
    focus: 'enseignement',
  })
  const [serviceSaving, setServiceSaving] = useState(false)
  const [serviceMsg, setServiceMsg] = useState<string | null>(null)
  const [serviceIsError, setServiceIsError] = useState(false)

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
    setSummary(resumeContent?.content ?? '')
    setSummaryFileUrl(resumeContent?.file_url ?? null)
    setSummaryFileName(resumeContent?.file_name ?? null)
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
      const prevTypes = prevBadgeTypesRef.current
      const newBadges = await ensureBadges(studentId)
      const earned = newBadges.filter(b => b.earned_at)
      const justEarned = earned.find(b => b.earned_at && !prevTypes.has(b.badge_type))
      if (justEarned) setCelebrateBadge(justEarned.badge_type)
      prevBadgeTypesRef.current = new Set(earned.map(b => b.badge_type))
      setBadges(newBadges)
      setBadgeProgress(await getBadgeProgress())
    } catch {
      // rafraîchissement silencieux
    }
  }, [])

  useEffect(() => {
    registerServiceWorker().catch(() => {})
    import('@/lib/pushNotifications').then(({ onForegroundMessage, showLocalNotification }) => {
      onForegroundMessage(({ title, body }) => {
        showLocalNotification(title, body)
      })
    })
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
        const [streakRes, submissionsRes, badgesRes, certsRes, serviceRes, progressRes, notifsRes, resumeReviewsRes, reflectionsRes] =
          await Promise.allSettled([
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
        setStreak(streakRes.status === 'fulfilled' ? streakRes.value : null)
        setSubmissions(submissionsRes.status === 'fulfilled' ? submissionsRes.value : [])
        const allBadges = badgesRes.status === 'fulfilled' ? badgesRes.value : []
        setBadges(allBadges)
        prevBadgeTypesRef.current = new Set(allBadges.filter(b => b.earned_at).map(b => b.badge_type))
        setCertificates(certsRes.status === 'fulfilled' ? certsRes.value : [])
        setService(serviceRes.status === 'fulfilled' ? serviceRes.value : null)
        setBadgeProgress(progressRes.status === 'fulfilled' ? progressRes.value : [])
        setNotifications(notifsRes.status === 'fulfilled' ? notifsRes.value : [])
        setResumesReview(resumeReviewsRes.status === 'fulfilled' ? resumeReviewsRes.value : [])
        setReflections(reflectionsRes.status === 'fulfilled' ? reflectionsRes.value : [])

        // XP / Gamification (non-blocking)
        supabase.rpc('get_student_level', { p_student_id: p.id })
          .then(({ data }) => {
            if (data && !cancelled) {
              setXpData({
                xp: data.xp,
                level: data.level,
                levelLabel: data.level_label,
                nextLevelLabel: data.next_level_label,
                xpInLevel: data.xp_in_level,
                xpForNextLevel: data.xp_for_next_level,
              })
            }
          }, () => {})

        const serviceRec = serviceRes.status === 'fulfilled' ? serviceRes.value : null
        if (serviceRec) {
          setServiceDraft({
            group_name: serviceRec.group_name ?? '',
            service_days: String(serviceRec.service_days ?? 0),
            mission_description: serviceRec.mission_description ?? '',
            focus: (serviceRec as ServiceRecord & { focus?: string | null }).focus ?? 'enseignement',
          })
        }

        if (classId) {
          const [classCourses, verse, week, allClasses] = await Promise.all([
            getClassCourses(classId),
            getDailyVerse(classId),
            getCurrentWeekForClass(classId),
            getClasses(),
          ])
          if (cancelled) return
          const studentClass = allClasses.find(c => c.id === classId)
          const isLevel3 = studentClass?.level === 3
          const searchCourses = isLevel3 ? await getCourses() : classCourses
          setAllCourses(searchCourses)
          setDailyVerse(verse)
          setCurrentWeek(week)
          const courseData = classCourses.find(c => c.week === week) ?? classCourses[classCourses.length - 1] ?? null
          if (courseData) {
            await loadCourse(courseData, p.id)
            try {
              const bilan = await getWeeklyBilan(p.id, week)
              if (bilan && !cancelled) {
                setBilanResume(bilan.resume_done)
                setBilanMeditation(bilan.meditation_status)
                setBilanMeditationDays(bilan.meditation_days)
                setBilanEvangelisation(bilan.evangelisation_status)
                setBilanContactName(bilan.contact_name ?? '')
                setBilanContactPhone(bilan.contact_phone ?? '')
                setBilanSaved(true)
              }
            } catch { /* no bilan yet */ }

            if (!cancelled) {
              try {
                const bilanPrefs = await getBilanPreferences(p.id)
                const bilanDays = (bilanPrefs?.bilan_days as number[]) ?? [2, 4, 6]
                const today = new Date().getDay()
                const currentWeekNum = week

                if (bilanDays.includes(today)) {
                  const existingBilan = await getWeeklyBilan(p.id, currentWeekNum)
                  if (!existingBilan) {
                    setBilanPopupData({
                      studentName: `${p.first_name} ${p.last_name}`,
                      weekNumber: currentWeekNum,
                      currentBilanDay: today,
                      missingDays: [today],
                      existingBilan: null,
                    })
                    if (!cancelled) setShowBilanPopup(true)
                  }
                }

                const yesterday = (today + 6) % 7
                const dayBefore = (today + 5) % 7
                for (const missedDay of [yesterday, dayBefore]) {
                  if (bilanDays.includes(missedDay)) {
                    const existingBilan = await getWeeklyBilan(p.id, currentWeekNum)
                    if (!existingBilan || existingBilan.bilan_day !== missedDay) {
                      if (!showBilanPopup) {
                        setBilanPopupData((prev) => prev ?? {
                          studentName: `${p.first_name} ${p.last_name}`,
                          weekNumber: currentWeekNum,
                          currentBilanDay: today,
                          missingDays: [missedDay],
                          existingBilan: existingBilan ?? null,
                        })
                      }
                    }
                  }
                }
              } catch { /* silent */ }
            }
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

  // Realtime: reload courses when a new course is published or updated for this class
  useEffect(() => {
    if (!profile?.class_id) return
    const classId = profile.class_id

    const channel = supabase
      .channel(`student-courses-${classId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses', filter: `class_id=eq.${classId}` },
        async () => {
          try {
            const [classCourses, week, verse] = await Promise.all([
              getClassCourses(classId),
              getCurrentWeekForClass(classId),
              getDailyVerse(classId),
            ])
            setAllCourses(classCourses)
            setCurrentWeek(week)
            setDailyVerse(verse)
            const courseData = classCourses.find(c => c.week === week) ?? classCourses[classCourses.length - 1] ?? null
            if (courseData && profile) {
              await loadCourse(courseData, profile.id)
            }
          } catch { /* silent */ }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.class_id, profile?.id, loadCourse])

  // Realtime: reload daily verse when meditation_verses change
  useEffect(() => {
    if (!profile?.class_id) return
    const classId = profile.class_id

    const channel = supabase
      .channel(`student-verses-${classId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meditation_verses', filter: `class_id=eq.${classId}` },
        async () => {
          try {
            const verse = await getDailyVerse(classId)
            setDailyVerse(verse)
          } catch { /* silent */ }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.class_id])

  const [midnightTick, setMidnightTick] = useState(0)

  // Auto-refresh daily verse at midnight Cameroon time (UTC+1)
  useEffect(() => {
    if (!profile?.class_id) return
    const classId = profile.class_id

    function msUntilMidnightDouala(): number {
      const now = new Date()
      const doualaNow = new Date(now.getTime() + (1 * 60 + now.getTimezoneOffset()) * 60_000)
      const midnight = new Date(doualaNow)
      midnight.setHours(24, 0, 0, 0)
      return midnight.getTime() - doualaNow.getTime()
    }

    const timer = setTimeout(async () => {
      try {
        const verse = await getDailyVerse(classId)
        setDailyVerse(verse)
      } catch { /* silent */ }
      // Re-schedule for next midnight
      setMidnightTick(t => t + 1)
    }, msUntilMidnightDouala() + 1000)

    return () => clearTimeout(timer)
  }, [profile?.class_id, midnightTick])

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
      await saveResume(profile.id, course.id, summary, summaryFileUrl, summaryFileName)
      setSummarySaved(true)
      setMessage('Résumé enregistré. Merci pour ta fidélité.')
      toast('Résumé enregistré.')
      playSuccess()
      awardXp(profile.id, 'resume_submitted', course.id, 'course')
      setProgress(await getStudentProgress(profile.id))
      await refreshBadgeProgress(profile.id)
      setResumesReview(await getResumesForReview(profile.id))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur à la sauvegarde du résumé.')
      toastError('Erreur.')
    } finally {
      setSummarySaving(false)
    }
  }

  async function handleSummaryFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!profile) return
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!isResumeFile(file)) {
      toastError('Fichier non autorisé pour un résumé : image, PDF ou document Word de 10 Mo maximum.')
      return
    }
    setSummaryUploading(true)
    try {
      const url = await uploadResumeFile(file, profile.id)
      if (summaryFileUrl) await deleteResumeFile(summaryFileUrl)
      setSummaryFileUrl(url)
      setSummaryFileName(file.name)
      toast('Fichier joint à ton résumé.')
      setSummarySaved(false)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erreur à l’ajout du fichier.')
    } finally {
      setSummaryUploading(false)
    }
  }

  async function handleRemoveSummaryFile() {
    if (!summaryFileUrl) return
    await deleteResumeFile(summaryFileUrl)
    setSummaryFileUrl(null)
    setSummaryFileName(null)
    setSummarySaved(false)
  }

  function resumeFileIsImage() {
    return !!summaryFileName && /\.(png|jpe?g|gif|webp|bmp)$/i.test(summaryFileName)
  }

  async function handleAttend() {
    if (!profile || !course || attended) return
    setAttending(true)
    setMessage(null)
    try {
      const result = await markCourseAttendance(profile.id, course.id)
      setAttended(true)
      if (result.newlyMarked) {
        playSuccess()
        awardXp(profile.id, 'daily_attendance', course.id, 'course')
      }
      setStreak((prev) =>
        prev
          ? { ...prev, consecutive_weeks: result.streak }
          : { id: '', student_id: profile.id, week_start: '', consecutive_weeks: result.streak }
      )
      setProgress(await getStudentProgress(profile.id))
      await refreshBadgeProgress(profile.id)
      setMessage(
        result.newlyMarked
          ?       'Présence marquée. Ta méditation continue.'
          : 'Tu avais déjà marqué ta présence pour ce cours.'
      )
      if (result.newlyMarked) toast('Présence enregistrée.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors du marquage de présence.')
      toastError('Erreur.')
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
      toast('Mini-tâche enregistrée.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur à la sauvegarde de la mini-tâche.')
      toastError('Erreur.')
    } finally {
      setMiniTaskSaving(false)
    }
  }

  async function handleSaveBilan() {
    if (!profile || currentWeek == null || bilanSaving) return
    if (bilanMeditation === 'some_days' && bilanMeditationDays < 1) {
      toastError('Indique le nombre de jours de méditation.')
      return
    }
    setBilanSaving(true)
    try {
      await saveWeeklyBilan({
        student_id: profile.id,
        week_number: currentWeek,
        resume_done: bilanResume,
        meditation_status: bilanMeditation,
        meditation_days: bilanMeditation === 'some_days' ? bilanMeditationDays : bilanMeditation === 'all_days' ? 7 : 0,
        evangelisation_status: bilanEvangelisation,
        contact_name: bilanContactName || null,
        contact_phone: bilanContactPhone || null,
      })
      setBilanSaved(true)
      toast('Bilan enregistré.')
    } catch {
      toastError('Erreur lors de la sauvegarde du bilan.')
    } finally {
      setBilanSaving(false)
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
      toast('Devoir rendu avec succès !')
      playSuccess()
      awardXp(profile.id, 'course_completed', assignmentId, 'assignment')
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
      setProfile((prev) => prev ? {
        ...prev,
        first_name: formFirst,
        last_name: formName,
        phone: formPhone,
        tribe: formTribe,
        department: formDept,
      } : prev)
      setProfileDone('Informations enregistrées.')
      toast('Profil enregistré.')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement.')
      toastError('Erreur.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleSaveService(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setServiceSaving(true)
    setServiceMsg(null)
    setServiceIsError(false)
    try {
      await upsertServiceRecord(profile.id, {
        group_name: serviceDraft.group_name,
        service_days: Number(serviceDraft.service_days) || 0,
        mission_description: serviceDraft.mission_description,
        focus: serviceDraft.focus,
      })
      setService(await getServiceRecord(profile.id))
      setServiceMsg('Fiche de service enregistrée.')
      setServiceIsError(false)
      toast('Service enregistré.')
    } catch (err) {
      setServiceMsg(err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement.')
      setServiceIsError(true)
      toastError('Erreur.')
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

  function openBadgeDrawer() {
    if (!profile) return
    void refreshBadgeProgress(profile.id)
    setBadgeDrawerOpen(true)
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
      toast('Badge actif mis à jour.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors du choix du badge actif.')
      toastError('Erreur.')
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

  function handleNotificationNavigate(type: string | null) {
    if (type === 'message') setTab('messagerie')
    else if (type === 'annonce') setTab('annonces')
    else if (type === 'correction' || type === 'devoir') setTab('devoirs')
  }

  const unreadByTab = useMemo(() => {
    const unread = notifications.filter((n) => !n.read)
    return {
      messagerie: unread.some((n) => n.type === 'message'),
      annonces: unread.some((n) => n.type === 'annonce'),
      devoirs: unread.some((n) => n.type === 'correction' || n.type === 'devoir'),
    }
  }, [notifications])

  async function handleSubmitNotes(e: FormEvent) {
    e.preventDefault()
    if (!profile || !course) return
    if (notesFiles.length === 0) {
      setNotesMsg('Ajoute au moins une photo de tes notes manuscrites.')
      setNotesIsError(true)
      return
    }
    for (const file of notesFiles) {
      if (!isNoteImageFile(file)) {
        setNotesMsg('Fichier non autorisé : image ou PDF de 10 Mo maximum.')
        setNotesIsError(true)
        return
      }
    }
    setNotesSubmitting(true)
    setNotesMsg(null)
    setNotesIsError(false)
    try {
      const urls: string[] = []
      for (const file of notesFiles) {
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
      setNotesIsError(false)
      playSuccess()
      awardXp(profile.id, 'service_participation', course.id, 'course')
    } catch (err) {
      setNotesMsg(err instanceof Error ? err.message : 'Erreur lors de l\u2019envoi des notes.')
      setNotesIsError(true)
    } finally {
      setNotesSubmitting(false)
    }
  }

  async function handleSaveReflection(c: Course) {
    if (!profile) return
    setReflectionSaving((prev) => ({ ...prev, [c.id]: true }))
    setReflectionMsg(null)
    setReflectionIsError(false)
    try {
      const content = reflectionDrafts[c.id] ?? ''
      await saveClosingReflection(profile.id, c.id, content)
      setReflections(await getClosingReflections(profile.id))
      setReflectionMsg(
        content ? 'Réflexion de clôture enregistrée.' : 'Réflexion de clôture retirée.'
      )
      setReflectionIsError(false)
      toast('Réflexion enregistrée.')
      if (content) awardXp(profile.id, 'meditation_logged', c.id, 'course')
    } catch (err) {
      setReflectionMsg(
        err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement de la réflexion.'
      )
      setReflectionIsError(true)
      toastError('Erreur.')
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
        term !== '' && (
          (c.title?.toLowerCase().includes(term) ?? false) ||
          (c.description?.toLowerCase().includes(term) ?? false)
        )
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
        <div className="space-y-4">
          <div className="skeleton h-9 w-48" />
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-44 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
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

  if (profile && !profile.class_id) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <Logo showText={false} size={48} className="mx-auto" />
            <h1 className="mt-3 font-display text-xl text-bordeaux">Bienvenue dans l'Académie</h1>
            <p className="mt-1 text-sm text-pierre">Choisis ta classe pour commencer ton parcours.</p>
          </div>
          <ClassPicker
            userId={profile.id}
            onPicked={(classId) => setProfile((prev) => prev ? { ...prev, class_id: classId } : prev)}
          />
        </div>
      </div>
    )
  }

  const studentSidebarItems: SidebarItem[] = [
    { key: 'academie', label: 'Académie', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { key: 'annonces', label: 'Annonces', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, unread: unreadByTab.annonces },
    { key: 'devoirs', label: 'Devoirs', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, unread: unreadByTab.devoirs },
    { key: 'revue', label: 'Revue', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { key: 'service', label: 'Service', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8m-4-4v4m-4-8a4 4 0 0 1-4-4V4h16v5a4 4 0 0 1-4 4h-4z"/><circle cx="12" cy="7" r="3"/></svg> },
    { key: 'parcours', label: 'Mon Parcours', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg> },
    { key: 'messagerie', label: 'Messagerie', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, unread: unreadByTab.messagerie },
    { key: 'parametres', label: 'Paramètres', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  return (
    <div className="relative min-h-screen md:pl-[68px]">
      {currentNotif && <NotificationBanner notification={currentNotif} onDismiss={dismissNotif} />}
      <FloatingMascot mood={mascotMood} />
      <NotificationPrompt />
      <Sidebar
        items={studentSidebarItems}
        activeKey={tab}
        onSelect={(k) => setTab(k as Tab)}
        header={<Logo showText={false} size={28} />}
      />
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6" {...swipeHandlers}>
      <SectionWatermark
        kind={tab === 'devoirs' || tab === 'revue' ? 'livre' : tab === 'service' ? 'mains' : 'flamme'}
      />
      <div className="relative z-10 page-enter">
      <DayAccentBand />
      <header className="sticky top-0 z-20 mb-4 border-b border-sable/40 bg-parchemin/95 pb-3 pt-3 backdrop-blur-sm md:mb-6 md:static md:border-0 md:bg-transparent md:backdrop-blur-none md:pt-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Logo showText={false} size={28} className="md:hidden" />
            <Logo showText={false} size={34} className="hidden md:block" />
            <div>
              <h1 className="font-display text-lg text-bordeaux md:text-2xl">Ton espace Académie</h1>
              {profile && (
                <p className="hidden items-center gap-2 text-sm text-pierre md:flex">
                  {profile.first_name} {profile.last_name}
                  <VerseReference />
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-pierre/20 bg-white text-pierre transition-colors hover:border-or/60 hover:text-or"
              aria-label="Rechercher un cours"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <NotificationsBell notifications={notifications} onMarkRead={handleMarkNotificationsRead} onNavigate={handleNotificationNavigate} />
            <Avatar
              url={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              size={36}
              onClick={() => setTab('parametres')}
              className="md:hidden"
            />
            <Avatar
              url={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              size={40}
              onClick={() => setTab('parametres')}
              className="hidden md:block"
            />
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
            <p className="text-xs font-semibold uppercase tracking-wide text-or mb-1">Ton prochain cours</p>
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
                  <CoursePlayer audioUrl={course.audio_url} audioParts={course.audio_parts} videoUrl={course.video_url} week={course.week} title={course.title} />
                </div>

                <label className="mb-1.5 block text-sm font-medium text-bordeaux">Ton résumé du cours</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ce que je retiens de ce cours…"
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-bordeaux underline">
                  {summaryUploading ? 'Ajout du fichier…' : 'Importer mon résumé (image, PDF ou Word)'}
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf,.doc,.docx"
                    disabled={summaryUploading}
                    onChange={handleSummaryFile}
                  />
                </label>
                {summaryFileUrl && summaryFileName && (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-pierre/15 bg-white/60 px-3 py-2 text-sm">
                    {resumeFileIsImage() ? (
                      <a href={summaryFileUrl} target="_blank" rel="noreferrer">
                        <img src={summaryFileUrl} alt="Résumé joint" className="h-16 w-20 rounded object-cover" />
                      </a>
                    ) : (
                      <a href={summaryFileUrl} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline break-all">
                        {summaryFileName}
                      </a>
                    )}
                    {!resumeFileIsImage() && (
                      <a href={summaryFileUrl} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline">Télécharger</a>
                    )}
                    <button type="button" onClick={handleRemoveSummaryFile} className="ml-auto text-xs text-red-600 underline">
                      Retirer
                    </button>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={handleSaveSummary}
                    disabled={summarySaving || summaryUploading}
                  >
                    {summarySaving ? 'Enregistrement…' : 'Enregistrer le résumé'}
                  </Button>
                  {summarySaved && <span className="text-xs text-olive">Résumé sauvegardé.</span>}
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

          <CollapsibleCard title="Méditation Biblique du Jour — Verset(s) à Méditer">
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
          </CollapsibleCard>

          {allCourses.length > 0 && profile?.id && (
            <AllQuizzesSection
              courses={allCourses}
              studentId={profile.id}
              onOpenQuiz={setActiveQuizId}
            />
          )}

          <Card>
            <CardTitle>Ton tableau de bord</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Cours déjà suivis : {followedCount}. Voici ta progression sur la session.
            </CardDescription>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <ProgressStat label="Présence" value={`${progress?.presenceRate ?? 0}%`} animated={progress?.presenceRate ?? 0} />
              <ProgressStat label="Résumés faits" value={`${progress?.resumeRate ?? 0}%`} animated={progress?.resumeRate ?? 0} />
              <ProgressStat label="Moyenne exercices & devoirs" value={progress?.averageGrade ?? '—'} />
              <ProgressStat label="Méditation de la Parole" value={progress?.meditationGrade != null ? `${progress.meditationGrade}/20` : '—'} animated={progress?.meditationGrade != null ? Math.round((progress.meditationGrade / 20) * 100) : undefined} />
            </dl>
            {followed.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-sable/60 pt-3 text-sm text-pierre">
                {followed.map((c) => (
                  <li key={c.id}>• Semaine {c.week} — {c.title}</li>
                ))}
              </ul>
            )}
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

      {tab === 'parcours' && (() => {
        const nextBadgeKey = BADGE_ORDER.find(k => !earnedBadgeKeys.has(k))
        const nextBadgeMeta = nextBadgeKey && isBadgeKey(nextBadgeKey) ? BADGES[nextBadgeKey] : null
        const nextBadgeProgress = nextBadgeKey ? badgeProgress.find(p => p.badge_type === nextBadgeKey) : null
        const recentEarnedBadges = earnedBadges.slice(-5).reverse()
        const totalBadges = BADGE_ORDER.length
        const earnedCount = earnedBadges.length

        return (
          <div className="space-y-5">
            <Card>
              <CardTitle>Statut gamification</CardTitle>
              <div className="mt-3 space-y-4">
                <div className="flex items-center gap-3">
                  <StreakFlame weeks={weeks} />
                  <div className="flex-1">
                    <AttendanceGauge weeks={weeks} presenceRate={progress?.presenceRate ?? undefined} />
                  </div>
                </div>

                {xpData && (
                  <XpBar
                    xp={xpData.xp}
                    level={xpData.level}
                    levelLabel={xpData.levelLabel}
                    nextLevelLabel={xpData.nextLevelLabel}
                    xpInLevel={xpData.xpInLevel}
                    xpForNextLevel={xpData.xpForNextLevel}
                  />
                )}

                <div className="flex items-center justify-between rounded-lg border border-or/20 bg-or/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏅</span>
                    <span className="text-sm font-semibold text-bordeaux dark:text-or">
                      {earnedCount}/{totalBadges} badges débloqués
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {recentEarnedBadges.map((key) => (
                      <div
                        key={key}
                        className="h-6 w-6 rounded-full border-2 border-or bg-parchemin"
                        title={isBadgeKey(key) ? BADGES[key].label : key}
                      >
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                          <circle cx="24" cy="24" r="22" fill="#F8F4E9" stroke="#CFAF5B" strokeWidth="2.5" />
                        </svg>
                      </div>
                    ))}
                    {earnedCount === 0 && (
                      <span className="text-[10px] text-pierre italic">Aucun badge encore</span>
                    )}
                  </div>
                </div>

                {nextBadgeKey && nextBadgeMeta && (
                  <div className="rounded-lg border border-or/20 bg-gradient-to-br from-or/5 to-or/10 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-or mb-1.5">Prochain badge à débloquer</p>
                    <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">{nextBadgeMeta.label}</p>
                    <p className="text-[11px] text-pierre dark:text-slate-400 mb-2">{nextBadgeMeta.description}</p>
                    {nextBadgeProgress && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-or transition-all duration-500"
                            style={{ width: `${Math.min((nextBadgeProgress.current / nextBadgeProgress.target) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-or">
                          {nextBadgeProgress.current}/{nextBadgeProgress.target}
                        </span>
                      </div>
                    )}
                    {!nextBadgeProgress && (
                      <p className="text-[10px] text-pierre italic">Continue comme ça !</p>
                    )}
                  </div>
                )}

                {!nextBadgeKey && earnedCount > 0 && (
                  <div className="rounded-lg border border-olive/30 bg-olive/5 px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-olive">Tous les badges débloqués ! 🎉</p>
                    <p className="text-[11px] text-pierre">Tu es un vrai Vase d'Honneur.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Mon parcours</CardTitle>
              <CardDescription className="mt-1 mb-3">
                Suis ton évolution à travers les cours de la session.
              </CardDescription>
              <CoursePath
                courses={allCourses}
                currentWeek={currentWeek}
                completedCourseIds={new Set(followed.map((c) => c.id))}
                onSelectCourse={handleSelectCourse}
                mascotMood={mascotMood}
              />
            </Card>

            <Card>
              <CardTitle>Mon parcours de badges</CardTitle>
              <CardDescription className="mt-1 mb-3">
                Chaque étape franchie dessine ta fidélité. Complète le chemin pour devenir un Vase d'Honneur.
              </CardDescription>
              <BadgePath
                earnedBadgeTypes={earnedBadges}
                badgeProgress={badgeProgress}
                onSelectBadge={handleSelectActiveBadge}
              />
              <div className="mt-4">
                <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={openBadgeDrawer}>
                  Salle des badges →
                </Button>
              </div>
            </Card>

            <Leaderboard currentUserId={profile?.id ?? ''} />
          </div>
        )
      })()}

      {tab === 'annonces' && (
        <AnnoncesEtudiantTab classId={profile?.class_id ?? null} studentFirstName={profile?.first_name ?? null} />
      )}

      {tab === 'devoirs' && (
        <div className="space-y-5">
          <DevoirsTab
            assignments={assignments}
            submissions={submissions}
            courseName={course?.title ?? 'Cours actuel'}
            onSubmit={async (assignmentId, content, file) => {
              if (!profile) return
              await submitAssignment({
                studentId: profile.id,
                assignmentId,
                content,
                ...(file ? { file } : {}),
              })
              setSubmissions(await getMySubmissions(profile.id))
            }}
          />

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
                {notesMsg && <p className={`text-sm ${notesIsError ? 'text-red-600' : 'text-olive'}`}>{notesMsg}</p>}
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
        <div className="space-y-5">
          {/* Service Stats */}
          <Card>
            <CardTitle>Mon service</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Ta place dans le corps de l'Académie.
            </CardDescription>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-or/20 bg-or/5 p-3 text-center">
                <p className="text-2xl font-bold text-or">{service?.service_days ?? 0}</p>
                <p className="text-[10px] text-pierre dark:text-slate-500">Jours de service</p>
              </div>
              <div className="rounded-lg border border-olive/20 bg-olive/5 p-3 text-center">
                <p className="text-2xl font-bold text-olive">{service?.service_note ?? '—'}</p>
                <p className="text-[10px] text-pierre dark:text-slate-500">Note</p>
              </div>
              <div className="rounded-lg border border-bordeaux/20 bg-bordeaux/5 p-3 text-center">
                <p className="text-lg font-bold text-bordeaux dark:text-or capitalize">{service?.focus ?? '—'}</p>
                <p className="text-[10px] text-pierre dark:text-slate-500">Domaine</p>
              </div>
            </div>
          </Card>

          {/* Service Form */}
          <Card>
            <CardTitle className="text-base">Modifier ma fiche</CardTitle>
            <form onSubmit={handleSaveService} className="mt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="group">Groupe</Label>
                  <Input
                    id="group"
                    value={serviceDraft.group_name}
                    onChange={(e) => setServiceDraft((prev) => ({ ...prev, group_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="days">Jours effectués</Label>
                  <Input
                    id="days"
                    type="number"
                    min={0}
                    value={serviceDraft.service_days}
                    onChange={(e) => setServiceDraft((prev) => ({ ...prev, service_days: e.target.value }))}
                  />
                </div>
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
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="mission">Missions & sorties</Label>
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
              <Button type="submit" disabled={serviceSaving}>
                {serviceSaving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              {serviceMsg && <p className={`text-sm ${serviceIsError ? 'text-red-600' : 'text-olive'}`}>{serviceMsg}</p>}
            </form>
          </Card>
        </div>
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
                      {rev?.resume.file_url && rev.resume.file_name && (
                        <div className="mt-2">
                          {/\.(png|jpe?g|gif|webp|bmp)$/i.test(rev.resume.file_name) ? (
                            <a href={rev.resume.file_url} target="_blank" rel="noreferrer">
                              <img src={rev.resume.file_url} alt="Résumé joint" className="h-16 w-20 rounded object-cover" />
                            </a>
                          ) : (
                            <a href={rev.resume.file_url} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline break-all">
                              Pièce jointe : {rev.resume.file_name}
                            </a>
                          )}
                        </div>
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

                    {(c.audio_url || (c.audio_parts && c.audio_parts.length > 0) || c.video_url) && (
                      <div className="flex flex-wrap gap-2">
                        {c.audio_url && (
                          <Button
                            variant="ghost"
                            className="!px-3 !py-1.5 text-xs underline"
                            onClick={() =>
                              downloadCourseMedia(c.audio_url as string, `cours-semaine-${c.week}.mp3`)
                            }
                          >
                            Telecharger l'audio
                          </Button>
                        )}
                        {!c.audio_url && c.audio_parts && c.audio_parts.length > 0 && (
                          <Button
                            variant="ghost"
                            className="!px-3 !py-1.5 text-xs underline"
                            onClick={() =>
                              downloadCourseMedia(c.audio_parts![0].audio as string, `${c.title || 'cours'} - ${c.audio_parts![0].nom || 'audio'}.mp3`)
                            }
                          >
                            Telecharger l'audio
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
          {reflectionMsg && <p className={`text-sm ${reflectionIsError ? 'text-red-600' : 'text-olive'}`}>{reflectionMsg}</p>}
        </div>
      )}

      {tab === 'messagerie' && (
        <div className="space-y-4">
          <MessagingPanel currentUserId={profile?.id ?? ''} userRole="ETUDIANT" />
        </div>
      )}

      {tab === 'parametres' && profile && (
        <SettingsTab
          profile={profile}
          earnedBadges={earnedBadges}
          badgeBusy={badgeBusy}
          formFirst={formFirst}
          formName={formName}
          formPhone={formPhone}
          formTribe={formTribe}
          formDept={formDept}
          setFormFirst={setFormFirst}
          setFormName={setFormName}
          setFormPhone={setFormPhone}
          setFormTribe={setFormTribe}
          setFormDept={setFormDept}
          profileSaving={profileSaving}
          profileError={profileError}
          profileDone={profileDone}
          onSaveProfile={handleSaveProfile}
          onSelectBadge={handleSelectActiveBadge}
          onSignOut={async () => { await signOut(); navigate('/') }}
          onAvatarSaved={(url) => setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev)}
        />
      )}

      {badgeDrawerOpen && (
        <BadgeDrawer
          open={badgeDrawerOpen}
          onClose={() => setBadgeDrawerOpen(false)}
          earnedBadges={earnedBadges}
          activeBadge={profile?.active_badge ?? null}
          badgeProgress={badgeProgress}
          onSelect={handleSelectActiveBadge}
          busy={badgeBusy}
        />
      )}

      {celebrateBadge && (
        <BadgeEarnModal
          badgeType={celebrateBadge}
          onClose={() => setCelebrateBadge(null)}
        />
      )}

      {activeQuizId && (
        <QuizPlayer quizId={activeQuizId} onClose={() => setActiveQuizId(null)} />
      )}

      {showBilanPopup && bilanPopupData && (
        <BilanPopup
          studentId={profile?.id ?? ''}
          studentName={bilanPopupData.studentName}
          weekNumber={bilanPopupData.weekNumber}
          currentBilanDay={bilanPopupData.currentBilanDay}
          missingDays={bilanPopupData.missingDays}
          existingBilan={bilanPopupData.existingBilan}
          onClose={() => { setShowBilanPopup(false); setBilanPopupData(null) }}
        />
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}
        >
          <div ref={searchOverlayRef} className="mx-4 w-full max-w-lg rounded-xl border border-pierre/20 bg-parchemin p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-bordeaux">Rechercher un cours</p>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-pierre transition-colors hover:bg-pierre/10"
                aria-label="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titre, description… (ex. semaine 3)"
                className="max-w-xs"
                autoFocus
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
              <div className="mt-3 max-h-64 overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-pierre">Aucun cours ne correspond à ta recherche.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {filteredCourses.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => { handleSelectCourse(c); setSearchOpen(false) }}
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
              <p className="mt-3 text-xs text-pierre">
                Astuce : tape « semaine 3 » ou un mot du titre pour retrouver un cours.
              </p>
            )}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}

function ProgressStat({ label, value, animated }: { label: string; value: string; animated?: number }) {
  return (
    <div className="glass-card !p-3 text-center">
      <dt className="text-xs text-pierre dark:text-slate-400">{label}</dt>
      <dd className="font-display text-xl text-bordeaux dark:text-or">
        {animated !== undefined ? (
          <AnimatedCounter value={animated} suffix="%" className="font-display text-xl text-bordeaux dark:text-or" />
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function AllQuizzesSection({ courses, studentId, onOpenQuiz }: { courses: Course[]; studentId: string; onOpenQuiz: (id: string) => void }) {
  const [quizMap, setQuizMap] = useState<Record<string, { id: string; title: string; attempted?: boolean }[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    import('@/lib/quizzes').then(({ getCourseQuizzes }) =>
      Promise.all(
        courses.map((c) =>
          getCourseQuizzes(c.id, studentId).then((quizzes) => ({
            courseId: c.id,
            courseTitle: c.title,
            courseWeek: c.week,
            quizzes,
          }))
        )
      ).then((results) => {
        if (cancelled) return
        const map: Record<string, { id: string; title: string; attempted?: boolean }[]> = {}
        for (const r of results) {
          if (r.quizzes.length > 0) {
            map[r.courseId] = r.quizzes
          }
        }
        setQuizMap(map)
        setLoading(false)
      })
    ).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courses, studentId])

  const courseMap = useMemo(() => {
    const m: Record<string, Course> = {}
    for (const c of courses) m[c.id] = c
    return m
  }, [courses])

  const totalQuizzes = useMemo(() => Object.values(quizMap).reduce((n, arr) => n + arr.length, 0), [quizMap])

  if (loading || totalQuizzes === 0) return null

  return (
    <div className="rounded-xl border border-or/20 bg-or/5 p-4">
      <p className="mb-3 text-sm font-semibold text-bordeaux">Mes Quiz</p>
      <div className="space-y-3">
        {Object.entries(quizMap).map(([courseId, quizzes]) => {
          const c = courseMap[courseId]
          return (
            <div key={courseId}>
              {c && (
                <p className="mb-1 text-xs font-medium text-pierre">
                  Semaine {c.week} — {c.title}
                </p>
              )}
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
        })}
      </div>
    </div>
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
