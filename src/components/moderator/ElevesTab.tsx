import { useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Avatar } from '@/components/Avatar'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { SoulTrackingTab } from '@/components/SoulTrackingTab'
import { playClick } from '@/lib/sound'
import { ClassRow, StudentProfile } from '@/lib/courses'
import { InscriptionTab } from './InscriptionTab'

export function ElevesTab({
  students,
  ownClassIds,
  classById,
  classes,
  onMessageUser,
  onCreated,
}: {
  students: StudentProfile[]
  ownClassIds: string[]
  classById: Map<string, ClassRow>
  classes: ClassRow[]
  onMessageUser: (userId: string) => void
  onCreated: () => void
}) {
  const [subTab, setSubTab] = useState<'fiche' | 'suivi' | 'inscription'>('fiche')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const myStudents = students.filter((s) => ownClassIds.includes(s.class_id ?? ''))

  const subTabs: [string, string][] = [
    ['fiche', 'Fiche étudiant'],
    ['suivi', "Suivi d'âme"],
    ['inscription', 'Inscription'],
  ]

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key as typeof subTab)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              subTab === key
                ? 'bg-bordeaux text-parchemin'
                : 'bg-pierre/10 text-pierre hover:bg-pierre/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'fiche' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>Fiche étudiant</CardTitle>
            <CardDescription className="mt-1">
              Consulte le profil complet d'un étudiant de tes classes.
            </CardDescription>
            <ul className="mt-3 max-h-64 overflow-y-auto space-y-1">
              {myStudents.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => { setSelectedId(s.id); playClick() }}
                    className={`flex w-full items-center gap-3 px-3 py-2 rounded-card text-left text-sm transition-colors ${
                      selectedId === s.id ? 'bg-bordeaux/10' : 'hover:bg-sable/30'
                    }`}
                  >
                    <Avatar url={(s as any).avatar_url} firstName={s.first_name} lastName={s.last_name} size={28} />
                    <div>
                      <p className="font-medium text-bordeaux">{s.last_name} {s.first_name}</p>
                      <p className="text-[11px] text-pierre">{classById.get(s.class_id ?? '')?.name ?? '—'}</p>
                    </div>
                  </button>
                </li>
              ))}
              {myStudents.length === 0 && (
                <p className="text-xs text-pierre">Aucun étudiant dans tes classes.</p>
              )}
            </ul>
          </Card>
          {selectedId && <StudentProfileCard studentId={selectedId} onClose={() => setSelectedId(null)} />}
        </div>
      )}

      {subTab === 'suivi' && (
        <Card>
          <CardTitle>Suivi d'âme</CardTitle>
          <CardDescription className="mt-2 mb-4">Sélectionne un étudiant pour consulter/modifier sa fiche de suivi pastoral.</CardDescription>
          <div className="flex flex-wrap gap-2">
            {myStudents.map(s => (
              <button key={s.id} onClick={() => setSelectedId(s.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedId === s.id ? 'bg-or text-encre' : 'bg-pierre/10 text-pierre hover:bg-or/20'}`}>
                {s.first_name} {s.last_name}
              </button>
            ))}
            {myStudents.length === 0 && (
              <p className="text-xs text-pierre">Aucun étudiant dans tes classes.</p>
            )}
          </div>
          {selectedId && (() => {
            const selected = myStudents.find(s => s.id === selectedId)
            if (!selected) return null
            return (
              <div className="mt-6">
                <SoulTrackingTab studentId={selected.id} studentName={`${selected.first_name} ${selected.last_name}`} />
              </div>
            )
          })()}
        </Card>
      )}

      {subTab === 'inscription' && (
        <InscriptionTab
          ownClassIds={ownClassIds}
          classes={classes}
          onCreated={onCreated}
        />
      )}
    </div>
  )
}