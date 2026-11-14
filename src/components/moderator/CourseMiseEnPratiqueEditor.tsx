import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/Input'
import { saveCourseMiseEnPratique, Course } from '@/lib/courses'

export function CourseMiseEnPratiqueEditor({ course }: { course: Course }) {
  const [value, setValue] = useState(course.mise_en_pratique ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setValue(course.mise_en_pratique ?? '') }, [course.id, course.mise_en_pratique])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveCourseMiseEnPratique(course.id, value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* */ } finally { setSaving(false) }
  }

  return (
    <div className="mt-2 border-t border-sable/60 pt-2">
      <div className="flex items-center justify-between">
        <Label className="!text-xs font-medium text-bordeaux">Mise en pratique du cours</Label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-[11px] text-or-texte dark:text-or underline hover:text-bordeaux"
        >
          {saving ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </div>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Exercice / application concrète à mettre sur la page du cours…"
        className="mt-1 w-full rounded-md border border-pierre/30 bg-parchemin px-3 py-2 text-xs text-bordeaux placeholder:text-pierre/40 focus-visible:border-or"
      />
    </div>
  )
}