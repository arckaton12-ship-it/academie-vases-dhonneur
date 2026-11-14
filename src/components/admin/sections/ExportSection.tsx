import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Input'
import { exportToCSV, exportToPDF } from '@/lib/export'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function ExportSection() {
  const {
    classHeaders,
    classRows,
    studentHeaders,
    studentRows,
    exportClassId,
    setExportClassId,
    classes,
    students,
    gradeHeaders,
    gradeRows,
    downloadBulletin,
  } = useAdminDashboardContext()

  return (
        <Card>
          <CardTitle>Export des données</CardTitle>
          <CardDescription className="mt-1 mb-3">
            Exports à la demande : CSV de suivi et bulletins PDF individuels par étudiant.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportToCSV('suivi-par-classe.csv', classHeaders, classRows())}>
              Suivi par classe → CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportToPDF(
                  'suivi-par-classe.pdf',
                  'Suivi par classe — Académie Vases d\'Honneur',
                  'Effectifs et cours publiés par classe',
                  classHeaders,
                  classRows()
                )
              }
            >
              Suivi par classe → PDF
            </Button>
            <Button variant="outline" onClick={() => exportToCSV('liste-etudiants.csv', studentHeaders, studentRows())}>
              Étudiants → CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportToPDF(
                  'liste-etudiants.pdf',
                  'Liste des étudiants',
                  'Répertoire des étudiants inscrits',
                  studentHeaders,
                  studentRows()
                )
              }
            >
              Étudiants → PDF
            </Button>
          </div>

          <div className="mt-6 rounded-md border border-sable/60 p-4">
            <p className="mb-3 text-sm font-medium text-bordeaux">
              Notes, présence et méditation par classe
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-64">
                <Label htmlFor="export-class">Classe</Label>
                <select
                  id="export-class"
                  value={exportClassId}
                  onChange={(e) => setExportClassId(e.target.value)}
                  className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
                >
                  <option value="">Toutes les classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                onClick={() => exportToCSV('notes-et-presence.csv', gradeHeaders, gradeRows())}
              >
                Notes & présence → CSV
              </Button>
            </div>
          </div>
          <div className="mt-6 border-t border-sable/60 pt-4">
            <p className="mb-3 text-sm font-medium text-bordeaux">Bulletins individuels</p>
            <ul className="space-y-2 text-sm">
              {students.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-pierre/15 px-3 py-2">
                  <span className="text-pierre">
                    {s.last_name} {s.first_name} — {s.class?.name ?? 'Sans classe'}
                  </span>
                  <Button
                    variant="outline"
                    className="!px-3 !py-1 text-xs"
                    onClick={() => downloadBulletin(s)}
                  >
                    Bulletin PDF
                  </Button>
                </li>
              ))}
              {students.length === 0 && <p className="text-pierre">Aucun étudiant.</p>}
            </ul>
          </div>
        </Card>
  )
}
