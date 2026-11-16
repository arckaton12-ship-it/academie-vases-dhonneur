import { useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/Avatar'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { playClick } from '@/lib/sound'
import { ClassRow, StudentProfile } from '@/lib/courses'

export function ElevesTab({
  students,
  classById,
}: {
  students: StudentProfile[]
  classById: Map<string, ClassRow>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        `${s.last_name} ${s.first_name}`.toLowerCase().includes(q)
    )
  }, [students, search])

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Élèves</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {students.length} élève{students.length > 1 ? 's' : ''} dans tes classes
        </CardDescription>

        <div className="mb-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un élève…"
            className="max-w-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-pierre">
            {students.length === 0
              ? 'Aucun élève dans tes classes.'
              : 'Aucun résultat pour cette recherche.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm leading-relaxed">
              <thead>
                <tr className="border-b-2 border-or bg-white/60 text-left dark:bg-white/5">
                  <th className="px-4 py-3 font-medium text-bordeaux">Nom</th>
                  <th className="px-4 py-3 font-medium text-bordeaux">Classe</th>
                  <th className="px-4 py-3 font-medium text-bordeaux">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-pierre/15 transition-colors last:border-0 hover:bg-or/5 dark:hover:bg-or/5">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedId(s.id); playClick() }}
                        className={`flex items-center gap-2.5 rounded-card px-1 py-0.5 text-left transition-colors ${
                          selectedId === s.id ? 'bg-bordeaux/10' : 'hover:bg-sable/30'
                        }`}
                      >
                        <Avatar
                          url={(s as any).avatar_url}
                          firstName={s.first_name}
                          lastName={s.last_name}
                          size={28}
                        />
                        <span className="font-medium text-bordeaux">
                          {s.last_name} {s.first_name}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-pierre">
                      {classById.get(s.class_id ?? '')?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.active ? (
                        <span className="rounded-full bg-olive/15 px-2 py-0.5 text-xs text-olive">Actif</span>
                      ) : (
                        <span className="rounded-full bg-pierre/10 px-2 py-0.5 text-xs text-pierre">Inactif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedId && (
        <StudentProfileCard
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}