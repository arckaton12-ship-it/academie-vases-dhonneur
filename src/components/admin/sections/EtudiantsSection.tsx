import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { toast, toastError } from '@/components/ui/Toast'
import { createConversation } from '@/lib/messaging'
import { deleteStudent } from '@/lib/courses'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function EtudiantsSection() {
  const {
    refreshStudents,
    studentSearch,
    setStudentSearch,
    studentPage,
    setStudentPage,
    studentFilterClass,
    setStudentFilterClass,
    studentSort,
    setStudentSort,
    classes,
    studentTotal,
    paginatedStudents,
    handleAssignClass,
    profileStudentId,
    setProfileStudentId,
    toggleAccess,
    deleteConfirmId,
    setDeleteConfirmId,
    setStudents,
    setSection,
    STUDENT_PAGE_SIZE,
    profileCardRef,
  } = useAdminDashboardContext()

  return (
    <>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Étudiants</CardTitle>
              <CardDescription className="mt-1">
                Gestion complète des étudiants : filtres, notes, messages, suppression.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={refreshStudents}>
              Actualiser
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              value={studentSearch}
              onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1) }}
              placeholder="Rechercher un étudiant…"
              className="max-w-xs"
            />
            <select
              value={studentFilterClass}
              onChange={(e) => { setStudentFilterClass(e.target.value); setStudentPage(1) }}
              className="rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
            >
              <option value="">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={studentSort}
              onChange={(e) => { setStudentSort(e.target.value as 'name' | 'class' | 'date'); setStudentPage(1) }}
              className="rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
            >
              <option value="name">Trier par nom</option>
              <option value="class">Trier par classe</option>
              <option value="date">Trier par date</option>
            </select>
            <span className="text-xs text-pierre">{studentTotal} étudiant{studentTotal > 1 ? 's' : ''}</span>
          </div>

          {paginatedStudents.length === 0 ? (
            <p className="text-sm text-pierre">Aucun étudiant ne correspond aux filtres.</p>
          ) : (
            <>
            <ul className="space-y-3">
              {paginatedStudents.map((s) => (
                <li key={s.id} className="rounded-card border border-pierre/15 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-bordeaux">
                        {s.last_name} {s.first_name}
                      </p>
                      <p className="text-xs text-pierre">
                        {s.email} · {s.class?.name ?? 'Sans classe'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={s.class_id ?? ''}
                        onChange={(e) => handleAssignClass(s.id, e.target.value)}
                        className="rounded-md border border-pierre/30 bg-white px-2 py-1 text-xs text-bordeaux focus-visible:border-or"
                      >
                        <option value="">Sans classe</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        className="!px-3 !py-1 text-xs"
                        onClick={() => setProfileStudentId(profileStudentId === s.id ? null : s.id)}
                      >
                        Fiche
                      </Button>
                      <Button
                        variant="outline"
                        className="!px-3 !py-1 text-xs"
                        onClick={async () => {
                          try {
                            await createConversation(s.id, 'DIRECT')
                            setSection('messagerie')
                            toast('Conversation ouverte.')
                          } catch (e) {
                            toastError(e instanceof Error ? e.message : 'Erreur')
                          }
                        }}
                      >
                        Message
                      </Button>
                      <Button
                        variant={s.active ? 'ghost' : 'primary'}
                        className="!px-3 !py-1 text-xs"
                        onClick={() => toggleAccess(s.id, s.active)}
                      >
                        {s.active ? 'Révoquer' : 'Restaurer'}
                      </Button>
                      {deleteConfirmId === s.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs text-red-700"
                            onClick={async () => {
                              try {
                                await deleteStudent(s.id)
                                setStudents((prev) => prev.filter((x) => x.id !== s.id))
                                toast('Étudiant supprimé.')
                              } catch (e) {
                                toastError(e instanceof Error ? e.message : 'Erreur')
                              }
                              setDeleteConfirmId(null)
                            }}
                          >
                            Confirmer
                          </Button>
                          <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setDeleteConfirmId(null)}>
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs text-red-700"
                          onClick={() => setDeleteConfirmId(s.id)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {studentTotal > STUDENT_PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-pierre">
                  Page {studentPage} / {Math.ceil(studentTotal / STUDENT_PAGE_SIZE)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="!px-3 !py-1 text-xs"
                    disabled={studentPage <= 1}
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  >
                    ← Précédent
                  </Button>
                  <Button
                    variant="outline"
                    className="!px-3 !py-1 text-xs"
                    disabled={studentPage >= Math.ceil(studentTotal / STUDENT_PAGE_SIZE)}
                    onClick={() => setStudentPage((p) => p + 1)}
                  >
                    Suivant →
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </Card>
      {profileStudentId && (
        <div ref={profileCardRef}>
          <StudentProfileCard
            studentId={profileStudentId}
            onClose={() => setProfileStudentId(null)}
          />
        </div>
      )}
    </>
  )
}
