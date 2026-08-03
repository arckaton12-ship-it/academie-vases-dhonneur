export interface Quote {
  text: string
  reference: string
}

export const QUOTES: Quote[] = [
  { text: 'Que ta lumière brille devant les hommes, afin qu\u2019ils voient vos bonnes œuvres.', reference: 'Matthieu 5,16' },
  { text: 'Confie à l\u2019Éternel tes œuvres, et tes projets réussiront.', reference: 'Proverbes 16,3' },
  { text: 'Tout ce que ta main trouve à faire, fais-le avec ta force.', reference: 'Ecclésiaste 9,10' },
  { text: 'Instruis l\u2019enfant selon la voie qu\u2019il doit suivre.', reference: 'Proverbes 22,6' },
  { text: 'Celui qui est fidèle dans les moindres choses est fidèle dans les grandes.', reference: 'Luc 16,10' },
  { text: 'La vérité vous rendra libres.', reference: 'Jean 8,32' },
  { text: 'Recherche la sagesse comme de l\u2019argent, et poursuis-la comme un trésor.', reference: 'Proverbes 2,4' },
  { text: 'Heureux ceux qui écoutent la parole de Dieu et qui la mettent en pratique.', reference: 'Luc 11,28' },
  { text: 'Réjouis-toi dans l\u2019espérance, sois patient dans la tribulation, persévère dans la prière.', reference: 'Romains 12,12' },
  { text: 'Car je connais les projets que j\u2019ai formés sur vous, projets de paix et non de malheur.', reference: 'Jérémie 29,11' },
  { text: 'Que la parole de Christ habite parmi vous abondamment.', reference: 'Colossiens 3,16' },
  { text: 'Sois fort et courageux, car l\u2019Éternel, ton Dieu, est avec toi partout où tu iras.', reference: 'Josué 1,9' },
]

export function getQuoteOfDay(date: Date = new Date()): Quote {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}
