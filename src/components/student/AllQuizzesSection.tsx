import { useEffect, useMemo, useState } from 'react'
import { Course } from '@/lib/courses'

export function AllQuizzesSection({ courses, studentId, onOpenQuiz }: { courses: Course[]; studentId: string; onOpenQuiz: (id: string) => void }) {
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
                    onClick={() => onOpenQuiz(q.id)}
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-colors hover:bg-or/10 text-bordeaux"
                  >
                    <span>{q.title}</span>
                    <span className={`text-xs ${q.attempted ? 'text-olive' : 'text-or-texte dark:text-or font-medium'}`}>
                      {q.attempted ? 'Repasser →' : 'Passer →'}
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
