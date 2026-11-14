import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function MeditationSection() {
  const {
    classes,
    verseClassId,
    loadVerses,
    handleAddVerse,
    verseText,
    setVerseText,
    verseReference,
    setVerseReference,
    verseSaving,
    verseDay,
    setVerseDayVal,
    verseLoading,
    verses,
    handleSetVerseDay,
    handleToggleVerse,
    handleRemoveVerse,
    verseMsg,
  } = useAdminDashboardContext()

  return (
        <div className="space-y-4">
          <Card>
            <CardTitle>Versets à méditer</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Ajoute un verset biblique pour chaque classe. L'étudiant verra un verset différent chaque jour.
            </CardDescription>
            <div className="mb-4">
              <Label htmlFor="verse-class">Sélectionner une classe</Label>
              <select
                id="verse-class"
                value={verseClassId}
                onChange={(e) => loadVerses(e.target.value)}
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
              >
                <option value="">Choisir une classe…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {verseClassId && (
              <>
                <form onSubmit={handleAddVerse} className="mb-4 space-y-3 rounded-md border border-sable/60 p-4">
                  <p className="text-sm font-medium text-bordeaux">Ajouter un verset</p>
                  <div>
                    <Label htmlFor="verse-text">Texte du verset</Label>
                    <textarea
                      id="verse-text"
                      required
                      rows={3}
                      value={verseText}
                      onChange={(e) => setVerseText(e.target.value)}
                      placeholder="Ex: Car Dieu a tant aimé le monde qu'il a donné son Fils unique…"
                      className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <Label htmlFor="verse-ref">Référence</Label>
                      <Input
                        id="verse-ref"
                        required
                        value={verseReference}
                        onChange={(e) => setVerseReference(e.target.value)}
                        placeholder="Ex: Jean 3:16"
                      />
                    </div>
                    <Button type="submit" variant="primary" disabled={verseSaving} className="self-end">
                      {verseSaving ? 'Ajout…' : 'Ajouter'}
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="verse-day">Jour de la semaine (optionnel)</Label>
                    <select
                      id="verse-day"
                      value={verseDay}
                      onChange={(e) => setVerseDayVal(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                    >
                      <option value="">Chaque jour (rotation)</option>
                      <option value={1}>Lundi</option>
                      <option value={2}>Mardi</option>
                      <option value={3}>Mercredi</option>
                      <option value={4}>Jeudi</option>
                      <option value={5}>Vendredi</option>
                      <option value={6}>Samedi</option>
                      <option value={7}>Dimanche</option>
                    </select>
                  </div>
                </form>

                {verseLoading ? (
                  <p className="text-sm text-pierre">Chargement des méditations…</p>
                ) : verses.length === 0 ? (
                  <p className="text-sm text-pierre">Aucun verset pour cette classe.</p>
                ) : (
                  <ul className="space-y-2">
                    {verses.map((v) => (
                      <li
                        key={v.id}
                        className={`rounded-md border p-3 ${v.active ? 'border-pierre/15' : 'border-or/40 bg-or/5 opacity-60'}`}
                      >
                        <p className="text-sm text-bordeaux">{v.verse_text}</p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-pierre">
                          {v.verse_reference}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <select
                            value={v.day_of_week ?? ''}
                            onChange={(e) => handleSetVerseDay(v.id, e.target.value === '' ? null : Number(e.target.value))}
                            className="rounded border border-pierre/20 bg-white px-2 py-1 text-xs text-bordeaux"
                          >
                            <option value="">Chaque jour</option>
                            <option value={1}>Lundi</option>
                            <option value={2}>Mardi</option>
                            <option value={3}>Mercredi</option>
                            <option value={4}>Jeudi</option>
                            <option value={5}>Vendredi</option>
                            <option value={6}>Samedi</option>
                            <option value={7}>Dimanche</option>
                          </select>
                          <button
                            onClick={() => handleToggleVerse(v.id)}
                            className="text-xs text-or-texte dark:text-or underline"
                          >
                            {v.active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            onClick={() => handleRemoveVerse(v.id)}
                            className="text-xs text-red-700 underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {verseMsg && <p className="mt-3 text-sm text-olive">{verseMsg}</p>}
          </Card>
        </div>
  )
}
