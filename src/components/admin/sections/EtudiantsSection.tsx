import { useMemo, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { toast, toastError } from '@/components/ui/Toast'
import { createConversation } from '@/lib/messaging'
import { deleteStudent } from '@/lib/courses'
import {
  buildPromotionOptions,
  isAlumni,
  nextPromotion,
  promotionFromDate,
  studentStatus,
  studentStatusLabel,
  STUDENT_STATUS_OPTIONS,
  type StudentStatus,
} from '@/lib/promotions'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

const STATUS_STYLES: Record<StudentStatus, string> = {
  ACTIF: 'border-teal/25 bg-teal/10 text-bordeaux dark:border-teal/40 dark:bg-teal/15 dark:text-\[#BFE8E2\]',
  DIPLOME: 'border-or/35 bg-or/10 text-or-texte dark:border-or/30 dark:bg-or/15 dark:text-or',
  ARCHIVE: 'border-pierre/20 bg-pierre/5 text-pierre dark:border-white/10 dark:bg-white/5 dark:text-slate-400',
  SANS_CLASSE: 'border-sable/50 bg-sable/15 text-[#8a5a2b] dark:border-sable/20 dark:bg-sable/10 dark:text-sable',
}

function initials(first: string, last: string) {
  return `${(first || '').trim().charAt(0)}${(last || '').trim().charAt(0)}`.toUpperCase() || '?'
}

function displayName(first: string, last: string, email: string) {
  const full = `${last ?? ''} ${first ?? ''}`.trim()
  return full || email.split('@')[0] || 'Étudiant sans nom'
}

function StatusPill({ status }: { status: StudentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {studentStatusLabel(status)}
    </span>
  )
}

export function EtudiantsSection() {
  const {
    refreshStudents,
    studentSearch,
    setStudentSearch,
    studentPage,
    setStudentPage,
    studentFilterClass,
    setStudentFilterClass,
    studentFilterPromotion,
    setStudentFilterPromotion,
    studentFilterStatus,
    setStudentFilterStatus,
    studentSort,
    setStudentSort,
    classes,
    graduationLevel,
    students,
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

  const [filtersOpen, setFiltersOpen] = useState(false)

  const promotions = useMemo(() => buildPromotionOptions(students), [students])

  const counts = useMemo(() => {
    let actifs = 0
    let anciens = 0
    let sansClasse = 0
    for (const s of students) {
      const status = studentStatus(s, graduationLevel)
      if (status === 'ACTIF') actifs += 1
      if (isAlumni(status)) anciens += 1
      if (status === 'SANS_CLASSE') sansClasse += 1
    }
    return { actifs, anciens, sansClasse }
  }, [students, graduationLevel])

  const hasFilters = Boolean(
    studentSearch || studentFilterClass || studentFilterPromotion || studentFilterStatus
  )

  const resetFilters = () => {
    setStudentSearch('')
    setStudentFilterClass('')
    setStudentFilterPromotion('')
    setStudentFilterStatus('')
    setStudentPage(1)
  }

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Base étudiants</CardTitle>
            <CardDescription className="mt-1">
              {studentTotal} étudiant{studentTotal > 1 ? 's' : ''} affiché{studentTotal > 1 ? 's' : ''}
              {hasFilters ? ' selon tes filtres' : ' au total'} · {promotions.length} promotion
              {promotions.length > 1 ? 's' : ''} · prochaine promo {nextPromotion().shortLabel}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refreshStudents}>
            Actualiser
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-pierre/12 bg-white/55 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
            <p className="text-lg font-semibold text-bordeaux dark:text-slate-100">{students.length}</p>
            <p className="text-[11px] text-pierre dark:text-slate-400">Inscrits</p>
          </div>
          <div className="rounded-xl border border-teal/20 bg-teal/5 px-3 py-2.5 dark:border-teal/30 dark:bg-teal/10">
            <p className="text-lg font-semibold text-bordeaux dark:text-\[#BFE8E2\]">{counts.actifs}</p>
            <p className="text-[11px] text-pierre dark:text-slate-400">Actifs</p>
          </div>
          <div className="rounded-xl border border-or/25 bg-or/5 px-3 py-2.5 dark:border-or/20 dark:bg-or/10">
            <p className="text-lg font-semibold text-or-texte dark:text-or">{counts.anciens}</p>
            <p className="text-[11px] text-pierre dark:text-slate-400">Anciens élèves</p>
          </div>
          <div className="rounded-xl border border-pierre/12 bg-white/55 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
            <p className="text-lg font-semibold text-bordeaux dark:text-slate-100">{counts.sansClasse}</p>
            <p className="text-[11px] text-pierre dark:text-slate-400">Sans classe</p>
          </div>
        </div>

        {/* Recherche + filtres */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Input
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                setStudentPage(1)
              }}
              placeholder="Rechercher un nom ou un email…"
              aria-label="Rechercher un étudiant"
              className="w-full pr-8"
            />
            {studentSearch && (
              <button
                type="button"
                onClick={() => {
                  setStudentSearch('')
                  setStudentPage(1)
                }}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-pierre hover:bg-pierre/10 hover:text-bordeaux"
              >
                ×
              </button>
            )}
          </div>
          <select
            value={studentFilterClass}
            onChange={(e) => {
              setStudentFilterClass(e.target.value)
              setStudentPage(1)
            }}
            aria-label="Filtrer par classe"
            className="rounded-lg border border-pierre/25 bg-white/70 px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="rounded-lg border border-pierre/25 bg-white/70 px-3 py-2 text-sm font-medium text-bordeaux transition-colors hover:border-or/50 focus-visible:border-or focus-visible:outline-none"
          >
            Plus de filtres
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-pierre underline-offset-2 hover:text-bordeaux hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="mt-2 grid gap-2 rounded-xl border border-pierre/12 bg-white/40 p-3 sm:grid-cols-3 dark:border-white/10 dark:bg-white/5">
            <label className="block text-xs font-medium text-pierre dark:text-slate-400">
              Promotion
              <select
                value={studentFilterPromotion}
                onChange={(e) => {
                  setStudentFilterPromotion(e.target.value)
                  setStudentPage(1)
                }}
                className="mt-1 w-full rounded-lg border border-pierre/25 bg-white/80 px-2.5 py-1.5 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              >
                <option value="">Toutes les promotions</option>
                {promotions.map((p) => (
                  <option key={p.year} value={p.shortLabel}>
                    {p.label}
                    {p.isCurrent ? ' (en cours)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-pierre dark:text-slate-400">
              Statut
              <select
                value={studentFilterStatus}
                onChange={(e) => {
                  setStudentFilterStatus(e.target.value as '' | StudentStatus | 'ANCIENS')
                  setStudentPage(1)
                }}
                className="mt-1 w-full rounded-lg border border-pierre/25 bg-white/80 px-2.5 py-1.5 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              >
                <option value="">Tous les statuts</option>
                {STUDENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-pierre dark:text-slate-400">
              Trier par
              <select
                value={studentSort}
                onChange={(e) => {
                  setStudentSort(e.target.value as 'name' | 'class' | 'date')
                  setStudentPage(1)
                }}
                className="mt-1 w-full rounded-lg border border-pierre/25 bg-white/80 px-2.5 py-1.5 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              >
                <option value="name">Nom</option>
                <option value="class">Classe</option>
                <option value="date">Date d’inscription</option>
              </select>
            </label>
          </div>
        )}

        {paginatedStudents.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-pierre/20 px-4 py-10 text-center dark:border-white/10">
            <p className="text-sm font-medium text-bordeaux dark:text-slate-200">
              Aucun étudiant ne correspond à ces filtres.
            </p>
            <p className="mt-1 text-xs text-pierre dark:text-slate-400">
              Essaie une autre classe, une autre promotion ou efface la recherche.
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-3" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto md:overflow-x-visible">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm md:min-w-0">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-pierre dark:text-slate-400">
                    <th className="px-2 py-2 font-medium">Étudiant</th>
                    <th className="px-2 py-2 font-medium">Classe</th>
                    <th className="px-2 py-2 font-medium">Promotion</th>
                    <th className="px-2 py-2 font-medium">Statut</th>
                    <th className="px-2 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((s) => {
                    const status = studentStatus(s, graduationLevel)
                    const promotion = promotionFromDate(s.created_at)
                    const rowBusy = deleteConfirmId === s.id
                    return (
                      <tr
                        key={s.id}
                        className="border-t border-pierre/10 align-middle transition-colors hover:bg-white/40 dark:border-white/10 dark:hover:bg-white/5"
                      >
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bordeaux/10 text-xs font-semibold text-bordeaux dark:bg-teal/20 dark:text-\[#BFE8E2\]">
                              {initials(s.first_name, s.last_name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium leading-tight text-bordeaux dark:text-slate-100">
                                {displayName(s.first_name, s.last_name, s.email)}
                              </p>
                              <p className="truncate text-xs text-pierre dark:text-slate-400">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <select
                            value={s.class_id ?? ''}
                            onChange={(e) => handleAssignClass(s.id, e.target.value)}
                            aria-label={`Classe de ${displayName(s.first_name, s.last_name, s.email)}`}
                            className="max-w-[150px] rounded-lg border border-pierre/20 bg-white/70 px-2 py-1 text-xs text-bordeaux focus-visible:border-or focus-visible:outline-none"
                          >
                            <option value="">Sans classe</option>
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          {promotion ? (
                            <span className="inline-flex flex-col">
                              <span className="text-xs font-medium text-bordeaux dark:text-slate-200">
                                {promotion.shortLabel}
                              </span>
                              <span className="text-[10px] text-pierre dark:text-slate-400">
                                {promotion.isCurrent ? 'En cours' : 'Ancienne'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-pierre">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <StatusPill status={status} />
                        </td>
                        <td className="px-2 py-3">
                          {rowBusy ? (
                            <div className="flex items-center justify-end gap-1">
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
                              <Button
                                variant="ghost"
                                className="!px-2 !py-1 text-xs"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                className="!px-2.5 !py-1 text-xs"
                                onClick={() => setProfileStudentId(profileStudentId === s.id ? null : s.id)}
                              >
                                Fiche
                              </Button>
                              <button
                                type="button"
                                title="Envoyer un message"
                                aria-label={`Envoyer un message à ${displayName(s.first_name, s.last_name, s.email)}`}
                                onClick={async () => {
                                  try {
                                    await createConversation(s.id, 'DIRECT')
                                    setSection('messagerie')
                                    toast('Conversation ouverte.')
                                  } catch (e) {
                                    toastError(e instanceof Error ? e.message : 'Erreur')
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-pierre/20 text-pierre transition-colors hover:border-or/50 hover:text-or"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                title={s.active ? 'Révoquer l’accès' : 'Restaurer l’accès'}
                                aria-label={`${s.active ? 'Révoquer' : 'Restaurer'} l’accès de ${displayName(s.first_name, s.last_name, s.email)}`}
                                onClick={() => toggleAccess(s.id, s.active)}
                                className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                                  s.active
                                    ? 'border-pierre/20 text-pierre hover:border-or/50 hover:text-or'
                                    : 'border-teal/40 bg-teal/10 text-bordeaux'
                                }`}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  {s.active ? (
                                    <>
                                      <rect x="3" y="11" width="18" height="11" rx="2" />
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </>
                                  ) : (
                                    <>
                                      <rect x="3" y="11" width="18" height="11" rx="2" />
                                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                    </>
                                  )}
                                </svg>
                              </button>
                              <button
                                type="button"
                                title="Supprimer l’étudiant"
                                aria-label={`Supprimer ${displayName(s.first_name, s.last_name, s.email)}`}
                                onClick={() => setDeleteConfirmId(s.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-pierre/20 text-pierre transition-colors hover:border-red-400/60 hover:text-red-700"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {studentTotal > STUDENT_PAGE_SIZE && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-pierre dark:text-slate-400">
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
