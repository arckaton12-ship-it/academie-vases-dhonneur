import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'

const CLASSES = [
  { name: 'Connaître & Servir Christ', level: 1 },
  { name: 'Croître avec Jésus', level: 2 },
  { name: 'Consécration', level: 3 },
]

interface ClassPickerProps {
  userId: string
  onPicked: (classId: string) => void
}

export function ClassPicker({ userId, onPicked }: ClassPickerProps) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const { data: cls } = await supabase
        .from('classes')
        .select('id')
        .eq('name', selected)
        .single()

      if (!cls) throw new Error('Classe introuvable')

      const { error } = await supabase
        .from('profiles')
        .update({ class_id: cls.id })
        .eq('id', userId)

      if (error) throw error
      toast('Classe assignée ! Bienvenue.')
      onPicked(cls.id)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-or/40 bg-gradient-to-br from-or/5 to-parchemin p-5 shadow-md">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-or/20 text-or">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-bordeaux">Choisis ta classe</h3>
          <p className="text-xs text-pierre">Pour accéder à tes cours et exercices</p>
        </div>
      </div>

      <div className="space-y-2">
        {CLASSES.map((c) => (
          <label
            key={c.name}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
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
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
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

      <button
        onClick={handleConfirm}
        disabled={!selected || loading}
        className="mt-4 w-full rounded-lg bg-bordeaux px-4 py-3 text-sm font-semibold text-parchemin transition-colors hover:bg-[#4a2234] disabled:opacity-50"
      >
        {loading ? 'Enregistrement…' : 'Confirmer ma classe'}
      </button>
    </div>
  )
}
