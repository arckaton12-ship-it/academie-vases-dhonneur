import { useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { getAnnouncements, Announcement } from '@/lib/courses'

export function AnnoncesEtudiantTab({ classId, studentFirstName }: { classId: string | null; studentFirstName: string | null }) {
  const [annonces, setAnnonces] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classId) { setLoading(false); return }
    getAnnouncements(classId)
      .then(setAnnonces)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classId])

  if (!classId) return <Card><CardDescription>Tu n'as pas encore de classe assignée.</CardDescription></Card>

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Annonces</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Messages et informations de ton modérateur.
        </CardDescription>
        {loading ? (
          <p className="text-sm text-pierre">Chargement…</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-card border border-pierre/15 p-4">
                <p className="font-medium text-bordeaux">{a.title}</p>
                <p className="mt-1 text-sm text-pierre whitespace-pre-wrap">{studentFirstName ? `Bonjour ${studentFirstName},\n\n` : ''}{a.content}</p>
                <p className="mt-2 text-[11px] text-pierre">
                  {a.moderator?.first_name} {a.moderator?.last_name} —{' '}
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
