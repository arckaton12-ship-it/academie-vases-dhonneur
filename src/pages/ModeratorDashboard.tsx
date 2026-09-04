import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { CoursePlayer } from '@/components/CoursePlayer'
import { SidebarLayout } from '@/components/ui/SidebarLayout'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { BulletinPDF } from '@/components/BulletinPDF'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { DayAccentBand } from '@/components/DayAccentBand'
import { SoulTrackingTab } from '@/components/SoulTrackingTab'
import { ModeratorSettingsTab } from '@/components/ModeratorSettingsTab'
import { QuizTab } from '@/components/QuizTab'
import { playSuccess, playClick } from '@/lib/sound'
import { supabase } from '@/lib/supabase'
import { sendPushToRole } from '@/lib/pushSend'
import { sendSaturdayReminders } from '@/lib/courses'
import {
  advanceStudent,
  getClasses,
  getCourses,
  getStreaks,
  getStudents,
  getSubmissions,
  getModerators,
  getModeratorClasses,
  getModeratorSchedules,
  getMiniTasksAll,
  getMiniTaskResponses,
  getSupportsAll,
  createModerationReport,
  getModerationReports,
  deleteModerationReport,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  ClassRow,
  Course,
  StudentProfile,
  Submission,
  Streak,
  ModeratorProfile,
  ModeratorSchedule,
  MiniTask,
  MiniTaskResponseWithStudent,
  ModerationSupport,
  ModerationReport,
  Announcement,
  adminCreateUser,
  getModNotes,
  saveModNotes,
  saveCourseMiseEnPratique,
} from '@/lib/courses'
import { getCurrentProfile, signOut } from '@/lib/auth'
import { exportToCSV, exportToPDF, ExportRow } from '@/lib/export'
import { MessagingPanel } from '@/components/MessagingPanel'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { toast, toastError } from '@/components/ui/Toast'
import { createConversation } from '@/lib/messaging'
import { Leaderboard } from '@/components/Leaderboard'

type Tab = 'programme' | 'eleves' | 'rapport' | 'annonces' | 'messagerie' | 'binomage' | 'classement' | 'parametres'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

let modSaturdayRemindersSent = false

