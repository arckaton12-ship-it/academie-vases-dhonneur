import { useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getModerators, ClassRow, ModeratorProfile } from '@/lib/courses'

export function ModeratorsTab({ classById, onMessageUser }: { classById: Map<string, ClassRow>; onMessageUser: (userId: string) => void }) {
  const [moderators, setModerators] = useState<ModeratorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    getModerators()
      .then(setModerators)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardDescription>Chargement des modérateurs…</CardDescription>
      </Card>
    )
  }

  const selected = moderators.find((m) => m.id === selectedId) ?? null

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Modérateurs de l'Académie</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Clique sur un nom pour voir sa fiche et lui écrire.
        </CardDescription>
        {moderators.length === 0 ? (
          <p className="text-sm text-pierre">Aucun modérateur enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {moderators.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full rounded-card border px-4 py-3 text-left transition-colors ${
                    selectedId === m.id
                      ? 'border-bordeaux bg-bordeaux/5'
                      : 'border-pierre/15 hover:border-bordeaux/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-bordeaux">
                        {m.last_name} {m.first_name}
                      </p>
                      <p className="text-xs text-pierre">{m.email}</p>
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); onMessageUser(m.id) }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-or/40 text-or transition-colors hover:bg-or/10"
                      title={`Envoyer un message à ${m.first_name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Fiche du modérateur</CardTitle>
            <Button
              variant="outline"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => onMessageUser(selected.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Envoyer un message
            </Button>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Nom" value={`${selected.last_name} ${selected.first_name}`} />
            <Row label="Email" value={selected.email} />
            <Row label="Téléphone" value={selected.phone ?? '—'} />
            <Row label="Tribu" value={selected.tribe ?? '—'} />
            <Row label="Département" value={selected.department ?? '—'} />
            <Row label="Classe rattachée" value={selected.class_id ? classById.get(selected.class_id)?.name ?? '—' : 'Non définie'} />
          </dl>
        </Card>
      )}
      {message && <p className="text-sm text-olive">{message}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-sable/60 pb-2">
      <dt className="text-pierre">{label}</dt>
      <dd className="text-right text-bordeaux">{value}</dd>
    </div>
  )
}