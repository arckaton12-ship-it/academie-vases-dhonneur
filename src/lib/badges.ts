export type BadgeKey =
  | 'premiere-semaine'
  | 'premier-mois'
  | 'assidu-huit'
  | 'cinq-resumes'
  | 'dix-resumes'
  | 'cycle-1'
  | 'cycle-2'
  | 'cycle-3'

export interface BadgeMeta {
  label: string
  description: string
}

export const BADGES: Record<BadgeKey, BadgeMeta> = {
  'premiere-semaine': {
    label: 'Première semaine',
    description: 'Tu as ouvert la marche cette semaine.',
  },
  'premier-mois': {
    label: 'Premier mois',
    description: 'Un mois d\u2019assiduité : la racine prend.',
  },
  'assidu-huit': {
    label: 'Huit semaines fidèles',
    description: 'Deux mois d\u2019endurance dans la fidélité.',
  },
  'cinq-resumes': {
    label: 'Cinq résumés',
    description: 'Tu médites ce que tu écoutes.',
  },
  'dix-resumes': {
    label: 'Dix résumés',
    description: 'La Parole s\u2019ancre en toi.',
  },
  'cycle-1': {
    label: 'Cycle un accompli',
    description: 'Classe 1 menée à son terme.',
  },
  'cycle-2': {
    label: 'Cycle deux accompli',
    description: 'Classe 2 menée à son terme.',
  },
  'cycle-3': {
    label: 'Cycle trois accompli',
    description: 'Classe 3 menée à son terme.',
  },
}

export const BADGE_ORDER: BadgeKey[] = [
  'premiere-semaine',
  'premier-mois',
  'assidu-huit',
  'cinq-resumes',
  'dix-resumes',
  'cycle-1',
  'cycle-2',
  'cycle-3',
]

export function isBadgeKey(value: string): value is BadgeKey {
  return value in BADGES
}
