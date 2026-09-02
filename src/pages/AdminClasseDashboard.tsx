import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { SidebarLayout } from '@/components/ui/SidebarLayout'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { SectionWatermark } from '@/components/SectionWatermark'
import { DayAccentBand } from '@/components/DayAccentBand'
import { ModeratorSettingsTab } from '@/components/ModeratorSettingsTab'
import { MessagingPanel } from '@/components/MessagingPanel'
import { playSuccess, playClick } from '@/lib/sound'
import { supabase } from '@/lib/supabase'
import { sendPushToRole } from '@/lib/pushSend'
import {
  getClasses,
  getCourses,
  getStudents,
  getSubmissions,
  getStreaks,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  getSubmissionsForGrading,
  gradeSubmission,
  getResumesForGrading,
  gradeResume,
  setMeditationGrade,
  ClassRow,
  Course,
  StudentProfile,
  Submission,
  Streak,
  Announcement,
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
                    <span className="ml-2 text-xs text-or">
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
          <div className="mb-4 rounded-md border border-or/40 bg-or/10 px-3 py-2 text-sm text-or">
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

// =====================================================
// Programme — lecture seule
// =====================================================
function ProgrammeTab({
  courses,
  classes,
  ownClassIds,
}: {
  courses: Course[]
  classes: ClassRow[]
  ownClassIds: string[]
}) {
  const ownClasses = ownClassIds.length > 0
    ? classes.filter((c) => ownClassIds.includes(c.id))
    : []

  return (
    <div className="space-y-5">
      {ownClasses.length === 0 ? (
        <Card>
          <CardTitle>Ma classe</CardTitle>
          <CardDescription className="mt-1">
            Aucune classe ne t'est encore rattachée.
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
                  {classCourses.map((course) => (
                    <li key={course.id} className="rounded-md border border-pierre/15 px-3 py-2.5">
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
                          <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${Boolean(course.audio_url) ? 'bg-olive/15 text-olive' : 'bg-pierre/10 text-pierre'}`}>
                            audio {Boolean(course.audio_url) ? '✓' : '—'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${Boolean(course.video_url) ? 'bg-olive/15 text-olive' : 'bg-pierre/10 text-pierre'}`}>
                            vidéo {Boolean(course.video_url) ? '✓' : '—'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

// =====================================================
// Présence — marquer la présence de chaque étudiant
// =====================================================
function PresenceTab({
  students,
  courses,
  classById,
}: {
  students: StudentProfile[]
  courses: Course[]
  classById: Map<string, ClassRow>
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [attendances, setAttendances] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const sortedCourses = useMemo(() =>
    [...courses].sort((a, b) => b.week - a.week),
    [courses]
  )

  useEffect(() => {
    if (sortedCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(sortedCourses[0].id)
    }
  }, [sortedCourses, selectedCourseId])

  useEffect(() => {
    if (!selectedCourseId) return
    async function load() {
      try {
        const { data, error } = await supabase
          .from('attendances')
          .select('student_id')
          .eq('course_id', selectedCourseId)
        if (error) throw error
        const attended = new Map<string, boolean>()
        for (const s of students) {
          attended.set(s.id, false)
        }
        for (const a of (data ?? [])) {
          attended.set(a.student_id, true)
        }
        setAttendances(Object.fromEntries(attended))
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Erreur de chargement des présences.')
      }
    }
    load()
  }, [selectedCourseId, students])

  const selectedCourse = sortedCourses.find((c) => c.id === selectedCourseId)

  const handleToggle = (studentId: string) => {
    setAttendances((prev) => ({ ...prev, [studentId]: !prev[studentId] }))
  }

  const handleSave = async () => {
    if (!selectedCourseId) return
    setSaving(true)
    setMessage(null)
    try {
      const attended = students.filter((s) => attendances[s.id])
      const notAttended = students.filter((s) => !attendances[s.id])

      // Mark attendance for present students
      for (const s of attended) {
        const { data: existing } = await supabase
          .from('attendances')
          .select('id')
          .eq('student_id', s.id)
          .eq('course_id', selectedCourseId)
          .maybeSingle()
        if (!existing) {
          await supabase.from('attendances').insert({ student_id: s.id, course_id: selectedCourseId })
        }
      }

      // Remove attendance for absent students
      for (const s of notAttended) {
        await supabase
          .from('attendances')
          .delete()
          .eq('student_id', s.id)
          .eq('course_id', selectedCourseId)
      }

      toast('Présences enregistrées.')
      setMessage('Présences enregistrées avec succès.')
      playSuccess()
    } catch (err) {
      toastError('Erreur lors de la sauvegarde.')
      setMessage(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendances).filter(Boolean).length

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Marquer la présence</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Sélectionne un cours et coche les étudiants présents.
        </CardDescription>

        <div className="mb-4">
          <Label>Cours</Label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="mt-1 w-full max-w-md rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
          >
            {sortedCourses.map((c) => (
              <option key={c.id} value={c.id}>
                Semaine {c.week} — {c.title}
              </option>
            ))}
          </select>
          {selectedCourse && selectedCourse.session_date && (
            <p className="mt-1 text-xs text-pierre">Date : {formatShortDate(selectedCourse.session_date)}</p>
          )}
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-pierre">Aucun étudiant dans ta classe.</p>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3 text-sm text-pierre">
              <span>{presentCount}/{students.length} présent{presentCount > 1 ? 's' : ''}</span>
            </div>
            <ul className="space-y-1.5">
              {students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-md border border-pierre/15 px-3 py-2">
                  <button
                    onClick={() => handleToggle(s.id)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      attendances[s.id]
                        ? 'border-olive bg-olive text-white'
                        : 'border-pierre/30 bg-white text-transparent hover:border-or'
                    }`}
                  >
                    {attendances[s.id] ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-bordeaux">{s.last_name} {s.first_name}</p>
                  </div>
                </li>
              ))}
            </ul>
            {message && <p className="mt-3 text-sm text-olive">{message}</p>}
            <Button onClick={handleSave} disabled={saving || !selectedCourseId} className="mt-4">
              {saving ? 'Enregistrement…' : 'Enregistrer les présences'}
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}

// =====================================================
// Notes — devoirs, résumés, méditation, service
// =====================================================
function NotesTab({
  students,
  courses,
  submissions,
  streaks,
  classById,
  onRefresh,
}: {
  students: StudentProfile[]
  courses: Course[]
  submissions: Submission[]
  streaks: Streak[]
  classById: Map<string, ClassRow>
  onRefresh: () => void
}) {
  const [subTab, setSubTab] = useState<'devoirs' | 'resumes' | 'meditation' | 'service'>('devoirs')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const subTabs: [string, string][] = [
    ['devoirs', 'Devoirs'],
    ['resumes', 'Résumés'],
    ['meditation', 'Méditation'],
    ['service', 'Service'],
  ]

  const mySubTabs = subTabs.filter(([key]) =>
    ['devoirs', 'resumes', 'meditation', 'service'].includes(key)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {mySubTabs.map(([key, label]) => (
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

      {subTab === 'devoirs' && (
        <DevoirsGradingTab students={students} submissions={submissions} classById={classById} onRefresh={onRefresh} />
      )}
      {subTab === 'resumes' && (
        <ResumesGradingTab students={students} courses={courses} classById={classById} onRefresh={onRefresh} />
      )}
      {subTab === 'meditation' && (
        <MeditationTab students={students} streaks={streaks} classById={classById} onRefresh={onRefresh} />
      )}
      {subTab === 'service' && (
        <ServiceTab students={students} classById={classById} />
      )}
    </div>
  )
}

// =====================================================
// Devoirs — notation
// =====================================================
function DevoirsGradingTab({
  students,
  submissions,
  classById,
  onRefresh,
}: {
  students: StudentProfile[]
  submissions: Submission[]
  classById: Map<string, ClassRow>
  onRefresh: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const mySubmissions = useMemo(() => {
    const studentIds = new Set(students.map((s) => s.id))
    return submissions.filter((s) => studentIds.has(s.student_id))
  }, [students, submissions])

  const selected = mySubmissions.find((s) => s.id === selectedId)

  const handleGrade = async () => {
    if (!selectedId || grade === '') return
    const num = Number(grade)
    if (num < 0 || num > 20) {
      toastError('La note doit être entre 0 et 20.')
      return
    }
    setSaving(true)
    try {
      await gradeSubmission(selectedId, num, feedback)
      toast('Note enregistrée.')
      setSelectedId(null)
      setGrade('')
      setFeedback('')
      onRefresh()
    } catch (err) {
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Notes des devoirs</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {mySubmissions.length} devoir{mySubmissions.length > 1 ? 's' : ''} soumis par tes étudiants
        </CardDescription>

        {mySubmissions.length === 0 ? (
          <p className="text-sm text-pierre">Aucun devoir soumis pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-or bg-white/60 text-left">
                  <th className="px-3 py-2 font-medium text-bordeaux">Étudiant</th>
                  <th className="px-3 py-2 font-medium text-bordeaux">Cours</th>
                  <th className="px-3 py-2 font-medium text-bordeaux">Soumis le</th>
                  <th className="px-3 py-2 font-medium text-bordeaux">Note</th>
                  <th className="px-3 py-2 font-medium text-bordeaux">Action</th>
                </tr>
              </thead>
              <tbody>
                {mySubmissions.map((s) => {
                  const student = students.find((st) => st.id === s.student_id)
                  return (
                    <tr key={s.id} className="border-b border-pierre/15">
                      <td className="px-3 py-2 text-bordeaux">
                        {student ? `${student.last_name} ${student.first_name}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-pierre">
                        {s.assignment?.description ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-pierre text-xs">
                        {s.submitted_at ? formatShortDate(s.submitted_at) : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-bordeaux">
                        {s.grade ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => { setSelectedId(s.id); setGrade(s.grade?.toString() ?? ''); setFeedback(s.feedback ?? '') }}>
                          Noter
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <Card>
          <CardTitle>Noter ce devoir</CardTitle>
          <CardDescription className="mt-1 mb-3">
            {students.find((s) => s.id === selected.student_id)?.first_name} — {selected.assignment?.description}
          </CardDescription>
          <div className="space-y-3 max-w-md">
            <div>
              <Label>Note (sur 20)</Label>
              <Input type="number" min="0" max="20" step="0.5" value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Appréciation</Label>
              <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" placeholder="Appréciation du travail…" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGrade} disabled={saving || grade === ''}>
                {saving ? 'Enregistrement…' : 'Enregistrer la note'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedId(null)}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// =====================================================
// Résumés — notation
// =====================================================
function ResumesGradingTab({
  students,
  courses,
  classById,
  onRefresh,
}: {
  students: StudentProfile[]
  courses: Course[]
  classById: Map<string, ClassRow>
  onRefresh: () => void
}) {
  const [resumes, setResumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const studentIds = useMemo(() => new Set(students.map((s) => s.id)), [students])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*, student:profiles(first_name, last_name, class_id), course:courses(title, week)')
          .order('updated_at', { ascending: false })
        if (error) throw error
        const myResumes = (data ?? []).filter((r: any) => studentIds.has(r.student_id))
        setResumes(myResumes)
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Erreur de chargement des résumés.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentIds])

  const selected = resumes.find((r: any) => r.id === selectedId)

  const handleGrade = async () => {
    if (!selectedId || grade === '') return
    const num = Number(grade)
    if (num < 0 || num > 20) {
      toastError('La note doit être entre 0 et 20.')
      return
    }
    setSaving(true)
    try {
      await gradeResume(selectedId, num, feedback)
      toast('Note du résumé enregistrée.')
      setSelectedId(null)
      setGrade('')
      setFeedback('')
      onRefresh()
    } catch {
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Card><CardDescription>Chargement…</CardDescription></Card>

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Notes des résumés</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {resumes.length} résumé{resumes.length > 1 ? 's' : ''} soumis{resumes.length > 1 ? 's' : ''}
        </CardDescription>
        {resumes.length === 0 ? (
          <p className="text-sm text-pierre">Aucun résumé soumis.</p>
        ) : (
          <ul className="space-y-2">
            {resumes.map((r: any) => {
              const st = r.student
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-pierre/15 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-bordeaux">
                      {st?.last_name} {st?.first_name} — Semaine {r.course?.week ?? '?'}
                    </p>
                    <p className="text-xs text-pierre truncate max-w-md">
                      {r.content?.slice(0, 120)}{r.content?.length > 120 ? '…' : ''}
                    </p>
                    {r.file_url && r.file_name && (
                      <a href={r.file_url} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-xs text-bordeaux underline">
                        Pièce jointe : {r.file_name}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-bordeaux">{r.grade ?? '—'}</span>
                    <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => { setSelectedId(r.id); setGrade(r.grade?.toString() ?? ''); setFeedback(r.feedback ?? '') }}>
                      Noter
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {selected && (
        <Card>
          <CardTitle>Noter ce résumé</CardTitle>
          <CardDescription className="mt-1 mb-3">
            {selected.student?.first_name} — Semaine {selected.course?.week}
          </CardDescription>
          <div className="space-y-3 max-w-md">
            {selected.file_url && selected.file_name && (
              <div>
                <Label>Fichier joint</Label>
                <div className="mt-1">
                  {/\.(png|jpe?g|gif|webp|bmp)$/i.test(selected.file_name) ? (
                    <a href={selected.file_url} target="_blank" rel="noreferrer">
                      <img src={selected.file_url} alt="Résumé joint" className="h-24 w-32 rounded object-cover" />
                    </a>
                  ) : (
                    <a href={selected.file_url} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline break-all">
                      {selected.file_name}
                    </a>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label>Note (sur 20)</Label>
              <Input type="number" min="0" max="20" step="0.5" value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Appréciation</Label>
              <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" placeholder="Appréciation du résumé…" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGrade} disabled={saving || grade === ''}>
                {saving ? 'Enregistrement…' : 'Enregistrer la note'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedId(null)}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// =====================================================
// Méditation — streaks + grading
// =====================================================
function MeditationTab({
  students,
  streaks,
  classById,
  onRefresh,
}: {
  students: StudentProfile[]
  streaks: Streak[]
  classById: Map<string, ClassRow>
  onRefresh: () => void
}) {
  const streakByStudent = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of streaks) {
      const current = map.get(s.student_id) ?? 0
      if (s.consecutive_weeks > current) map.set(s.student_id, s.consecutive_weeks)
    }
    return map
  }, [streaks])

  const [grades, setGrades] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({ ...prev, [studentId]: value }))
  }

  const saveGrade = async (studentId: string) => {
    const val = grades[studentId]
    const num = val === '' || val == null ? null : Number(val)
    if (num !== null && (num < 0 || num > 20)) {
      toastError('La note doit etre entre 0 et 20.')
      return
    }
    setSavingId(studentId)
    try {
      await setMeditationGrade(studentId, num)
      playSuccess()
      toast('Note de meditation enregistree.')
      onRefresh()
    } catch {
      toastError('Erreur lors de la sauvegarde.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardTitle>Suivi de méditation</CardTitle>
      <CardDescription className="mt-1 mb-3">
        Semaines consecutives de méditation et note sur 20 pour chaque étudiant.
      </CardDescription>
      {students.length === 0 ? (
        <p className="text-sm text-pierre">Aucun étudiant dans ta classe.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-or bg-white/60 text-left">
                <th className="px-3 py-2 font-medium text-bordeaux">Étudiant</th>
                <th className="px-3 py-2 font-medium text-bordeaux">Méditation (sem.)</th>
                <th className="px-3 py-2 font-medium text-bordeaux">Note /20</th>
                <th className="px-3 py-2 font-medium text-bordeaux">Statut</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const streak = streakByStudent.get(s.id) ?? 0
                const gradeValue = grades[s.id] ?? (s.meditation_grade != null ? String(s.meditation_grade) : '')
                return (
                  <tr key={s.id} className="border-b border-pierre/15">
                    <td className="px-3 py-2 text-bordeaux">{s.last_name} {s.first_name}</td>
                    <td className="px-3 py-2 font-mono text-pierre">{streak}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          value={gradeValue}
                          onChange={(e) => handleGradeChange(s.id, e.target.value)}
                          onBlur={() => { if (grades[s.id] !== undefined) saveGrade(s.id) }}
                          className="w-16 rounded-md border border-pierre/30 bg-white px-2 py-1 text-center text-xs text-bordeaux focus:border-or focus:outline-none"
                          placeholder="—"
                        />
                        {savingId === s.id && <span className="text-[10px] text-or">...</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {streak >= 4 ? (
                        <span className="rounded-full bg-olive/15 px-2 py-0.5 text-xs text-olive">Excellent</span>
                      ) : streak >= 2 ? (
                        <span className="rounded-full bg-or/15 px-2 py-0.5 text-xs text-or">En progres</span>
                      ) : (
                        <span className="rounded-full bg-pierre/10 px-2 py-0.5 text-xs text-pierre">A encourager</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// =====================================================
// Service — placeholder
// =====================================================
function ServiceTab({
  students,
  classById,
}: {
  students: StudentProfile[]
  classById: Map<string, ClassRow>
}) {
  const [serviceGrades, setServiceGrades] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const ids = students.map((s) => s.id)
        if (ids.length === 0) return
        const { data, error } = await supabase
          .from('service_records')
          .select('student_id, service_note')
          .in('student_id', ids)
        if (error) throw error
        if (data) {
          const map: Record<string, string> = {}
          for (const r of data) {
            map[r.student_id] = r.service_note?.toString() ?? ''
          }
          setServiceGrades(map)
        }
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Erreur de chargement des notes de service.')
      }
    }
    load()
  }, [students])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      for (const s of students) {
        const serviceNote = serviceGrades[s.id] ? Number(serviceGrades[s.id]) : null
        const { data: existing } = await supabase
          .from('service_records')
          .select('id')
          .eq('student_id', s.id)
          .maybeSingle()
        if (existing) {
          await supabase.from('service_records').update({ service_note: serviceNote }).eq('id', existing.id)
        } else if (serviceNote !== null) {
          await supabase.from('service_records').insert({ student_id: s.id, service_note: serviceNote })
        }
      }
      toast('Notes de service enregistrées.')
      setMessage('Notes de service enregistrées avec succès.')
      playSuccess()
    } catch {
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardTitle>Notes de service</CardTitle>
      <CardDescription className="mt-1 mb-3">
        Évalue le service de chaque étudiant (sur 20).
      </CardDescription>
      {students.length === 0 ? (
        <p className="text-sm text-pierre">Aucun étudiant dans ta classe.</p>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-md border border-pierre/15 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-bordeaux">{s.last_name} {s.first_name}</p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={serviceGrades[s.id] ?? ''}
                  onChange={(e) => setServiceGrades((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  placeholder="—"
                  className="text-center"
                />
              </div>
            </div>
          ))}
          {message && <p className="text-sm text-olive">{message}</p>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les notes de service'}
          </Button>
        </div>
      )}
    </Card>
  )
}

// =====================================================
// Élèves
// =====================================================
function ElevesTab({
  students,
  classById,
}: {
  students: StudentProfile[]
  classById: Map<string, ClassRow>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        `${s.last_name} ${s.first_name}`.toLowerCase().includes(q)
    )
  }, [students, search])

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Élèves</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {students.length} élève{students.length > 1 ? 's' : ''} dans tes classes
        </CardDescription>

        <div className="mb-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un élève…"
            className="max-w-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-pierre">
            {students.length === 0
              ? 'Aucun élève dans tes classes.'
              : 'Aucun résultat pour cette recherche.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-or bg-white/60 text-left">
                  <th className="px-3 py-2 font-medium text-bordeaux">Nom</th>
                  <th className="px-3 py-2 font-medium text-bordeaux">Classe</th>
                  <th className="px-3 py-2 font-medium text-bordeaux">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-pierre/15">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => { setSelectedId(s.id); playClick() }}
                        className={`flex items-center gap-2.5 rounded-card px-1 py-0.5 text-left transition-colors ${
                          selectedId === s.id ? 'bg-bordeaux/10' : 'hover:bg-sable/30'
                        }`}
                      >
                        <Avatar
                          url={(s as any).avatar_url}
                          firstName={s.first_name}
                          lastName={s.last_name}
                          size={28}
                        />
                        <span className="font-medium text-bordeaux">
                          {s.last_name} {s.first_name}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-pierre">
                      {classById.get(s.class_id ?? '')?.name ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {s.active ? (
                        <span className="rounded-full bg-olive/15 px-2 py-0.5 text-xs text-olive">Actif</span>
                      ) : (
                        <span className="rounded-full bg-pierre/10 px-2 py-0.5 text-xs text-pierre">Inactif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedId && (
        <StudentProfileCard
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

// =====================================================
// Annonces
// =====================================================
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
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erreur de chargement des annonces.')
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
    } catch {
      setMessage('Erreur de suppression.')
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
          Envoie une announcement aux étudiants de ta classe.
        </CardDescription>
        <form onSubmit={handleCreate} className="space-y-3 max-w-md">
          <div>
            <Label>Classe</Label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            >
              {manageableClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Contenu</Label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>
          {message && <p className="text-sm text-olive">{message}</p>}
          <Button type="submit" disabled={saving || !classId}>
            {saving ? 'Publication…' : 'Publier'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Annonces publiées</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {annonces.length} annonce{annonces.length > 1 ? 's' : ''}
        </CardDescription>
        {loading ? (
          <p className="text-sm text-pierre">Chargement…</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce.</p>
        ) : (
          <ul className="space-y-2">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-md border border-pierre/15 px-3 py-2.5">
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
                    <div className="flex gap-2">
                      <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => handleEditSave(a.id)}>Enregistrer</Button>
                      <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setEditingId(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-bordeaux">{a.title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(a.id); setEditTitle(a.title); setEditContent(a.content) }} className="text-xs text-or underline">Modifier</button>
                        {deleteConfirmId === a.id ? (
                          <span className="flex gap-2">
                            <button onClick={() => handleDelete(a.id)} className="text-xs text-red-700 underline">Confirmer</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-pierre underline">Annuler</button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(a.id)} className="text-xs text-red-700 underline">Supprimer</button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-pierre">{a.content}</p>
                    <p className="mt-1 text-xs text-pierre/70">{a.created_at ? formatShortDate(a.created_at) : ''}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// =====================================================
// Helpers
// =====================================================
function formatShortDate(value: string): string {
  const dateStr = value.includes('T') ? value : `${value}T00:00:00`
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
