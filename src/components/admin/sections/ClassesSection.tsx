import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function ClassesSection() {
  const {
    classes,
    loadClassDetail,
    selectedClassId,
    selectedClass,
    classStudents,
    classCourses,
  } = useAdminDashboardContext()

  return (
        <div className="space-y-4">
          <Card>
            <CardTitle>Tableau de bord par classe</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Sélectionne une classe pour voir ses étudiants et ses cours.
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadClassDetail(c.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedClassId === c.id
                      ? 'bg-bordeaux text-parchemin'
                      : 'border border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Card>

          {selectedClass && (
            <Card>
              <CardTitle>{selectedClass.name}</CardTitle>
              <CardDescription className="mt-1 mb-3">
                {classStudents.length} étudiant{classStudents.length > 1 ? 's' : ''} ·{' '}
                {classCourses.length} cours publié{classCourses.length > 1 ? 's' : ''}
              </CardDescription>
              <p className="mb-2 text-sm font-medium text-bordeaux">Étudiants</p>
              {classStudents.length === 0 ? (
                <p className="text-sm text-pierre">Aucun étudiant dans cette classe.</p>
              ) : (
                <ul className="mb-4 space-y-1 text-sm text-pierre">
                  {classStudents.map((s) => (
                    <li key={s.id}>
                      {s.last_name} {s.first_name} — {s.email}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mb-2 text-sm font-medium text-bordeaux">Cours publiés</p>
              {classCourses.length === 0 ? (
                <p className="text-sm text-pierre">Aucun cours publié.</p>
              ) : (
                <ul className="space-y-1 text-sm text-pierre">
                  {classCourses.map((c) => (
                    <li key={c.id}>
                      Semaine {c.week} — {c.title}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
  )
}