const tabIcons: Record<Tab, React.ReactNode> = {
  programme: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  eleves: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  rapport: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  annonces: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  messagerie: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  binomage: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  classement: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  parametres: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

export default function ModeratorDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('programme')

  const [classes, setClasses] = useState<ClassRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])

  const [ownClassIds, setOwnClassIds] = useState<string[]>([])
  const [ownSchedules, setOwnSchedules] = useState<ModeratorSchedule[]>([])
  const [miniTasks, setMiniTasks] = useState<MiniTask[]>([])
  const [supports, setSupports] = useState<ModerationSupport[]>([])

  const [moderatorProfile, setModeratorProfile] = useState<{
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  } | null>(null)

  const [pageError, setPageError] = useState<string | null>(null)

  // Settings form state
  const [formFirst, setFormFirst] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileDone, setProfileDone] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    const [classesRes, coursesRes, studentsRes, submissionsRes, streaksRes, miniTasksRes, supportsRes] =
      await Promise.allSettled([
        getClasses(),
        getCourses(),
        getStudents(),
        getSubmissions(),
        getStreaks(),
        getMiniTasksAll(),
        getSupportsAll(),
      ])
    if (classesRes.status === 'fulfilled') setClasses(classesRes.value)
    if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value)
    if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value)
    if (submissionsRes.status === 'fulfilled') setSubmissions(submissionsRes.value)
    if (streaksRes.status === 'fulfilled') setStreaks(streaksRes.value)
    if (miniTasksRes.status === 'fulfilled') setMiniTasks(miniTasksRes.value)
    if (supportsRes.status === 'fulfilled') setSupports(supportsRes.value)
  }, [])

  const loadScope = useCallback(async (profileId: string) => {
    const [cls, sched] = await Promise.all([
      getModeratorClasses(profileId),
      getModeratorSchedules(profileId),
    ])
    let classIds = cls.map((c) => c.id)
    if (classIds.length === 0) {
      const { data: adminClasses } = await supabase
        .from('admin_class_classes')
        .select('class_id')
        .eq('admin_id', profileId)
      classIds = (adminClasses ?? []).map((r: any) => r.class_id)
    }
    setOwnClassIds(classIds)
    setOwnSchedules(sched)
  }, [])

  useEffect(() => {
    getCurrentProfile()
      .then((profile) => {
        if (profile) {
          setModeratorProfile({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
          })
          setFormFirst(profile.first_name ?? '')
          setFormName(profile.last_name ?? '')
          setFormEmail(profile.email ?? '')
          loadScope(profile.id).catch((err) =>
            setPageError(err instanceof Error ? err.message : 'Erreur de chargement de votre périmètre.')
          )
        }
      })
      .catch(() => undefined)
    loadAll().catch((err) =>
      setPageError(err instanceof Error ? err.message : 'Erreur de chargement des données.')
    )
    if (!modSaturdayRemindersSent) {
      modSaturdayRemindersSent = true
      sendSaturdayReminders().catch(() => {})
    }
  }, [loadAll, loadScope])

  const classById = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes]
  )

  const handleMessageUser = async (userId: string) => {
    try {
      await createConversation(userId, 'DIRECT')
      setTab('messagerie')
      toast('Conversation ouverte.')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!moderatorProfile) return
    setProfileSaving(true)
    setProfileError(null)
    setProfileDone(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: formFirst, last_name: formName })
        .eq('id', moderatorProfile.id)
      if (error) throw error
      setModeratorProfile((prev) => prev ? { ...prev, first_name: formFirst, last_name: formName } : prev)
      setProfileDone('Profil enregistré.')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setProfileSaving(false)
    }
  }

  const modTabs: [Tab, string][] = [
    ['programme', 'Programme'],
    ['eleves', 'Élèves'],
    ['rapport', 'Rapport'],
    ['binomage', 'Binômage'],
    ['annonces', 'Annonces'],
    ['messagerie', 'Messagerie'],
    ['classement', 'Classement'],
    ['parametres', 'Paramètres'],
  ]

  return (
    <SidebarLayout
      items={modTabs.map(([k, label]) => ({ key: k, label, icon: tabIcons[k] }))}
      activeKey={tab}
      onSelect={(k) => setTab(k as Tab)}
    >
      <SectionWatermark kind="croix" />
      <div className="relative z-10 page-enter">
      <DayAccentBand />
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo showText={false} size={34} />
          <div>
            <h1 className="font-display text-2xl text-bordeaux">Espace modérateur</h1>
            {moderatorProfile && (
              <p className="flex items-center gap-2 text-sm text-pierre">
                {moderatorProfile.first_name} {moderatorProfile.last_name}
                <VerseReference />
              </p>
            )}
          </div>
        </div>
      </header>

      {pageError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {tab === 'programme' && (
        <ProgrammeTab
          courses={courses}
          classes={classes}
          ownClassIds={ownClassIds}
          schedules={ownSchedules}
          miniTasks={miniTasks}
          supports={supports}
        />
      )}
      {tab === 'eleves' && (
        <ElevesTab
          students={students}
          ownClassIds={ownClassIds}
          classById={classById}
          classes={classes}
          onMessageUser={handleMessageUser}
          onCreated={() => loadAll()}
        />
      )}
      {tab === 'rapport' && (
        <RapportTab
          students={ownClassIds.length > 0 ? students.filter(s => ownClassIds.includes(s.class_id ?? '')) : students}
          submissions={submissions}
          streaks={streaks}
          classById={classById}
          courses={courses}
          moderatorId={moderatorProfile?.id ?? ''}
          onReportsChanged={() => loadAll()}
        />
      )}
      {tab === 'annonces' && (
        <AnnoncesTab classes={classes} ownClassIds={ownClassIds} />
      )}
      {tab === 'messagerie' && (
        <div className="space-y-4">
          <MessagingPanel currentUserId={moderatorProfile?.id ?? ''} userRole="MODERATEUR" />
        </div>
      )}
      {tab === 'binomage' && (
        <BinomageTab students={ownClassIds.length > 0 ? students.filter(s => ownClassIds.includes(s.class_id ?? '')) : students} classes={classes} classById={classById} onAdvanced={() => loadAll()} />
      )}
      {tab === 'classement' && (
        <div className="space-y-4">
          <h2 className="font-display text-xl text-bordeaux">Classement</h2>
          <Leaderboard currentUserId={moderatorProfile?.id ?? ''} />
        </div>
      )}
      {tab === 'parametres' && (
        <ModeratorSettingsTab
          profile={moderatorProfile ?? { id: '', first_name: '', last_name: '', avatar_url: null }}
          formFirst={formFirst}
          formName={formName}
          formEmail={formEmail}
          setFormFirst={setFormFirst}
          setFormName={setFormName}
          setFormEmail={setFormEmail}
          profileSaving={profileSaving}
          profileError={profileError}
          profileDone={profileDone}
          onSaveProfile={handleSaveProfile}
          onSignOut={async () => { await signOut(); navigate('/') }}
        />
      )}

      </div>
    </SidebarLayout>
  )
}

