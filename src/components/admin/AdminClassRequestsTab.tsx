import { useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { ClassRow } from '@/lib/courses'

export function AdminClassRequestsTab({ classes }: { classes: ClassRow[] }) {
  const [requests, setRequests] = useState<Array<{
    id: string
    student_id: string
    requested_class_name: string
    status: string
    created_at: string
    profiles: { first_name: string; last_name: string; email: string }[] | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    setLoading(true)
    const { data: reqs } = await supabase
      .from('class_requests')
      .select('id, student_id, requested_class_name, status, created_at')
      .order('created_at', { ascending: false })
    if (!reqs || reqs.length === 0) {
      setRequests([])
      setLoading(false)
      return
    }
    const ids = [...new Set(reqs.map(r => r.student_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', ids)
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    const merged = reqs.map(r => ({
      ...r,
      profiles: profileMap.get(r.student_id) ? [profileMap.get(r.student_id)!] : null,
    }))
    setRequests(merged)
    setLoading(false)
  }

  async function handleResolve(requestId: string, approve: boolean, className?: string) {
    setResolvingId(requestId)
    try {
      const { data, error } = await supabase.rpc('resolve_class_request', {
        p_request_id: requestId,
        p_approve: approve,
        p_class_name: className || null,
      })
      if (error) throw error
      const result = data as { ok: boolean; msg: string }
      if (!result.ok) throw new Error(result.msg)
      toast(result.msg)
      await loadRequests()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setResolvingId(null)
    }
  }

  const pending = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Demandes de classe en attente</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Étudiants sans classe assignée qui ont demandé l'accès.
        </CardDescription>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-pierre"><div className="h-4 w-4 animate-spin rounded-full border-2 border-or border-t-transparent" /> Chargement…</div>
        ) : pending.length === 0 ? (
          <p className="text-sm text-pierre/60">Aucune demande en attente.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map(r => {
              const p = r.profiles?.[0]
              return (
                <li key={r.id} className="flex flex-col gap-2 rounded-lg border border-or/30 bg-or/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-bordeaux">
                      {p?.first_name} {p?.last_name}
                    </p>
                    <p className="text-xs text-pierre">{p?.email} — Demande : <span className="font-medium text-bordeaux">{r.requested_class_name}</span></p>
                    <p className="text-[11px] text-pierre/60">{new Date(r.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border border-pierre/30 bg-white px-2 py-1 text-xs text-bordeaux"
                      defaultValue={r.requested_class_name}
                      id={`class-${r.id}`}
                    >
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <Button
                      variant="primary"
                      className="!px-3 !py-1.5 !text-xs"
                      disabled={resolvingId === r.id}
                      onClick={() => {
                        const sel = document.getElementById(`class-${r.id}`) as HTMLSelectElement
                        handleResolve(r.id, true, sel?.value)
                      }}
                    >
                      {resolvingId === r.id ? '…' : 'Approuver'}
                    </Button>
                    <Button
                      variant="outline"
                      className="!px-3 !py-1.5 !text-xs !text-rouge !border-rouge/30 hover:!bg-rouge/10"
                      disabled={resolvingId === r.id}
                      onClick={() => handleResolve(r.id, false)}
                    >
                      Refuser
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {resolved.length > 0 && (
        <Card>
          <CardTitle className="text-sm">Historique des demandes traitées</CardTitle>
          <ul className="mt-2 space-y-1">
            {resolved.map(r => {
              const p = r.profiles?.[0]
              return (
                <li key={r.id} className="flex items-center justify-between border-b border-pierre/10 py-2 text-xs last:border-0">
                  <span className="text-bordeaux">{p?.first_name} {p?.last_name}</span>
                  <span className={`font-medium ${r.status === 'approved' ? 'text-olive' : 'text-rouge'}`}>
                    {r.status === 'approved' ? '✓ Approuvée' : '✗ Refusée'}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
