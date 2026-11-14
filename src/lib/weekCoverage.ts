/**
 * Contrôle de couverture des semaines de cours.
 *
 * Objectif métier : aucune classe ne doit « sauter » une semaine sans que
 * l'administration le voie. Ces fonctions sont pures, donc testables sans
 * base de données ni réseau.
 */

export interface WeekEntry {
  week: number
  title?: string | null
}

export interface WeekCoverageOptions {
  /** Première semaine attendue (1 par défaut). */
  expectedStart?: number
  /** Dernière semaine attendue. Si absente, la dernière semaine trouvée. */
  expectedEnd?: number
}

export interface WeekGap {
  /** Première semaine manquante de la plage. */
  start: number
  /** Dernière semaine manquante de la plage. */
  end: number
  /** Toutes les semaines manquantes. */
  weeks: number[]
}

export interface WeekCoverageReport {
  /** Semaines valides, triées et dédoublonnées. */
  weeks: number[]
  /** Semaines manquantes dans la plage attendue. */
  missing: number[]
  /** Plages contiguës de semaines manquantes, plus lisibles à l'écran. */
  gaps: WeekGap[]
  /** Semaines présentes plusieurs fois (doublon de données). */
  duplicates: number[]
  /** Vrai si aucun cours n'est enregistré. */
  empty: boolean
  /** Message prêt à afficher, ou null si tout va bien. */
  message: string | null
}

function normalizeWeeks(entries: WeekEntry[]): number[] {
  const seen = new Set<number>()
  for (const entry of entries) {
    const week = Number(entry?.week)
    if (Number.isInteger(week) && week > 0) seen.add(week)
  }
  return Array.from(seen).sort((a, b) => a - b)
}

function collectDuplicates(entries: WeekEntry[]): number[] {
  const counts = new Map<number, number>()
  for (const entry of entries) {
    const week = Number(entry?.week)
    if (!Number.isInteger(week) || week <= 0) continue
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([week]) => week)
    .sort((a, b) => a - b)
}

/** Regroupe des semaines manquantes en plages contiguës : [3,4,7] → 3-4, 7. */
export function groupWeeksIntoGaps(weeks: number[]): WeekGap[] {
  const sorted = Array.from(new Set(weeks.filter((w) => Number.isInteger(w) && w > 0))).sort(
    (a, b) => a - b
  )
  const gaps: WeekGap[] = []
  for (const week of sorted) {
    const last = gaps[gaps.length - 1]
    if (last && week === last.end + 1) {
      last.end = week
      last.weeks.push(week)
    } else {
      gaps.push({ start: week, end: week, weeks: [week] })
    }
  }
  return gaps
}

/** « Semaine 3 », « Semaines 3 à 5 », « Semaines 2, 4 et 7 ». */
export function formatMissingWeeks(weeks: number[]): string {
  const gaps = groupWeeksIntoGaps(weeks)
  if (gaps.length === 0) return ''
  const parts = gaps.map((gap) =>
    gap.start === gap.end ? `semaine ${gap.start}` : `semaines ${gap.start} à ${gap.end}`
  )
  return parts.join(', ')
}

/**
 * Audit complet d'une classe : trous au milieu, début tardif, doublons.
 * `expectedStart` vaut 1 par défaut : une classe qui commence en semaine 4
 * est signalée comme incomplète à partir de la semaine 1.
 */
export function auditWeekCoverage(
  entries: WeekEntry[],
  options: WeekCoverageOptions = {}
): WeekCoverageReport {
  const expectedStart = options.expectedStart ?? 1
  const weeks = normalizeWeeks(entries)
  const empty = weeks.length === 0

  if (empty) {
    return {
      weeks: [],
      missing: [],
      gaps: [],
      duplicates: [],
      empty: true,
      message: 'Aucun cours enregistré pour cette classe.',
    }
  }

  const lastPresent = weeks[weeks.length - 1]
  const expectedEnd = options.expectedEnd ?? lastPresent
  const from = Math.max(1, Math.min(expectedStart, weeks[0]))
  const missing: number[] = []

  for (let week = from; week <= expectedEnd; week += 1) {
    if (!weeks.includes(week)) missing.push(week)
  }

  const duplicates = collectDuplicates(entries)
  const gaps = groupWeeksIntoGaps(missing)

  const messages: string[] = []
  if (missing.length > 0) messages.push(`Semaines sans cours : ${formatMissingWeeks(missing)}.`)
  if (duplicates.length > 0) {
    messages.push(
      `Semaine${duplicates.length > 1 ? 's' : ''} en double : ${duplicates.join(', ')}.`
    )
  }

  return {
    weeks,
    missing,
    gaps,
    duplicates,
    empty: false,
    message: messages.length > 0 ? messages.join(' ') : null,
  }
}

/** Audit par classe, à partir d'une liste de cours portant un `class_id`. */
export function auditWeekCoverageByClass<T extends WeekEntry & { class_id?: string | null }>(
  classes: { id: string; name: string }[],
  courses: T[],
  options: WeekCoverageOptions = {}
): { id: string; name: string; report: WeekCoverageReport }[] {
  return classes.map((classe) => ({
    id: classe.id,
    name: classe.name,
    report: auditWeekCoverage(
      courses.filter((course) => course.class_id === classe.id),
      options
    ),
  }))
}
