import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import { CoursePlayer } from '@/components/CoursePlayer'
import { QuizTab } from '@/components/QuizTab'
import { getModNotes, saveModNotes, ClassRow, Course, MiniTask, ModeratorSchedule, ModerationSupport } from '@/lib/courses'
import { CourseMiseEnPratiqueEditor } from './CourseMiseEnPratiqueEditor'
import { formatShortDate } from './dates'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function ProgrammeTab({
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
                    <span className="font-mono text-xs text-or-texte dark:text-or font-semibold">S{c.week}</span>
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
                  <p className="mt-2 text-xs text-or-texte dark:text-or italic">Aucun média disponible pour ce cours.</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Mes Notes pour la Modération</Label>
                  <button type="button" onClick={() => setPrepFullscreen(true)} className="text-xs text-or-texte dark:text-or underline hover:text-bordeaux">Plein écran</button>
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