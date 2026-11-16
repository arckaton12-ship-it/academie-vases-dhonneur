import { useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { setMeditationGrade, ClassRow, StudentProfile, Streak } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'

export function MeditationTab({
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
          <table className="w-full border-collapse text-sm leading-relaxed">
            <thead>
              <tr className="border-b-2 border-or bg-white/60 text-left dark:bg-white/5">
                <th className="px-4 py-3 font-medium text-bordeaux">Étudiant</th>
                <th className="px-4 py-3 font-medium text-bordeaux">Méditation (sem.)</th>
                <th className="px-4 py-3 font-medium text-bordeaux">Note /20</th>
                <th className="px-4 py-3 font-medium text-bordeaux">Statut</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const streak = streakByStudent.get(s.id) ?? 0
                const gradeValue = grades[s.id] ?? (s.meditation_grade != null ? String(s.meditation_grade) : '')
                return (
                  <tr key={s.id} className="border-b border-pierre/15 transition-colors last:border-0 hover:bg-or/5 dark:hover:bg-or/5">
                    <td className="px-4 py-3 text-bordeaux">{s.last_name} {s.first_name}</td>
                    <td className="px-4 py-3 font-mono text-pierre">{streak}</td>
                    <td className="px-4 py-3">
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
                        {savingId === s.id && <span className="text-[10px] text-or-texte dark:text-or">...</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {streak >= 4 ? (
                        <span className="rounded-full bg-olive/15 px-2 py-0.5 text-xs text-olive">Excellent</span>
                      ) : streak >= 2 ? (
                        <span className="rounded-full bg-or/15 px-2 py-0.5 text-xs text-or-texte dark:text-or">En progres</span>
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