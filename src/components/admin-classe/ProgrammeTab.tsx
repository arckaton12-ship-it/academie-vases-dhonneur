import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { ClassRow, Course } from '@/lib/courses'
import { formatShortDate } from './dates'

export function ProgrammeTab({
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