import { useMemo } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'
import { auditWeekCoverageByClass } from '@/lib/weekCoverage'

export function VueSection() {
  const {
    loading,
    students,
    averagePresence,
    submissions,
    classes,
    resumeCount,
    resumeRate,
    avgStreak,
    allBadges,
    miniResponses,
    engagementByClass,
    averageGrade,
    byClass,
    courses,
    setSection,
  } = useAdminDashboardContext()

  const weekAudit = useMemo(
    () =>
      auditWeekCoverageByClass(
        classes.map((classe) => ({ id: classe.id, name: classe.name })),
        courses
      ),
    [classes, courses]
  )

  return (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardDescription>Étudiants inscrits</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : students.length}</p>
            </Card>
            <Card>
              <CardDescription>Présence moyenne</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : averagePresence}</p>
            </Card>
            <Card>
              <CardDescription>Devoirs soumis</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : submissions.length}</p>
            </Card>
            <Card>
              <CardDescription>Classes actives</CardDescription>
              <p className="font-display text-3xl text-bordeaux">{loading ? '—' : classes.length}</p>
            </Card>
          </div>

          <Card className="mt-4">
            <CardTitle>Engagement des étudiants</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Comment la formation prend corps : résumés, méditations, badges et mini-tâches à travers toute l'Académie.
            </CardDescription>
            <div className="grid gap-4 sm:grid-cols-5">
              <Card>
                <CardDescription>Résumés rédigés</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : resumeCount}</p>
              </Card>
              <Card>
                <CardDescription>Taux de résumés</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : `${resumeRate}%`}</p>
              </Card>
              <Card>
                <CardDescription>Assiduité moyenne</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : avgStreak}</p>
              </Card>
              <Card>
                <CardDescription>Badges délivrés</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : allBadges.length}</p>
              </Card>
              <Card>
                <CardDescription>Mini-tâches rendues</CardDescription>
                <p className="font-display text-3xl text-bordeaux">{loading ? '—' : miniResponses.length}</p>
              </Card>
            </div>
          </Card>

          <Card className="mt-4">
            <CardTitle>Engagement par classe</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Présence, résumés, badges et notes corrigées — la vie de chaque classe en un regard.
            </CardDescription>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-or bg-white/60 text-left">
                    <th className="px-3 py-2 font-medium text-bordeaux">Classe</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Étudiants actifs</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Présence</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Résumés</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Badges</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Devoirs notés</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {engagementByClass.map((r) => (
                    <tr key={r.className} className="border-b border-pierre/15">
                      <td className="px-3 py-2 text-bordeaux">{r.className}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.students}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.presence}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.resumes}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.badges}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.graded}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.avgGrade}</td>
                    </tr>
                  ))}
                  {engagementByClass.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-pierre">
                        Aucune donnée d'engagement disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-4">
            <CardTitle>Suivi par classe</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Effectif et nombre de cours publiés par classe. Moyenne générale des soumissions notées : {averageGrade}.
            </CardDescription>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-or bg-white/60 text-left">
                    <th className="px-3 py-2 font-medium text-bordeaux">Classe</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Étudiants</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Cours publiés</th>
                  </tr>
                </thead>
                <tbody>
                  {byClass.map((r) => (
                    <tr key={r.className} className="border-b border-pierre/15">
                      <td className="px-3 py-2 text-bordeaux">{r.className}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.students}</td>
                      <td className="px-3 py-2 font-mono text-pierre">{r.courses}</td>
                    </tr>
                  ))}
                  {byClass.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-pierre">
                        Aucune classe disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-4">
            <CardTitle>Couverture des semaines</CardTitle>
            <CardDescription className="mt-1 mb-3">
              Contrôle automatique : chaque classe doit proposer un cours pour chaque semaine, sans
              trou ni doublon. Une alerte ici signale un planning à compléter.
            </CardDescription>
            {weekAudit.some(({ report }) => Boolean(report.message)) && (
              <button
                type="button"
                onClick={() => setSection('cours')}
                className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-or/40 px-3 py-1.5 text-xs font-medium text-or-texte transition-colors hover:bg-or/10 dark:text-or"
              >
                Corriger le planning des cours
                <span aria-hidden>→</span>
              </button>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-or bg-white/60 text-left">
                    <th className="px-3 py-2 font-medium text-bordeaux">Classe</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Semaines couvertes</th>
                    <th className="px-3 py-2 font-medium text-bordeaux">Contrôle</th>
                  </tr>
                </thead>
                <tbody>
                  {weekAudit.map(({ id, name, report }) => (
                    <tr key={id} className="border-b border-pierre/15">
                      <td className="px-3 py-2 text-bordeaux">{name}</td>
                      <td className="px-3 py-2 font-mono text-pierre">
                        {report.empty
                          ? '—'
                          : `${report.weeks.length} (${report.weeks[0]} à ${report.weeks[report.weeks.length - 1]})`}
                      </td>
                      <td className="px-3 py-2">
                        {report.empty ? (
                          <span className="text-pierre">Aucun cours enregistré.</span>
                        ) : report.message ? (
                          <button
                            type="button"
                            onClick={() => setSection('cours')}
                            className="text-left text-red-600 underline underline-offset-2 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {report.message}
                          </button>
                        ) : (
                          <span className="text-olive">Complet, aucun doublon.</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {weekAudit.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-pierre">
                        Aucune classe disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
  )
}
