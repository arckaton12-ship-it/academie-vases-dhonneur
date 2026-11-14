import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarLayout } from '@/components/ui/SidebarLayout'
import { Logo } from '@/components/Logo'
import { SectionWatermark } from '@/components/SectionWatermark'
import { DayAccentBand } from '@/components/DayAccentBand'
import { ModeratorSettingsTab } from '@/components/ModeratorSettingsTab'
import { MessagingPanel } from '@/components/MessagingPanel'
import { ProgrammeTab } from '@/components/admin-classe/ProgrammeTab'
import { PresenceTab } from '@/components/admin-classe/PresenceTab'
import { NotesTab } from '@/components/admin-classe/NotesTab'
import { ElevesTab } from '@/components/admin-classe/ElevesTab'
import { AnnoncesTab } from '@/components/admin-classe/AnnoncesTab'
import { supabase } from '@/lib/supabase'
import {
  getClasses,
  getCourses,
  getStudents,
  getSubmissions,
  getStreaks,
  ClassRow,
  Course,
  StudentProfile,
  Submission,
  Streak,
} from '@/lib/courses'
import { getCurrentProfile, signOut } from '@/lib/auth'
import { toast, toastError } from '@/components/ui/Toast'
import { createConversation } from '@/lib/messaging'
import { Leaderboard } from '@/components/Leaderboard'

type Tab = 'programme' | 'presence' | 'notes' | 'eleves' | 'annonces' | 'messagerie' | 'classement' | 'parametres'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const tabIcons: Record<Tab, React.ReactNode> = {
  programme: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  presence: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  notes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  eleves: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  annonces: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  messagerie: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  classement: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  parametres: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

export default function AdminClasseDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('programme')

  const [classes, setClasses] = useState<ClassRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])

  const [ownClassIds, setOwnClassIds] = useState<string[]>([])

  const [moderatorProfile, setModeratorProfile] = useState<{
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  } | null>(null)

  const [pageError, setPageError] = useState<string | null>(null)

  const [formFirst, setFormFirst] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileDone, setProfileDone] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    const [classesRes, coursesRes, studentsRes, submissionsRes, streaksRes] =
      await Promise.allSettled([
        getClasses(),
        getCourses(),
        getStudents(),
        getSubmissions(),
        getStreaks(),
      ])
    if (classesRes.status === 'fulfilled') setClasses(classesRes.value)
    if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value)
    if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value)
    if (submissionsRes.status === 'fulfilled') setSubmissions(submissionsRes.value)
    if (streaksRes.status === 'fulfilled') setStreaks(streaksRes.value)
  }, [])

  const loadScope = useCallback(async (profileId: string) => {
    const { data: adminClasses } = await supabase
      .from('admin_class_classes')
      .select('class_id')
      .eq('admin_id', profileId)
    const classIds = (adminClasses ?? []).map((r: any) => r.class_id)
    setOwnClassIds(classIds)
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

  const adminTabs: [Tab, string][] = [
    ['programme', 'Programme'],
    ['presence', 'Présence'],
    ['notes', 'Notes'],
    ['eleves', 'Élèves'],
    ['annonces', 'Annonces'],
    ['messagerie', 'Messagerie'],
    ['classement', 'Classement'],
    ['parametres', 'Paramètres'],
  ]

  const myStudents = students.filter((s) => ownClassIds.includes(s.class_id ?? ''))
  const myCourses = courses.filter((c) => ownClassIds.includes(c.class_id ?? ''))

  return (
    <SidebarLayout
      items={adminTabs.map(([k, label]) => ({ key: k, label, icon: tabIcons[k] }))}
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
              <h1 className="font-display text-2xl text-bordeaux">Admin de Classe</h1>
              {moderatorProfile && (
                <p className="text-sm text-pierre">
                  {moderatorProfile.first_name} {moderatorProfile.last_name}
                  {ownClassIds.length > 0 && (
                    <span className="ml-2 text-xs text-or-texte dark:text-or">
                      — {ownClassIds.map((id) => classById.get(id)?.name).filter(Boolean).join(', ')}
                    </span>
                  )}
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

        {ownClassIds.length === 0 && (
          <div className="mb-4 rounded-md border border-or/40 bg-or/10 px-3 py-2 text-sm text-or-texte dark:text-or">
            Aucune classe ne t'est encore assignée. L'administrateur principal doit t'attribuer une classe.
          </div>
        )}

        {tab === 'programme' && (
          <ProgrammeTab courses={myCourses} classes={classes} ownClassIds={ownClassIds} />
        )}
        {tab === 'presence' && (
          <PresenceTab
            students={myStudents}
            courses={myCourses}
            classById={classById}
          />
        )}
        {tab === 'notes' && (
          <NotesTab
            students={myStudents}
            courses={myCourses}
            submissions={submissions}
            streaks={streaks}
            classById={classById}
            onRefresh={loadAll}
          />
        )}
        {tab === 'eleves' && (
          <ElevesTab
            students={myStudents}
            classById={classById}
          />
        )}
        {tab === 'annonces' && (
          <AnnoncesTab classes={classes} ownClassIds={ownClassIds} />
        )}
        {tab === 'messagerie' && (
          <div className="space-y-4">
            <MessagingPanel currentUserId={moderatorProfile?.id ?? ''} userRole="ADMIN_CLASSE" />
          </div>
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
