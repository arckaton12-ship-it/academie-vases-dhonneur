import { useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { gradeSubmission, ClassRow, StudentProfile, Submission } from '@/lib/courses'
import { toast, toastError } from '@/components/ui/Toast'
import { formatShortDate } from './dates'

export function DevoirsGradingTab({
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