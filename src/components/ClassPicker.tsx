import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'
import { sendPushToRole } from '@/lib/pushSend'

const CLASSES = [
  { name: 'Classe 1 : Connaître Christ', level: 1 },
  { name: 'Classe 2 : Croître avec Jésus', level: 2 },
  { name: 'Classe 3 : Consécration & Service', level: 3 },
]

interface ClassPickerProps {
  userId: string
  onPicked: (classId: string) => void
}

export function ClassPicker({ userId, onPicked }: ClassPickerProps) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none')
  const [requestMsg, setRequestMsg] = useState('')

  useEffect(() => {
    supabase
      .from('class_requests')
      .select('status')
      .eq('student_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRequestStatus(data.status as 'pending' | 'approved' | 'rejected')
      })
  }, [userId])

  const handleRequest = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('submit_class_request', {
        p_class_name: selected,
      })
      if (error) throw error
      const result = data as { ok: boolean; msg: string }
      if (!result.ok) {
        setRequestMsg(result.msg)
        return
      }
      setRequestStatus('pending')
      setRequestMsg(result.msg)
      toast(result.msg)
      sendPushToRole('admin', 'Nouvelle demande de classe', `Un étudiant demande l'accès à la classe "${selected}"`, 'class_request').catch(() => {})
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (requestStatus === 'pending') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-or/15">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-or">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-bordeaux">Demande en attente</h2>
          <p className="mt-3 text-sm text-pierre">
            Ta demande de classe a été envoyée à l'administration. Tu seras informé(e) une fois qu'elle sera traitée.
          </p>
          <p className="mt-2 text-xs text-pierre/60">
            En attendant, tu n'as pas encore accès aux cours. Patiente un peu !
          </p>
        </div>
      </div>
    )
  }

  if (requestStatus === 'approved') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-olive/15">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-olive">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-bordeaux">Classe assignée !</h2>
          <p className="mt-3 text-sm text-pierre">
            Ta demande a été approuvée. Recharge la page pour accéder à tes cours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-or/15">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-or">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-bordeaux">Bienvenue dans l'Académie</h2>
            <p className="text-xs text-pierre">Ton compte n'est pas encore rattaché à une classe</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-pierre">
          Pour accéder à tes cours et exercices, choisis la classe qui te convient et soumets ta demande. Un administrateur devra la valider.
        </p>

        <div className="space-y-2">
          {CLASSES.map((c) => (
            <label
              key={c.name}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                selected === c.name
                  ? 'border-or bg-or/10 shadow-sm'
                  : 'border-pierre/20 bg-white hover:border-or/40'
              }`}
            >
              <input
                type="radio"
                name="class-picker"
                value={c.name}
                checked={selected === c.name}
                onChange={() => setSelected(c.name)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected === c.name ? 'border-or bg-or' : 'border-pierre/30'
                }`}
              >
                {selected === c.name && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <div>
                <p className="text-sm font-medium text-bordeaux">{c.name}</p>
                <p className="text-[11px] text-pierre">Niveau {c.level}</p>
              </div>
            </label>
          ))}
        </div>

        {requestMsg && (
          <p className="mt-3 text-sm text-rouge">{requestMsg}</p>
        )}

        <button
          onClick={handleRequest}
          disabled={!selected || loading}
          className="mt-4 w-full rounded-xl bg-bordeaux px-4 py-3 text-sm font-semibold text-parchemin transition-all active:scale-[0.97] hover:bg-[#4a2234] disabled:opacity-50"
        >
          {loading ? 'Envoi…' : 'Demander l\'accès à cette classe'}
        </button>
      </div>
    </div>
  )
}
