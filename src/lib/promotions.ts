/**
 * Promotions (cohortes) et statut des étudiants.
 *
 * L'Académie ne stocke pas encore de table de promotions. La promotion d'un
 * étudiant est donc déduite de sa date d'inscription (`created_at`), qui ne
 * change jamais, même quand l'élève monte de classe. C'est ce qui permet de
 * distinguer les promotions successives et de retrouver les anciens élèves.
 */

/** Mois (0-indexé) où bascule l'année académique : juillet. */
export const ACADEMIC_YEAR_START_MONTH = 6

export interface PromotionInfo {
  /** Année de début, ex. 2026 pour 2026–2027. */
  year: number
  /** Libellé long, ex. « Promotion 2026–2027 ». */
  label: string
  /** Libellé court, ex. « 2026–2027 ». */
  shortLabel: string
  /** Vrai si c'est la promotion en cours. */
  isCurrent: boolean
}

export type StudentStatus = 'ACTIF' | 'DIPLOME' | 'ARCHIVE' | 'SANS_CLASSE'

export function academicYearStart(date: Date): number {
  const year = date.getUTCFullYear()
  return date.getUTCMonth() >= ACADEMIC_YEAR_START_MONTH ? year : year - 1
}

export function currentAcademicYear(now: Date = new Date()): number {
  return academicYearStart(now)
}

/** Promotion qui s'ouvrira à la prochaine bascule du 1er juillet. */
export function nextPromotion(now: Date = new Date()): PromotionInfo {
  const year = currentAcademicYear(now) + 1
  return {
    year,
    label: promotionLabel(year),
    shortLabel: `${year}–${year + 1}`,
    isCurrent: false,
  }
}

export function promotionLabel(year: number): string {
  return `Promotion ${year}–${year + 1}`
}

export function promotionFromDate(
  createdAt: string | null | undefined,
  now: Date = new Date()
): PromotionInfo | null {
  if (!createdAt) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  const year = academicYearStart(date)
  return {
    year,
    label: promotionLabel(year),
    shortLabel: `${year}–${year + 1}`,
    isCurrent: year === currentAcademicYear(now),
  }
}

export interface StudentLike {
  active?: boolean | null
  class?: { level?: number | null } | null
}

export interface ClassLike {
  name: string
  level: number
}

/**
 * Niveau de la classe de graduation : classe explicitement nommée
 * Graduation/Diplôme, sinon niveau 4 ou plus. Sans une telle classe, il n'y
 * a pas d'anciens élèves diplômés (Classe 3 ne doit pas compter comme diplôme).
 */
export function graduationLevelFor(classes: ClassLike[]): number | null {
  const named = classes.find((c) => /graduation|dipl[oô]me/i.test(c.name))
  if (named) return named.level
  const max = classes.length ? Math.max(...classes.map((c) => c.level)) : null
  return max !== null && max >= 4 ? max : null
}

/**
 * Statut lisible d'un étudiant.
 * - DIPLOME : a atteint la classe de graduation (niveau le plus élevé).
 * - ARCHIVE : accès révoqué par l'administration.
 * - SANS_CLASSE : inscrit mais pas encore affecté.
 * - ACTIF : suit normalement son parcours.
 */
export function studentStatus(
  student: StudentLike,
  graduationLevel: number | null = null
): StudentStatus {
  const level = student.class?.level ?? null
  if (level !== null && graduationLevel !== null && level >= graduationLevel) return 'DIPLOME'
  if (student.active === false) return 'ARCHIVE'
  if (level === null) return 'SANS_CLASSE'
  return 'ACTIF'
}

export function studentStatusLabel(status: StudentStatus): string {
  switch (status) {
    case 'DIPLOME':
      return 'Diplômé'
    case 'ARCHIVE':
      return 'Archivé'
    case 'SANS_CLASSE':
      return 'Sans classe'
    default:
      return 'Actif'
  }
}

/** Un ancien élève est un diplômé ou un compte archivé. */
export function isAlumni(status: StudentStatus): boolean {
  return status === 'DIPLOME' || status === 'ARCHIVE'
}

export const STUDENT_STATUS_OPTIONS: { value: StudentStatus | 'ANCIENS'; label: string }[] = [
  { value: 'ACTIF', label: 'Actifs' },
  { value: 'ANCIENS', label: 'Anciens élèves' },
  { value: 'SANS_CLASSE', label: 'Sans classe' },
  { value: 'ARCHIVE', label: 'Comptes archivés' },
]

/** Liste des promotions présentes, la plus récente d'abord. */
export function buildPromotionOptions(
  students: { created_at?: string | null }[],
  now: Date = new Date()
): PromotionInfo[] {
  const byYear = new Map<number, PromotionInfo>()
  for (const student of students) {
    const promotion = promotionFromDate(student.created_at, now)
    if (promotion) byYear.set(promotion.year, promotion)
  }
  return [...byYear.values()].sort((a, b) => b.year - a.year)
}
