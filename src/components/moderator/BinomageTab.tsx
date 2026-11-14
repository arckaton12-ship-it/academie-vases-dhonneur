import { useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BulletinPDF } from '@/components/BulletinPDF'
import { supabase } from '@/lib/supabase'
import { advanceStudent, ClassRow, StudentProfile } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'

export function BinomageTab({
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
      toast(`${student.first_name} ${student.last_name} a changé de classe.`)
      playSuccess()
      onAdvanced()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du passage de classe.')
      toastError('Erreur.')
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
                  <BulletinPDF studentId={student.id} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-pierre/15 pt-4">
        <h4 className="font-display text-base text-bordeaux">Binômage</h4>
        <p className="mt-1 text-xs text-pierre">Associe deux étudiants pour qu'ils suivent le parcours ensemble.</p>
        <div className="mt-3 space-y-2">
          {students.map(s => {
            const binome = s.binome_id ? students.find(b => b.id === s.binome_id) : null
            return (
              <div key={s.id} className="flex items-center gap-2 rounded-md border border-pierre/10 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm text-bordeaux">{s.first_name} {s.last_name}</span>
                <span className="text-xs text-pierre">→</span>
                <select
                  value={s.binome_id ?? ''}
                  onChange={async (e) => {
                    const newBinomeId = e.target.value || null
                    if (s.binome_id && s.binome_id !== newBinomeId) {
                      await supabase.from('profiles').update({ binome_id: null }).eq('id', s.binome_id)
                    }
                    if (newBinomeId) {
                      const newPartner = students.find(b => b.id === newBinomeId)
                      if (newPartner?.binome_id && newPartner.binome_id !== s.id) {
                        await supabase.from('profiles').update({ binome_id: null }).eq('id', newBinomeId)
                      }
                    }
                    await supabase.from('profiles').update({ binome_id: newBinomeId }).eq('id', s.id)
                    if (newBinomeId) {
                      await supabase.from('profiles').update({ binome_id: s.id }).eq('id', newBinomeId)
                    }
                    onAdvanced()
                  }}
                  className="rounded-md border border-pierre/30 bg-white px-2 py-1 text-xs text-bordeaux"
                >
                  <option value="">Aucun binôme</option>
                  {students.filter(b => b.id !== s.id && b.class_id === s.class_id).map(b => (
                    <option key={b.id} value={b.id}>{b.first_name} {b.last_name}</option>
                  ))}
                </select>
                {binome && <span className="text-[10px] text-olive">✓ {binome.first_name}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}