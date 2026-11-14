import { useEffect, useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { ClassRow, Course, StudentProfile } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'
import { formatShortDate } from './dates'

export function PresenceTab({
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