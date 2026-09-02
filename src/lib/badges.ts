export type BadgeKey =
  | 'premiere-semaine'
  | 'premier-mois'
  | 'assidu-huit'
  | 'cinq-resumes'
  | 'dix-resumes'
  | 'cycle-1'
  | 'cycle-2'
  | 'cycle-3'
  | 'cent-xp'
  | 'cinq-cents-xp'
  | 'mille-xp'
  | 'quiz-parfait'
  | 'dix-quiz'
  | 'vingt-quiz'
  | 'presence-parfaite'
  | 'service-actif'
  | 'meditation-dix'
  | 'parole-ancree'

export type GamificationBadgeKey = BadgeKey

export interface BadgeMeta {
  label: string
  description: string
  category: 'attendance' | 'completion' | 'xp' | 'achievement'
}

export const BADGES: Record<BadgeKey, BadgeMeta> = {
  'premiere-semaine': {
    label: 'Première semaine',
    description: 'Tu as ouvert la marche cette semaine.',
    category: 'attendance',
  },
  'premier-mois': {
    label: 'Premier mois',
    description: 'Un mois d\u2019assiduité : la racine prend.',
    category: 'attendance',
  },
  'assidu-huit': {
    label: 'Huit semaines fidèles',
    description: 'Deux mois d\u2019endurance dans la fidélité.',
    category: 'attendance',
  },
  'cinq-resumes': {
    label: 'Cinq résumés',
    description: 'Tu médites ce que tu écoutes.',
    category: 'completion',
  },
  'dix-resumes': {
    label: 'Dix résumés',
    description: 'La Parole s\u2019ancre en toi.',
    category: 'completion',
  },
  'cycle-1': {
    label: 'Cycle un accompli',
    description: 'Classe 1 menée à son terme.',
    category: 'completion',
  },
  'cycle-2': {
    label: 'Cycle deux accompli',
    description: 'Classe 2 menée à son terme.',
    category: 'completion',
  },
  'cycle-3': {
    label: 'Cycle trois accompli',
    description: 'Classe 3 menée à son terme.',
    category: 'completion',
  },
  'cent-xp': {
    label: 'Initié',
    description: '100 points d\u2019expérience accumulés.',
    category: 'xp',
  },
  'cinq-cents-xp': {
    label: 'Apprenti confirmé',
    description: '500 points d\u2019expérience accumulés.',
    category: 'xp',
  },
  'mille-xp': {
    label: 'Maître étudiant',
    description: '1000 points d\u2019expérience accumulés.',
    category: 'xp',
  },
  'quiz-parfait': {
    label: 'Quiz parfait',
    description: 'Un quiz réussi sans aucune erreur.',
    category: 'achievement',
  },
  'dix-quiz': {
    label: 'Dix quiz réussis',
    description: 'Dix quiz validés avec succès.',
    category: 'achievement',
  },
  'vingt-quiz': {
    label: 'Vingt quiz réussis',
    description: 'Vingt quiz validés. Une mémoire solide.',
    category: 'achievement',
  },
  'presence-parfaite': {
    label: 'Présence parfaite',
    description: 'Aucune absence sur une semaine complète.',
    category: 'attendance',
  },
  'service-actif': {
    label: 'Service actif',
    description: 'Cinq participations au service.',
    category: 'achievement',
  },
  'meditation-dix': {
    label: 'Dix méditations',
    description: 'Dix méditations enregistrées. La Parole vit en toi.',
    category: 'achievement',
  },
  'parole-ancree': {
    label: 'Parole ancrée',
    description: 'Vingt résumés de méditation écrits.',
    category: 'completion',
  },
}

export const BADGE_ORDER: BadgeKey[] = [
  'premiere-semaine',
  'premier-mois',
  'assidu-huit',
  'presence-parfaite',
  'cinq-resumes',
  'dix-resumes',
  'parole-ancree',
  'quiz-parfait',
  'dix-quiz',
  'vingt-quiz',
  'service-actif',
  'meditation-dix',
  'cent-xp',
  'cinq-cents-xp',
  'mille-xp',
  'cycle-1',
  'cycle-2',
  'cycle-3',
]

export function isBadgeKey(value: string): value is BadgeKey {
  return value in BADGES
}

export function getBadgesByCategory(category: BadgeMeta['category']): BadgeKey[] {
  return BADGE_ORDER.filter(key => BADGES[key].category === category)
}
