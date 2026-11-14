import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { registerServiceWorker } from '@/lib/pushNotifications'
import { getCurrentProfile, signOut, updateProfileInfo } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getDailyVerse } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'
import { MascotMood } from '@/components/MascotCompanion'
import { NotificationRow } from '@/components/NotificationsBell'
import {
  getAssignments,
  getClassCourses,
  getCourses,
  getClasses,
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
import { BADGE_ORDER } from '@/lib/badges'

export type Tab = 'academie' | 'annonces' | 'devoirs' | 'service' | 'revue' | 'parametres' | 'messagerie' | 'parcours'

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

export function useStudentDashboardState() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>(() => {
    const requested = new URLSearchParams(window.location.search).get('tab')
    const allowed: Tab[] = ['academie', 'annonces', 'devoirs', 'revue', 'parcours', 'service', 'messagerie', 'parametres']
    return allowed.includes(requested as Tab) ? (requested as Tab) : 'academie'
  })

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


  return {
    navigate,
    tab,
    setTab,
    TAB_ORDER,
    swipeHandlers,
    profile,
    setProfile,
    currentNotif,
    dismissNotif,
    showRegistration,
    setShowRegistration,
    course,
    setCourse,
    currentWeek,
    setCurrentWeek,
    streak,
    setStreak,
    summary,
    setSummary,
    summaryFileUrl,
    setSummaryFileUrl,
    summaryFileName,
    setSummaryFileName,
    summarySaved,
    setSummarySaved,
    activeQuizId,
    setActiveQuizId,
    summarySaving,
    setSummarySaving,
    summaryUploading,
    setSummaryUploading,
    attended,
    setAttended,
    attending,
    setAttending,
    assignments,
    setAssignments,
    submissions,
    setSubmissions,
    progress,
    setProgress,
    followed,
    setFollowed,
    badges,
    setBadges,
    celebrateBadge,
    setCelebrateBadge,
    prevBadgeTypesRef,
    searchOverlayRef,
    certificates,
    setCertificates,
    service,
    setService,
    message,
    setMessage,
    loading,
    setLoading,
    miniTask,
    setMiniTask,
    miniTaskResponse,
    setMiniTaskResponse,
    miniTaskSaving,
    setMiniTaskSaving,
    miniTaskSaved,
    setMiniTaskSaved,
    xpData,
    setXpData,
    mascotMood,
    badgeProgress,
    setBadgeProgress,
    badgeDrawerOpen,
    setBadgeDrawerOpen,
    badgeBusy,
    setBadgeBusy,
    notifications,
    setNotifications,
    dailyVerse,
    setDailyVerse,
    bilanResume,
    setBilanResume,
    bilanMeditation,
    setBilanMeditation,
    bilanMeditationDays,
    setBilanMeditationDays,
    bilanEvangelisation,
    setBilanEvangelisation,
    bilanContactName,
    setBilanContactName,
    bilanContactPhone,
    setBilanContactPhone,
    bilanSaved,
    setBilanSaved,
    bilanSaving,
    setBilanSaving,
    showBilanPopup,
    setShowBilanPopup,
    bilanPopupData,
    setBilanPopupData,
    allCourses,
    setAllCourses,
    searchQuery,
    setSearchQuery,
    searchWeek,
    setSearchWeek,
    searchOpen,
    setSearchOpen,
    resumesReview,
    setResumesReview,
    reflections,
    setReflections,
    revueFilter,
    setRevueFilter,
    reflectionDrafts,
    setReflectionDrafts,
    reflectionSaving,
    setReflectionSaving,
    reflectionMsg,
    setReflectionMsg,
    reflectionIsError,
    setReflectionIsError,
    notesFiles,
    setNotesFiles,
    notesComment,
    setNotesComment,
    notesSubmitting,
    setNotesSubmitting,
    notesMsg,
    setNotesMsg,
    notesIsError,
    setNotesIsError,
    formName,
    setFormName,
    formFirst,
    setFormFirst,
    formPhone,
    setFormPhone,
    formTribe,
    setFormTribe,
    formDept,
    setFormDept,
    profileSaving,
    setProfileSaving,
    profileError,
    setProfileError,
    profileDone,
    setProfileDone,
    serviceDraft,
    setServiceDraft,
    serviceSaving,
    setServiceSaving,
    serviceMsg,
    setServiceMsg,
    serviceIsError,
    setServiceIsError,
    drafts,
    setDrafts,
    submitting,
    setSubmitting,
    submitMsg,
    setSubmitMsg,
    loadProfile,
    loadCourse,
    refreshBadgeProgress,
    midnightTick,
    setMidnightTick,
    submissionByAssignment,
    handleSaveSummary,
    handleSummaryFile,
    handleRemoveSummaryFile,
    resumeFileIsImage,
    handleAttend,
    handleSaveMiniTask,
    handleSaveBilan,
    handleSubmitAssignment,
    openDraft,
    handleSaveProfile,
    handleSaveService,
    handleSelectCourse,
    openBadgeDrawer,
    handleSelectActiveBadge,
    handleMarkNotificationsRead,
    handleNotificationNavigate,
    unreadByTab,
    handleSubmitNotes,
    handleSaveReflection,
    weeks,
    earnedBadgeKeys,
    earnedBadges,
    followedCount,
    resumeByCourse,
    reflectionByCourse,
    weekOptions,
    filteredCourses,
    followedChronological,
    revueItems,
    notesSubmissions,
    gradedReviews,
  }
}
