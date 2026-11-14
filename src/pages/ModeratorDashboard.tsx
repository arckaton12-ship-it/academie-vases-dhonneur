import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarLayout } from '@/components/ui/SidebarLayout'
import { Logo } from '@/components/Logo'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { DayAccentBand } from '@/components/DayAccentBand'
import { ModeratorSettingsTab } from '@/components/ModeratorSettingsTab'
import { ProgrammeTab } from '@/components/moderator/ProgrammeTab'
import { ElevesTab } from '@/components/moderator/ElevesTab'
import { RapportTab } from '@/components/moderator/RapportTab'
import { AnnoncesTab } from '@/components/moderator/AnnoncesTab'
import { BinomageTab } from '@/components/moderator/BinomageTab'
import { supabase } from '@/lib/supabase'
import { sendSaturdayReminders } from '@/lib/courses'
import {
  getClasses,
  getCourses,
  getStreaks,
  getStudents,
  getSubmissions,
  getModeratorClasses,
  getModeratorSchedules,
  getMiniTasksAll,
  getSupportsAll,
  ClassRow,
  Course,
  StudentProfile,
  Submission,
  Streak,
  ModeratorSchedule,
  MiniTask,
  ModerationSupport,
} from '@/lib/courses'
import { getCurrentProfile, signOut } from '@/lib/auth'
import { MessagingPanel } from '@/components/MessagingPanel'
import { toast, toastError } from '@/components/ui/Toast'
import { createConversation } from '@/lib/messaging'
import { Leaderboard } from '@/components/Leaderboard'

type Tab = 'programme' | 'eleves' | 'rapport' | 'annonces' | 'messagerie' | 'binomage' | 'classement' | 'parametres'

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
