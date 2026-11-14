import { useEffect, useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { gradeResume, ClassRow, Course, StudentProfile } from '@/lib/courses'
import { toast, toastError } from '@/components/ui/Toast'

export function ResumesGradingTab({
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