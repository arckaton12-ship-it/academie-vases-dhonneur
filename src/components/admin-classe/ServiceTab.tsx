import { useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { ClassRow, StudentProfile } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'

export function ServiceTab({
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