function ProgrammeTab({
  courses,
  classes,
  ownClassIds,
  schedules,
  miniTasks,
  supports,
}: {
  courses: Course[]
  classes: ClassRow[]
  ownClassIds: string[]
  schedules: ModeratorSchedule[]
  miniTasks: MiniTask[]
  supports: ModerationSupport[]
}) {
  const ownClasses = ownClassIds.length > 0
    ? classes.filter((c) => ownClassIds.includes(c.id))
    : []

  const miniTaskByCourse = useMemo(() => new Map(miniTasks.map((t) => [t.course_id, t])), [miniTasks])
  const supportByCourse = useMemo(() => new Map(supports.map((s) => [s.course_id, s])), [supports])

  const [prepCourseId, setPrepCourseId] = useState('')
  const [prepQuery, setPrepQuery] = useState('')
  const [modNotes, setModNotes] = useState('')
  const [prepFullscreen, setPrepFullscreen] = useState(false)

  const allClassCourses = useMemo(() =>
    courses
      .filter((c) => c.class_id && ownClassIds.includes(c.class_id))
      .sort((a, b) => (a.week - b.week) || (a.session_date ?? '').localeCompare(b.session_date ?? '')),
    [courses, ownClassIds]
  )
  const filteredPrepCourses = useMemo(() =>
    prepQuery
      ? allClassCourses.filter(c =>
          c.title.toLowerCase().includes(prepQuery.toLowerCase()) ||
          `semaine ${c.week}`.toLowerCase().includes(prepQuery.toLowerCase()))
      : allClassCourses,
    [allClassCourses, prepQuery]
  )
  const prepCourse = allClassCourses.find(c => c.id === prepCourseId) || null

  useEffect(() => {
    if (prepCourseId) {
      getModNotes(prepCourseId).then(r => setModNotes(r.notes)).catch(() => setModNotes(''))
    }
  }, [prepCourseId])

  const savePrepNotes = useCallback(() => {
    if (prepCourseId) saveModNotes(prepCourseId, modNotes).catch(() => {})
  }, [prepCourseId, modNotes])

  return (
    <div className="space-y-5">
      {/* Prochaines sessions à modérer */}
      {allClassCourses.length > 0 && (() => {
        const now = new Date()
        const upcoming = allClassCourses
          .filter(c => c.session_date && new Date(c.session_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
          .slice(0, 4)
        if (upcoming.length === 0) return null
        return (
          <Card className="border-or/30 bg-or/5">
            <CardTitle>Prochaines sessions</CardTitle>
            <CardDescription className="mt-1 mb-3">Dates de tes prochaines modérations.</CardDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {upcoming.map(c => {
                const d = new Date(c.session_date + 'T00:00:00')
                const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                const isSunday = d.getDay() === 0
                return (
                  <div key={c.id} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${isSunday ? 'border-or/50 bg-or/10' : 'border-pierre/15'}`}>
                    <span className="font-mono text-xs text-or font-semibold">S{c.week}</span>
                    <span className="flex-1 truncate text-bordeaux font-medium">{c.title}</span>
                    <span className="text-xs text-pierre capitalize">{label}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })()}

      <Card>
        <CardTitle>Mon planning de modération</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Tes créneaux définis par l'administration pour assurer la modération.
        </CardDescription>
        {schedules.length === 0 ? (
          <p className="text-sm text-pierre">
            Aucun créneau défini pour le moment. L'administration va te l'attribuer.
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {schedules.map((s) => (
              <li
                key={s.id}
                className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 ${
                  s.specific_date ? 'border-or/60 bg-or/10' : s.day_of_week === 0 ? 'border-or/60 bg-or/10' : 'border-pierre/15'
                }`}
              >
                <span className="font-medium text-bordeaux">
                  {s.specific_date
                    ? new Date(s.specific_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                    : DAY_NAMES[s.day_of_week] ?? s.day_of_week
                  }
                </span>
                {!s.specific_date && s.day_of_week === 0 && (
                  <span className="rounded-full bg-or/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-bordeaux">
                    Jour du Seigneur
                  </span>
                )}
                <span className="font-mono text-xs text-pierre">
                  {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                </span>
                {s.notes && <span className="text-pierre">— {s.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {ownClasses.length > 0 && (
        <Card>
          <CardTitle>Préparer ma Modération</CardTitle>
          <CardDescription className="mt-1 mb-3">
            Recherche et sélectionne un cours. Regarde la vidéo et prends tes notes de préparation.
          </CardDescription>
          <Input placeholder="Rechercher un cours..." value={prepQuery} onChange={(e) => { setPrepQuery(e.target.value); setPrepCourseId(''); setModNotes('') }} className="mb-3" />
          <div className="flex flex-wrap gap-2 mb-4">
            {filteredPrepCourses.map(c => (
              <button key={c.id} onClick={() => setPrepCourseId(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${prepCourseId === c.id ? 'bg-bordeaux text-parchemin' : 'border border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'}`}>
                S{c.week} — {c.title}
              </button>
            ))}
          </div>
          {prepCourse ? (
            <div className="space-y-4">
              <div className="rounded-md border border-pierre/15 p-3">
                <p className="text-sm font-medium text-bordeaux">Semaine {prepCourse.week} — {prepCourse.title}</p>
                {prepCourse.session_date && <p className="mt-0.5 text-xs text-pierre">Session : {formatShortDate(prepCourse.session_date)}</p>}
                {prepCourse.video_url || prepCourse.audio_url ? (
                  <div className="mt-2">
                    <CoursePlayer
                      audioUrl={prepCourse.audio_url}
                      audioParts={prepCourse.audio_parts}
                      videoUrl={prepCourse.video_url}
                      week={prepCourse.week}
                      title={prepCourse.title}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-or italic">Aucun média disponible pour ce cours.</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Mes Notes pour la Modération</Label>
                  <button type="button" onClick={() => setPrepFullscreen(true)} className="text-xs text-or underline hover:text-bordeaux">Plein écran</button>
                </div>
                <textarea value={modNotes} onChange={(e) => setModNotes(e.target.value)} onBlur={savePrepNotes}
                  placeholder="Prends tes notes de préparation ici..." rows={6}
                  className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux placeholder:text-pierre/40 focus-visible:border-or" />
                <p className="mt-1 text-[11px] text-pierre/50">Notes sauvegardées dans Supabase.</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-pierre italic">{filteredPrepCourses.length === 0 ? 'Aucun cours trouvé.' : 'Sélectionne un cours ci-dessus pour commencer ta préparation.'}</p>
          )}
        </Card>
      )}

      {prepFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:bg-parchemin">
          <div className="flex shrink-0 items-center justify-between border-b border-pierre/15 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-sm font-display font-semibold text-bordeaux sm:text-base">Notes de modération</p>
              {prepCourse && <p className="truncate text-[11px] text-pierre sm:text-xs">S{prepCourse.week} — {prepCourse.title}</p>}
            </div>
            <button onClick={() => { savePrepNotes(); setPrepFullscreen(false) }} className="shrink-0 rounded-md bg-bordeaux px-3 py-1.5 text-xs font-medium text-parchemin hover:bg-[#4a2233] sm:px-4 sm:text-sm">
              Fermer
            </button>
          </div>
          <textarea
            value={modNotes}
            onChange={(e) => setModNotes(e.target.value)}
            placeholder="Prends tes notes de préparation ici..."
            autoFocus
            className="flex-1 resize-none border-none bg-transparent p-4 text-sm leading-relaxed text-bordeaux placeholder:text-pierre/40 focus:outline-none sm:p-6 sm:text-base"
          />
          <div className="shrink-0 border-t border-pierre/10 px-4 py-2 text-center text-[10px] text-pierre/40 sm:text-xs">
            Notes sauvegardées localement • Ferme pour enregistrer
          </div>
        </div>
      )}

      {ownClasses.length === 0 ? (
        <Card>
          <CardTitle>Mes classes</CardTitle>
          <CardDescription className="mt-1">
            Aucune classe ne t'est encore rattachée. L'administration doit t'attribuer
            tes classes pour que tu puisses suivre tes étudiants.
          </CardDescription>
        </Card>
      ) : (
        ownClasses.map((klass) => {
          const classCourses = courses
            .filter((c) => c.class_id === klass.id)
            .sort((a, b) => (a.week - b.week) || (a.session_date ?? '').localeCompare(b.session_date ?? ''))
          return (
            <Card key={klass.id}>
              <CardTitle>{klass.name}</CardTitle>
              <CardDescription className="mt-1 mb-3">
                {classCourses.length} cours publié{classCourses.length > 1 ? 's' : ''} sur la session
              </CardDescription>

              {classCourses.length === 0 ? (
                <p className="text-sm text-pierre">Aucun cours publié pour cette classe.</p>
              ) : (
                <ul className="space-y-2">
                  {classCourses.map((course) => {
                    const hasAudio = Boolean(course.audio_url)
                    const hasVideo = Boolean(course.video_url)
                    const complete = hasAudio && hasVideo
                    const task = miniTaskByCourse.get(course.id)
                    const support = supportByCourse.get(course.id)
                    return (
                      <li
                        key={course.id}
                        className="rounded-md border border-pierre/15 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-bordeaux">
                              Semaine {course.week} — {course.title}
                            </p>
                            {course.session_date && (
                              <p className="mt-0.5 text-xs text-pierre">
                                Session : {formatShortDate(course.session_date)}
                              </p>
                            )}
                            {course.description && (
                              <p className="mt-0.5 truncate text-xs text-pierre">{course.description}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${
                                hasAudio ? 'bg-olive/15 text-olive' : 'bg-pierre/10 text-pierre'
                              }`}
                            >
                              audio {hasAudio ? '✓' : '—'}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${
                                hasVideo ? 'bg-olive/15 text-olive' : 'bg-pierre/10 text-pierre'
                              }`}
                            >
                              vidéo {hasVideo ? '✓' : '—'}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${
                                complete ? 'bg-olive/15 text-olive' : 'bg-or/15 text-or'
                              }`}
                            >
                              {complete ? 'complet' : 'incomplet'}
                            </span>
                          </div>
                        </div>

                        {(task || support) && (
                          <div className="mt-2 space-y-1.5 border-t border-sable/60 pt-2 text-xs text-pierre">
                            {task && (
                              <p>
                                <span className="font-medium text-bordeaux">Mini-tâche : </span>
                                {task.instruction}
                              </p>
                            )}
                            {support && (
                              <p>
                                <span className="font-medium text-bordeaux">Support : </span>
                                {support.content && <span>{support.content} </span>}
                                {support.file_url && (
                                  <a
                                    href={support.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-bordeaux underline"
                                  >
                                    voir le document
                                  </a>
                                )}
                              </p>
                            )}
                          </div>
                        )}

                        <CourseMiseEnPratiqueEditor course={course} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )
        })
      )}

      {allClassCourses.length > 0 && (
        <QuizTab courses={allClassCourses.map((c) => ({ id: c.id, title: c.title, class_id: c.class_id }))} />
      )}
    </div>
  )
}

function CourseMiseEnPratiqueEditor({ course }: { course: Course }) {
  const [value, setValue] = useState(course.mise_en_pratique ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setValue(course.mise_en_pratique ?? '') }, [course.id, course.mise_en_pratique])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveCourseMiseEnPratique(course.id, value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* */ } finally { setSaving(false) }
  }

  return (
    <div className="mt-2 border-t border-sable/60 pt-2">
      <div className="flex items-center justify-between">
        <Label className="!text-xs font-medium text-bordeaux">Mise en pratique du cours</Label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-[11px] text-or underline hover:text-bordeaux"
        >
          {saving ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </div>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Exercice / application concrète à mettre sur la page du cours…"
        className="mt-1 w-full rounded-md border border-pierre/30 bg-parchemin px-3 py-2 text-xs text-bordeaux placeholder:text-pierre/40 focus-visible:border-or"
      />
    </div>
  )
}

function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateLong(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function AnnoncesTab({
  classes,
  ownClassIds,
}: {
  classes: ClassRow[]
  ownClassIds: string[]
}) {
  const [annonces, setAnnonces] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const manageableClasses = ownClassIds.length > 0
    ? classes.filter((c) => ownClassIds.includes(c.id))
    : []

  useEffect(() => {
    if (!classId && manageableClasses.length > 0) setClassId(manageableClasses[0].id)
  }, [manageableClasses, classId])

  async function loadAnnonces() {
    if (!classId) return
    setLoading(true)
    try {
      const data = await getAnnouncements(classId)
      setAnnonces(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnonces()
  }, [classId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!classId || !title.trim() || !content.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      await createAnnouncement(classId, title.trim(), content.trim())
      setTitle('')
      setContent('')
      setMessage('Annonce publiée.')
      toast('Annonce publiée.')
      sendPushToRole('student', 'Nouvelle annonce', title.trim(), 'announcement').catch(() => {})
      playSuccess()
      await loadAnnonces()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de la publication.')
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement(id)
      setMessage('Annonce supprimée.')
      toast('Annonce supprimée.')
      setDeleteConfirmId(null)
      await loadAnnonces()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur de suppression.')
      toastError('Erreur.')
    }
  }

  async function handleEditSave(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return
    try {
      await updateAnnouncement(id, editTitle.trim(), editContent.trim())
      toast('Annonce modifiée.')
      setEditingId(null)
      await loadAnnonces()
    } catch {
      toastError('Erreur lors de la modification.')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Publier une annonce</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Envoie un message visible par les étudiants de ta classe (événement, rappel, info importante).
        </CardDescription>
        <div className="mb-3">
          <Label htmlFor="annonce-class">Classe</Label>
          <select
            id="annonce-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
          >
            {manageableClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <Label htmlFor="annonce-title">Titre</Label>
            <Input
              id="annonce-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Réunion spéciale dimanche"
            />
          </div>
          <div>
            <Label htmlFor="annonce-content">Contenu</Label>
            <textarea
              id="annonce-content"
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Décris l'annonce…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>
          <p className="mt-1 mb-3 text-xs text-pierre/70 italic">
            Les étudiants verront "Bonjour [prénom]," en début de message (personnalisé automatiquement).
          </p>
          <Button type="submit" disabled={saving}>
            {saving ? 'Publication…' : 'Publier l\u2019annonce'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Annonces publiées</CardTitle>
        {loading ? (
          <p className="text-sm text-pierre">Chargement…</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce pour cette classe.</p>
        ) : (
          <ul className="space-y-3">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-card border border-pierre/15 p-3">
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre..." />
                    <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditSave(a.id)}>Enregistrer</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-bordeaux">{a.title}</p>
                      <p className="mt-1 text-sm text-pierre whitespace-pre-wrap">{a.content}</p>
                      <p className="mt-2 text-[11px] text-pierre">
                        {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setEditingId(a.id); setEditTitle(a.title); setEditContent(a.content); }} className="text-xs text-olive underline">Modifier</button>
                      {deleteConfirmId === a.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(a.id)} className="text-xs text-red-700 underline">Oui</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-pierre underline">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(a.id)} className="text-xs text-red-700 underline">Supprimer</button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {message && <p className="text-sm text-olive">{message}</p>}
    </div>
  )
}

function RapportTab({
  students,
  submissions,
  streaks,
  classById,
  courses,
  moderatorId,
  onReportsChanged,
}: {
  students: StudentProfile[]
  submissions: Submission[]
  streaks: Streak[]
  classById: Map<string, ClassRow>
  courses: Course[]
  moderatorId: string
  onReportsChanged: () => void
}) {
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [reportCourseId, setReportCourseId] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [reportContent, setReportContent] = useState('')
  const [reportMsg, setReportMsg] = useState<string | null>(null)
  const [reportSaving, setReportSaving] = useState(false)

  useEffect(() => {
    if (!moderatorId) return
    getModerationReports(moderatorId)
      .then(setReports)
      .catch(() => setReports([]))
  }, [moderatorId])

  async function handleCreateReport(e: FormEvent) {
    e.preventDefault()
    if (!reportContent.trim()) {
      setReportMsg('Écris au moins une observation.')
      return
    }
    setReportSaving(true)
    setReportMsg(null)
    try {
      await createModerationReport({
        courseId: reportCourseId || undefined,
        sessionDate: reportDate || undefined,
        content: reportContent,
      })
      setReportContent('')
      setReportDate('')
      setReportCourseId('')
      const updated = await getModerationReports(moderatorId)
      setReports(updated)
      setReportMsg('Rapport enregistré. Il apparaît dans ton historique.')
      onReportsChanged()
    } catch (err) {
      setReportMsg(err instanceof Error ? err.message : 'Erreur à la sauvegarde du rapport.')
    } finally {
      setReportSaving(false)
    }
  }

  async function handleDeleteReport(reportId: string) {
    if (!window.confirm('Supprimer ce rapport ?')) return
    try {
      await deleteModerationReport(reportId)
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch {
      setReportMsg('Erreur de suppression.')
    }
  }

  function toReportRows(): ExportRow[] {
    return reports.map((r) => [
      r.course ? `Semaine ${r.course.week} — ${r.course.title}` : 'Session générale',
      r.session_date ?? '—',
      formatDateLong(r.created_at ?? ''),
      r.content,
    ])
  }

  const reportHeaders = ['Cours', 'Date session', 'Rédigé le', 'Rapport']

  const rows = useMemo(() => {
    const byStudent = new Map<string, Submission[]>()
    for (const s of submissions) {
      const list = byStudent.get(s.student_id) ?? []
      list.push(s)
      byStudent.set(s.student_id, list)
    }
    const streakByStudent = new Map<string, number>()
    for (const s of streaks) {
      const current = streakByStudent.get(s.student_id) ?? 0
      if (s.consecutive_weeks > current) streakByStudent.set(s.student_id, s.consecutive_weeks)
    }

    return students.map((student) => {
      const subs = byStudent.get(student.id) ?? []
      const grades = subs
        .map((s) => s.grade)
        .filter((g): g is number => g !== null && g !== undefined)
      const avg = grades.length
        ? (grades.reduce((acc, g) => acc + Number(g), 0) / grades.length).toFixed(2)
        : '—'
      const className = student.class_id ? classById.get(student.class_id)?.name ?? '—' : '—'
      return {
        student,
        className,
        submissionCount: subs.length,
        avg,
        streak: streakByStudent.get(student.id) ?? 0,
      }
    })
  }, [students, submissions, streaks, classById])

  function toExportRows(): ExportRow[] {
    return rows.map((r) => [
      `${r.student.last_name} ${r.student.first_name}`,
      r.student.email,
      r.className,
      r.submissionCount,
      r.avg,
      r.streak,
    ])
  }

  const headers = ['Étudiant', 'Email', 'Classe', 'Soumissions', 'Moyenne', 'Méditation (sem.)']

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Rédiger un rapport de session</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Consigne tes observations et ton déroulé après chaque session de modération. Ils
          s'ajoutent à ton historique.
        </CardDescription>
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="report-course">Cours concerné (optionnel)</Label>
              <select
                id="report-course"
                value={reportCourseId}
                onChange={(e) => setReportCourseId(e.target.value)}
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
              >
                <option value="">Session générale</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Semaine {c.week} — {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="report-date">Date de la session</Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="report-content">Rapport & observations</Label>
            <textarea
              id="report-content"
              rows={4}
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder="Déroulé de la session, participation, difficultés rencontrées, observations…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>
          {reportMsg && <p className="text-sm text-olive">{reportMsg}</p>}
          <Button type="submit" disabled={reportSaving}>
            {reportSaving ? 'Enregistrement…' : 'Enregistrer le rapport'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Historique de mes rapports</CardTitle>
          {reports.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportToCSV('rapports-moderation.csv', reportHeaders, toReportRows())}
            >
              Exporter l'historique (CSV)
            </Button>
          )}
        </div>
        <CardDescription className="mt-1 mb-4">
          {reports.length} rapport{reports.length > 1 ? 's' : ''} rédigé{reports.length > 1 ? 's' : ''}.
        </CardDescription>
        {reports.length === 0 ? (
          <p className="text-sm text-pierre">Aucun rapport pour le moment. Rédige ton premier rapport de session.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-md border border-pierre/15 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-bordeaux">
                    {r.course ? `Semaine ${r.course.week} — ${r.course.title}` : 'Session générale'}
                    {r.session_date && (
                      <span className="ml-2 font-mono text-xs text-pierre">
                        {formatShortDate(r.session_date)}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => handleDeleteReport(r.id)}
                    className="text-xs text-red-700 underline"
                  >
                    Supprimer
                  </button>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-pierre">{r.content}</p>
                <p className="mt-1.5 text-xs text-pierre/70">
                  Rédigé le {formatDateLong(r.created_at ?? '')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Rapport de suivi</CardTitle>
        <CardDescription className="mt-1 mb-4">
          {students.length} étudiant{students.length > 1 ? 's' : ''} inscrit{students.length > 1 ? 's' : ''}
        </CardDescription>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCSV('rapport-etudiants.csv', headers, toExportRows())}
          >
            Exporter CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportToPDF(
                'rapport-etudiants.pdf',
                'Rapport de suivi — Académie Vases d\'Honneur',
                'Suivi des étudiants par classe, soumissions et assiduité',
                headers,
                toExportRows()
              )
            }
          >
            Exporter PDF
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-or bg-white/60 text-left">
                <th className="px-3 py-2 font-medium text-bordeaux">Étudiant</th>
                <th className="px-3 py-2 font-medium text-bordeaux">Classe</th>
                <th className="px-3 py-2 font-medium text-bordeaux">Soumissions</th>
                <th className="px-3 py-2 font-medium text-bordeaux">Moyenne</th>
                <th className="px-3 py-2 font-medium text-bordeaux">Méditation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student.id} className="border-b border-pierre/15">
                  <td className="px-3 py-2 text-bordeaux">
                    {r.student.last_name} {r.student.first_name}
                  </td>
                  <td className="px-3 py-2 text-pierre">{r.className}</td>
                  <td className="px-3 py-2 font-mono text-pierre">{r.submissionCount}</td>
                  <td className="px-3 py-2 font-mono text-pierre">{r.avg}</td>
                  <td className="px-3 py-2 font-mono text-pierre">{r.streak}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-pierre">
                    Aucun étudiant inscrit pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function BinomageTab({
  students,
  classes,
  classById,
  onAdvanced,
}: {
  students: StudentProfile[]
  classes: ClassRow[]
  classById: Map<string, ClassRow>
  onAdvanced: () => void
}) {
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setTargets((prev) => {
      const next: Record<string, string> = { ...prev }
      for (const s of students) {
        if (!next[s.id]) {
          const currentLevel = s.class_id ? classById.get(s.class_id)?.level ?? 1 : 1
          const nextClass = classes.find((c) => c.level === currentLevel + 1)
          next[s.id] = nextClass?.id ?? s.class_id ?? ''
        }
      }
      return next
    })
  }, [students, classes, classById])

  async function handleAdvance(student: StudentProfile) {
    const target = targets[student.id]
    if (!target || target === student.class_id) {
      setError('Sélectionne une classe différente de la classe actuelle.')
      return
    }
    setBusyId(student.id)
    setError(null)
    setSuccess(null)
    try {
      await advanceStudent(student.id, target)
      setSuccess(`${student.first_name} ${student.last_name} a changé de classe.`)
      toast(`${student.first_name} ${student.last_name} a changé de classe.`)
      playSuccess()
      onAdvanced()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du passage de classe.')
      toastError('Erreur.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardTitle>Passage de classe</CardTitle>
      <CardDescription className="mt-1 mb-4">
        Fais passer un étudiant vers la classe supérieure. La classe cible est pré-remplie avec la suivante.
      </CardDescription>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-3 text-sm text-olive">{success}</p>}

      {students.length === 0 ? (
        <p className="text-sm text-pierre">Aucun étudiant inscrit pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {students.map((student) => {
            const currentName = student.class_id
              ? classById.get(student.class_id)?.name ?? '—'
              : 'Aucune classe'
            return (
              <li
                key={student.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-pierre/15 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-bordeaux">
                    {student.last_name} {student.first_name}
                  </p>
                  <p className="text-xs text-pierre">Classe actuelle : {currentName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={targets[student.id] ?? student.class_id ?? ''}
                    onChange={(e) =>
                      setTargets((prev) => ({ ...prev, [student.id]: e.target.value }))
                    }
                    className="rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    disabled={busyId === student.id}
                    onClick={() => handleAdvance(student)}
                    className="!px-3 !py-1.5 text-xs"
                  >
                    {busyId === student.id ? '…' : 'Appliquer'}
                  </Button>
                  <BulletinPDF studentId={student.id} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-pierre/15 pt-4">
        <h4 className="font-display text-base text-bordeaux">Binômage</h4>
        <p className="mt-1 text-xs text-pierre">Associe deux étudiants pour qu'ils suivent le parcours ensemble.</p>
        <div className="mt-3 space-y-2">
          {students.map(s => {
            const binome = s.binome_id ? students.find(b => b.id === s.binome_id) : null
            return (
              <div key={s.id} className="flex items-center gap-2 rounded-md border border-pierre/10 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm text-bordeaux">{s.first_name} {s.last_name}</span>
                <span className="text-xs text-pierre">→</span>
                <select
                  value={s.binome_id ?? ''}
                  onChange={async (e) => {
                    const newBinomeId = e.target.value || null
                    if (s.binome_id && s.binome_id !== newBinomeId) {
                      await supabase.from('profiles').update({ binome_id: null }).eq('id', s.binome_id)
                    }
                    if (newBinomeId) {
                      const newPartner = students.find(b => b.id === newBinomeId)
                      if (newPartner?.binome_id && newPartner.binome_id !== s.id) {
                        await supabase.from('profiles').update({ binome_id: null }).eq('id', newBinomeId)
                      }
                    }
                    await supabase.from('profiles').update({ binome_id: newBinomeId }).eq('id', s.id)
                    if (newBinomeId) {
                      await supabase.from('profiles').update({ binome_id: s.id }).eq('id', newBinomeId)
                    }
                    onAdvanced()
                  }}
                  className="rounded-md border border-pierre/30 bg-white px-2 py-1 text-xs text-bordeaux"
                >
                  <option value="">Aucun binôme</option>
                  {students.filter(b => b.id !== s.id && b.class_id === s.class_id).map(b => (
                    <option key={b.id} value={b.id}>{b.first_name} {b.last_name}</option>
                  ))}
                </select>
                {binome && <span className="text-[10px] text-olive">✓ {binome.first_name}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function ElevesTab({
  students,
  ownClassIds,
  classById,
  classes,
  onMessageUser,
  onCreated,
}: {
  students: StudentProfile[]
  ownClassIds: string[]
  classById: Map<string, ClassRow>
  classes: ClassRow[]
  onMessageUser: (userId: string) => void
  onCreated: () => void
}) {
  const [subTab, setSubTab] = useState<'fiche' | 'suivi' | 'inscription'>('fiche')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const myStudents = students.filter((s) => ownClassIds.includes(s.class_id ?? ''))

  const subTabs: [string, string][] = [
    ['fiche', 'Fiche étudiant'],
    ['suivi', "Suivi d'âme"],
    ['inscription', 'Inscription'],
  ]

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key as typeof subTab)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              subTab === key
                ? 'bg-bordeaux text-parchemin'
                : 'bg-pierre/10 text-pierre hover:bg-pierre/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'fiche' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>Fiche étudiant</CardTitle>
            <CardDescription className="mt-1">
              Consulte le profil complet d'un étudiant de tes classes.
            </CardDescription>
            <ul className="mt-3 max-h-64 overflow-y-auto space-y-1">
              {myStudents.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => { setSelectedId(s.id); playClick() }}
                    className={`flex w-full items-center gap-3 px-3 py-2 rounded-card text-left text-sm transition-colors ${
                      selectedId === s.id ? 'bg-bordeaux/10' : 'hover:bg-sable/30'
                    }`}
                  >
                    <Avatar url={(s as any).avatar_url} firstName={s.first_name} lastName={s.last_name} size={28} />
                    <div>
                      <p className="font-medium text-bordeaux">{s.last_name} {s.first_name}</p>
                      <p className="text-[11px] text-pierre">{classById.get(s.class_id ?? '')?.name ?? '—'}</p>
                    </div>
                  </button>
                </li>
              ))}
              {myStudents.length === 0 && (
                <p className="text-xs text-pierre">Aucun étudiant dans tes classes.</p>
              )}
            </ul>
          </Card>
          {selectedId && <StudentProfileCard studentId={selectedId} onClose={() => setSelectedId(null)} />}
        </div>
      )}

      {subTab === 'suivi' && (
        <Card>
          <CardTitle>Suivi d'âme</CardTitle>
          <CardDescription className="mt-2 mb-4">Sélectionne un étudiant pour consulter/modifier sa fiche de suivi pastoral.</CardDescription>
          <div className="flex flex-wrap gap-2">
            {myStudents.map(s => (
              <button key={s.id} onClick={() => setSelectedId(s.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedId === s.id ? 'bg-or text-white' : 'bg-pierre/10 text-pierre hover:bg-or/20'}`}>
                {s.first_name} {s.last_name}
              </button>
            ))}
            {myStudents.length === 0 && (
              <p className="text-xs text-pierre">Aucun étudiant dans tes classes.</p>
            )}
          </div>
          {selectedId && (() => {
            const selected = myStudents.find(s => s.id === selectedId)
            if (!selected) return null
            return (
              <div className="mt-6">
                <SoulTrackingTab studentId={selected.id} studentName={`${selected.first_name} ${selected.last_name}`} />
              </div>
            )
          })()}
        </Card>
      )}

      {subTab === 'inscription' && (
        <InscriptionTab
          ownClassIds={ownClassIds}
          classes={classes}
          onCreated={onCreated}
        />
      )}
    </div>
  )
}

function ModeratorsTab({ classById, onMessageUser }: { classById: Map<string, ClassRow>; onMessageUser: (userId: string) => void }) {
  const [moderators, setModerators] = useState<ModeratorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    getModerators()
      .then(setModerators)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardDescription>Chargement des modérateurs…</CardDescription>
      </Card>
    )
  }

  const selected = moderators.find((m) => m.id === selectedId) ?? null

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Modérateurs de l'Académie</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Clique sur un nom pour voir sa fiche et lui écrire.
        </CardDescription>
        {moderators.length === 0 ? (
          <p className="text-sm text-pierre">Aucun modérateur enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {moderators.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full rounded-card border px-4 py-3 text-left transition-colors ${
                    selectedId === m.id
                      ? 'border-bordeaux bg-bordeaux/5'
                      : 'border-pierre/15 hover:border-bordeaux/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-bordeaux">
                        {m.last_name} {m.first_name}
                      </p>
                      <p className="text-xs text-pierre">{m.email}</p>
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); onMessageUser(m.id) }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-or/40 text-or transition-colors hover:bg-or/10"
                      title={`Envoyer un message à ${m.first_name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Fiche du modérateur</CardTitle>
            <Button
              variant="outline"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => onMessageUser(selected.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Envoyer un message
            </Button>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Nom" value={`${selected.last_name} ${selected.first_name}`} />
            <Row label="Email" value={selected.email} />
            <Row label="Téléphone" value={selected.phone ?? '—'} />
            <Row label="Tribu" value={selected.tribe ?? '—'} />
            <Row label="Département" value={selected.department ?? '—'} />
            <Row label="Classe rattachée" value={selected.class_id ? classById.get(selected.class_id)?.name ?? '—' : 'Non définie'} />
          </dl>
        </Card>
      )}
      {message && <p className="text-sm text-olive">{message}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-sable/60 pb-2">
      <dt className="text-pierre">{label}</dt>
      <dd className="text-right text-bordeaux">{value}</dd>
    </div>
  )
}

function InscriptionTab({
  ownClassIds,
  classes,
  onCreated,
}: {
  ownClassIds: string[]
  classes: ClassRow[]
  onCreated: () => void
}) {
  const myClasses = classes.filter((c) => ownClassIds.includes(c.id))
  const [classId, setClassId] = useState(myClasses[0]?.id ?? '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [tribe, setTribe] = useState('')
  const [password, setPassword] = useState('Etudiant123!')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!classId || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Remplis au moins le prénom, le nom, l\'email et la classe.'); return
    }
    setLoading(true); setError(null); setMessage(null)
    try {
      await adminCreateUser({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'ETUDIANT',
        phone: phone.trim() || undefined,
        tribe: tribe.trim() || undefined,
      })
      // Assign class
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single()
      if (profile) {
        await supabase.from('profiles').update({ class_id: classId }).eq('id', profile.id)
      }
      setMessage(`${firstName} ${lastName} inscrit(e) dans la classe ${myClasses.find((c) => c.id === classId)?.name ?? ''}.`)
      toast(`${firstName} ${lastName} inscrit(e) dans la classe ${myClasses.find((c) => c.id === classId)?.name ?? ''}.`)
      playSuccess()
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setTribe('')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription.')
      toastError('Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardTitle>Inscrire un étudiant</CardTitle>
      <CardDescription className="mt-1 mb-4">
        Crée un compte étudiant et l'attribue à l'une de tes classes.
      </CardDescription>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div>
          <Label>Classe *</Label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 w-full rounded-card border border-pierre/20 bg-white px-3 py-2 text-sm"
          >
            {myClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (Niveau {c.level})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Prénom *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" className="mt-1" />
          </div>
          <div>
            <Label>Nom *</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Kamga" className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@email.com" className="mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237…" className="mt-1" />
          </div>
          <div>
            <Label>Tribu</Label>
            <select value={tribe} onChange={(e) => setTribe(e.target.value)} className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or">
              <option value="">—</option>
              {['Ruben', 'Siméon', 'Lévi', 'Juda', 'Zabulon', 'Issacar', 'Dan', 'Gad', 'Aser', 'Nephtali', 'Joseph', 'Benjamin', 'Aucune'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label>Mot de passe</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
          <p className="text-[10px] text-pierre mt-1">Par défaut : Etudiant123!</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-olive">{message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Inscription…' : 'Inscrire l\'étudiant'}
        </Button>
      </form>
    </Card>
  )
}


