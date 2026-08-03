import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { AvatarUpload } from '@/components/AvatarUpload'
import { SoundToggle } from '@/components/SoundToggle'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { DayAccentBand } from '@/components/DayAccentBand'
import {
  advanceStudent,
  createCourse,
  updateCourse,
  deleteCourse,
  getClasses,
  getCourses,
  getStreaks,
  getStudents,
  getSubmissions,
  getSubmissionsForGrading,
  gradeSubmission,
  getResumesForGrading,
  gradeResume,
  getModerators,
  getModeratorClasses,
  getModeratorSchedules,
  uploadCourseFile,
  uploadSupportFile,
  getMiniTask,
  saveMiniTask,
  getMiniTasksAll,
  getMiniTaskResponses,
  getModerationSupport,
  saveModerationSupport,
  getSupportsAll,
  createModerationReport,
  getModerationReports,
  deleteModerationReport,
  ClassRow,
  Course,
  StudentProfile,
  Submission,
  Streak,
  ResumeForGrading,
  ModeratorProfile,
  ModeratorSchedule,
  MiniTask,
  MiniTaskResponseWithStudent,
  ModerationSupport,
  ModerationReport,
} from '@/lib/courses'
import { getCurrentProfile, signOut } from '@/lib/auth'
import { exportToCSV, exportToPDF, ExportRow } from '@/lib/export'

type Tab = 'programme' | 'upload' | 'rapport' | 'passage' | 'notation' | 'moderateurs'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

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

  const loadAll = useCallback(async () => {
    const [classesData, coursesData, studentsData, submissionsData, streaksData, miniTasksData, supportsData] =
      await Promise.all([
        getClasses(),
        getCourses(),
        getStudents(),
        getSubmissions(),
        getStreaks(),
        getMiniTasksAll(),
        getSupportsAll(),
      ])
    setClasses(classesData)
    setCourses(coursesData)
    setStudents(studentsData)
    setSubmissions(submissionsData)
    setStreaks(streaksData)
    setMiniTasks(miniTasksData)
    setSupports(supportsData)
  }, [])

  const loadScope = useCallback(async (profileId: string) => {
    const [cls, sched] = await Promise.all([
      getModeratorClasses(profileId),
      getModeratorSchedules(profileId),
    ])
    setOwnClassIds(cls.map((c) => c.id))
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

  return (
    <div className="relative mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <SectionWatermark kind="croix" />
      <div className="relative z-10">
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
        <div className="flex items-center gap-3">
          <SoundToggle />
          <Avatar
            url={moderatorProfile?.avatar_url}
            firstName={moderatorProfile?.first_name}
            lastName={moderatorProfile?.last_name}
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
            Se déconnecter
          </Button>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-sable/60 pb-2">
        {(
          [
            ['programme', 'Programme de modération'],
            ['upload', 'Upload cours'],
            ['rapport', 'Rapport'],
            ['passage', 'Passage de classe'],
            ['notation', 'Notation'],
            ['moderateurs', 'Modérateurs'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? 'bg-bordeaux text-parchemin' : 'text-pierre hover:bg-bordeaux/5'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

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
      {tab === 'upload' && (
        <UploadTab
          classes={classes}
          courses={courses}
          ownClassIds={ownClassIds}
          onChanged={() => loadAll()}
        />
      )}
      {tab === 'rapport' && (
        <RapportTab
          students={students}
          submissions={submissions}
          streaks={streaks}
          classById={classById}
          courses={courses}
          moderatorId={moderatorProfile?.id ?? ''}
          onReportsChanged={() => loadAll()}
        />
      )}
      {tab === 'passage' && (
        <PassageTab students={students} classes={classes} classById={classById} onAdvanced={() => loadAll()} />
      )}
      {tab === 'notation' && (
        <NotationTab onGraded={() => loadAll()} />
      )}
      {tab === 'moderateurs' && (
        <ModeratorsTab classById={classById} />
      )}

      {moderatorProfile && (
        <Card className="mt-6" id="mon-profil">
          <CardTitle>Mon profil</CardTitle>
          <CardDescription className="mt-2 mb-4">
            Gérez votre photo de profil. Les autres informations sont rattachées à votre compte.
          </CardDescription>
          <AvatarUpload
            url={moderatorProfile.avatar_url}
            firstName={moderatorProfile.first_name}
            lastName={moderatorProfile.last_name}
            userId={moderatorProfile.id}
            onSaved={(url) =>
              setModeratorProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev))
            }
          />
        </Card>
      )}
      </div>
    </div>
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

  return (
    <div className="space-y-5">
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
                  s.day_of_week === 0 ? 'border-or/60 bg-or/10' : 'border-pierre/15'
                }`}
              >
                <span className="font-medium text-bordeaux">
                  {DAY_NAMES[s.day_of_week] ?? s.day_of_week}
                </span>
                {s.day_of_week === 0 && (
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
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )
        })
      )}
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
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function UploadTab({
  classes,
  courses,
  ownClassIds,
  onChanged,
}: {
  classes: ClassRow[]
  courses: Course[]
  ownClassIds: string[]
  onChanged: () => void
}) {
  const [editingId, setEditingId] = useState('')
  const [classId, setClassId] = useState('')
  const [week, setWeek] = useState('1')
  const [sessionDate, setSessionDate] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [miniTask, setMiniTask] = useState('')
  const [supportContent, setSupportContent] = useState('')
  const [supportFile, setSupportFile] = useState<File | null>(null)
  const [supportFileUrl, setSupportFileUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const manageableClasses = ownClassIds.length > 0
    ? classes.filter((c) => ownClassIds.includes(c.id))
    : classes

  useEffect(() => {
    if (!classId && manageableClasses.length > 0) setClassId(manageableClasses[0].id)
  }, [manageableClasses, classId])

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
    getMiniTask(editingId)
      .then((t) => setMiniTask(t?.instruction ?? ''))
      .catch(() => setMiniTask(''))
    getModerationSupport(editingId)
      .then((s) => {
        setSupportContent(s?.content ?? '')
        setSupportFileUrl(s?.file_url ?? '')
      })
      .catch(() => {
        setSupportContent('')
        setSupportFileUrl('')
      })
  }, [editingId, courses])

  function startEdit(id: string) {
    setEditingId(id)
    setError(null)
    setSuccess(null)
  }

  function resetForm() {
    setEditingId('')
    setClassId(manageableClasses[0]?.id ?? '')
    setWeek('1')
    setSessionDate('')
    setTitle('')
    setDescription('')
    setAudioFile(null)
    setVideoFile(null)
    setMiniTask('')
    setSupportContent('')
    setSupportFile(null)
    setSupportFileUrl('')
  }

  async function saveExtras(courseId: string) {
    await saveMiniTask(courseId, miniTask)
    const fileUrl = supportFile ? await uploadSupportFile(supportFile) : supportFileUrl
    await saveModerationSupport(courseId, {
      content: supportContent,
      fileUrl,
      removeFile: !supportFile && !supportContent && !fileUrl,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!classId || !title.trim()) {
      setError('La classe et le titre du cours sont obligatoires.')
      return
    }
    if (!editingId && !audioFile && !videoFile) {
      setError('Ajoute au moins un fichier audio ou vidéo pour un nouveau cours.')
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
        await saveExtras(editingId)
        setSuccess('Cours modifié avec succès.')
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
        await saveExtras(created.id)
        setSuccess('Cours publié avec succès.')
      }
      onChanged()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\u2019enregistrement du cours.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    if (!window.confirm('Supprimer définitivement ce cours et ses devoirs ?')) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await deleteCourse(editingId)
      setSuccess('Cours supprimé.')
      onChanged()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>{editingId ? 'Modifier un cours' : 'Publier un cours'}</CardTitle>
        <CardDescription className="mt-1 mb-4">
          {editingId
            ? 'Modifie le titre, la description, la semaine ou remplace les fichiers audio/vidéo.'
            : 'Les fichiers audio/vidéo sont envoyés dans le bucket « cours » et le cours est créé dans la table courses.'}
        </CardDescription>

        <div className="mb-4">
          <Label htmlFor="course-pick">Cours existant (pour modifier)</Label>
          <select
            id="course-pick"
            value={editingId}
            onChange={(e) => (e.target.value ? startEdit(e.target.value) : resetForm())}
            className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
          >
            <option value="">— Nouveau cours —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                Semaine {c.week} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="course-class">Classe</Label>
            <select
              id="course-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            >
              {manageableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="course-week">Semaine</Label>
              <Input
                id="course-week"
                type="number"
                min={1}
                value={week}
                onChange={(e) => setWeek(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="course-date">Date de la session</Label>
              <Input
                id="course-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="course-title">Titre du cours</Label>
            <Input
              id="course-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. La foi qui agit"
            />
          </div>

          <div>
            <Label htmlFor="course-description">Description</Label>
            <textarea
              id="course-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Résumé ou thème du cours…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="course-audio">
                {editingId ? 'Remplacer l\u2019audio (optionnel)' : 'Fichier audio (mp3, m4a, …)'}
              </Label>
              <input
                id="course-audio"
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-sm file:text-parchemin hover:file:bg-[#4a2234]"
              />
              {audioFile && <p className="mt-1 text-xs text-pierre">Sélectionné : {audioFile.name}</p>}
            </div>
            <div>
              <Label htmlFor="course-video">
                {editingId ? 'Remplacer la vidéo (optionnel)' : 'Fichier vidéo (mp4, webm, …)'}
              </Label>
              <input
                id="course-video"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-sm file:text-parchemin hover:file:bg-[#4a2234]"
              />
              {videoFile && <p className="mt-1 text-xs text-pierre">Sélectionné : {videoFile.name}</p>}
            </div>
          </div>

          <div className="rounded-md border border-or/40 bg-parchemin p-3">
            <Label htmlFor="course-minitask">Mini-tâche pratique de la semaine</Label>
            <CardDescription className="mt-1 mb-2">
              La tâche que l'étudiant devra réaliser et raconter après avoir suivi ce cours.
            </CardDescription>
            <textarea
              id="course-minitask"
              rows={2}
              value={miniTask}
              onChange={(e) => setMiniTask(e.target.value)}
              placeholder="Ex. Raconte une situation de cette semaine où tu as dû agir par la foi…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>

          <div className="rounded-md border border-sable/60 bg-white/60 p-3">
            <Label htmlFor="course-support">Mon plan / support de modération</Label>
            <CardDescription className="mt-1 mb-2">
              Ton support personnel pour modérer ce cours : notes de préparation, plan, document joint.
            </CardDescription>
            <textarea
              id="course-support"
              rows={2}
              value={supportContent}
              onChange={(e) => setSupportContent(e.target.value)}
              placeholder="Notes de préparation, plan de modération…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
            <input
              id="course-support-file"
              type="file"
              onChange={(e) => setSupportFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-sm file:text-parchemin hover:file:bg-[#4a2234]"
            />
            {supportFile && (
              <p className="mt-1 text-xs text-pierre">Sélectionné : {supportFile.name}</p>
            )}
            {supportFileUrl && !supportFile && (
              <p className="mt-1 text-xs text-pierre">
                Document actuel :{' '}
                <a href={supportFileUrl} target="_blank" rel="noreferrer" className="underline">
                  ouvrir
                </a>
              </p>
            )}
          </div>

          <FieldError>{error ?? undefined}</FieldError>
          {success && <p className="text-sm text-olive">{success}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Publier le cours'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" className="text-red-700" onClick={handleDelete}>
                Supprimer ce cours
              </Button>
            )}
          </div>
        </form>
      </Card>
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

  const headers = ['Étudiant', 'Email', 'Classe', 'Soumissions', 'Moyenne', 'Streak (sem.)']

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
                <th className="px-3 py-2 font-medium text-bordeaux">Streak</th>
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

function PassageTab({
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
      onAdvanced()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du passage de classe.')
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
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
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
      setMessage('La note doit être entre 0 et 20.')
      return
    }
    setSavingId(sub.id)
    setMessage(null)
    try {
      await gradeSubmission(sub.id, grade, feedbacks[sub.id]?.trim() ?? '')
      setItems((prev) =>
        prev.map((s) =>
          s.id === sub.id ? { ...s, grade, feedback: feedbacks[sub.id]?.trim() ?? '' } : s
        )
      )
      setMessage('Note et appréciation enregistrées.')
      onGraded()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleGradeResume(resume: ResumeForGrading) {
    const raw = rGrades[resume.id]?.trim()
    const grade = raw === '' ? null : Number(raw)
    if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 20)) {
      setMessage('La note doit être entre 0 et 20.')
      return
    }
    setRSavingId(resume.id)
    setMessage(null)
    try {
      await gradeResume(resume.id, grade, rFeedbacks[resume.id]?.trim() ?? '')
      setResumes((prev) =>
        prev.map((r) =>
          r.id === resume.id ? { ...r, grade, feedback: rFeedbacks[resume.id]?.trim() ?? '' } : r
        )
      )
      setMessage('Correction et note enregistrées.')
      onGraded()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur à l\u2019enregistrement.')
    } finally {
      setRSavingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardDescription>Chargement des rendus…</CardDescription>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Notation des rendus</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Note les réponses et les notes manuscrites des étudiants, cours après cours, avec une
          appréciation.
        </CardDescription>
        {items.length === 0 ? (
          <p className="text-sm text-pierre">Aucun rendu à noter pour le moment.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((sub) => (
              <li key={sub.id} className="rounded-card border border-pierre/15 p-4">
                <p className="text-sm font-medium text-bordeaux">
                  {sub.student?.first_name} {sub.student?.last_name}
                </p>
                {sub.type === 'notes' ? (
                  <p className="mt-0.5 text-xs text-pierre">
                    Notes manuscrites —{' '}
                    {sub.course
                      ? `Semaine ${sub.course.week} — ${sub.course.title}`
                      : 'Sans cours'}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-pierre">
                    {sub.assignment?.type === 'DEVOIR' ? 'Devoir' : 'Exercice'} —{' '}
                    {sub.assignment?.description ?? '—'}
                  </p>
                )}
                {sub.content && (
                  <p className="mt-2 rounded-md bg-white/60 px-3 py-2 text-sm text-pierre">
                    {sub.content}
                  </p>
                )}
                {sub.type === 'notes' && sub.attachments && sub.attachments.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sub.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-md border border-sable/70"
                        title="Voir la pièce jointe"
                      >
                        <img src={url} alt="Note manuscrite" className="h-24 w-32 object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  sub.file_url && (
                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-bordeaux underline"
                    >
                      Voir la pièce jointe
                    </a>
                  )
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div>
                    <Label htmlFor={`grade-${sub.id}`}>Note /20</Label>
                    <Input
                      id={`grade-${sub.id}`}
                      type="number"
                      min={0}
                      max={20}
                      value={grades[sub.id] ?? ''}
                      onChange={(e) => setGrades((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`fb-${sub.id}`}>Appréciation</Label>
                    <Input
                      id={`fb-${sub.id}`}
                      value={feedbacks[sub.id] ?? ''}
                      placeholder="Un mot d\u2019encouragement pour cet étudiant…"
                      onChange={(e) =>
                        setFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-3 !px-3 !py-1.5 text-xs"
                  disabled={savingId === sub.id}
                  onClick={() => handleGrade(sub)}
                >
                  {savingId === sub.id ? 'Enregistrement…' : 'Enregistrer la note'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Correction des résumés</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Évalue les résumés de cours (note /20 et appréciation) pour accompagner les étudiants.
        </CardDescription>
        {resumes.length === 0 ? (
          <p className="text-sm text-pierre">Aucun résumé à corriger pour le moment.</p>
        ) : (
          <ul className="space-y-4">
            {resumes.map((r) => (
              <li key={r.id} className="rounded-card border border-pierre/15 p-4">
                <p className="text-sm font-medium text-bordeaux">
                  {r.student?.first_name} {r.student?.last_name}
                </p>
                <p className="mt-0.5 text-xs text-pierre">
                  {r.course ? `Semaine ${r.course.week} — ${r.course.title}` : 'Cours'}
                </p>
                <p className="mt-2 rounded-md bg-white/60 px-3 py-2 text-sm text-pierre">
                  {r.content}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div>
                    <Label htmlFor={`rgrade-${r.id}`}>Note /20</Label>
                    <Input
                      id={`rgrade-${r.id}`}
                      type="number"
                      min={0}
                      max={20}
                      value={rGrades[r.id] ?? ''}
                      onChange={(e) =>
                        setRGrades((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rfb-${r.id}`}>Appréciation</Label>
                    <Input
                      id={`rfb-${r.id}`}
                      value={rFeedbacks[r.id] ?? ''}
                      placeholder="Un mot d\u2019encouragement…"
                      onChange={(e) =>
                        setRFeedbacks((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-3 !px-3 !py-1.5 text-xs"
                  disabled={rSavingId === r.id}
                  onClick={() => handleGradeResume(r)}
                >
                  {rSavingId === r.id ? 'Enregistrement…' : 'Enregistrer la correction'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {message && <p className="text-sm text-olive">{message}</p>}
    </div>
  )
}

function ModeratorsTab({ classById }: { classById: Map<string, ClassRow> }) {
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
          Chaque modérateur accède à son propre espace. Clique sur un nom pour voir sa fiche.
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
                  <p className="text-sm font-medium text-bordeaux">
                    {m.last_name} {m.first_name}
                  </p>
                  <p className="text-xs text-pierre">{m.email}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <Card>
          <CardTitle>Fiche du modérateur</CardTitle>
          <dl className="mt-2 space-y-2 text-sm">
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
