import { useMemo } from 'react'

export type MascotMood = 'happy' | 'proud' | 'attentive' | 'welcoming'

interface MascotCompanionProps {
  mood?: MascotMood
  message?: string
  className?: string
  size?: number
  onClick?: () => void
}

const MESSAGES: Record<MascotMood, string[]> = {
  happy: [
    "Prêt pour le cours de cette semaine ?",
    "Continue comme ça, tu progresses bien !",
    "La Parole t'attend avec joie.",
    "Chaque jour est une nouvelle grâce.",
    "Tu es exactly là où Dieu veut que tu sois.",
  ],
  proud: [
    "Bien joué, tu as tenu ta série !",
    "Félicitations, c'est bien mérité !",
    "Ta fidélité porte ses fruits.",
    "Le Seigneur voit ton engagement.",
    "Bravo, tu avances avec force !",
  ],
  attentive: [
    "Ta série t'attend — le cours est là quand tu es prêt.",
    "Pas de pression, mais ta place te manque.",
    "Un petit pas aujourd'hui fait un grand chemin demain.",
    "Ta flamme brille encore, nourris-la !",
    "Prends le temps qu'il faut, je suis là.",
  ],
  welcoming: [
    "Bienvenue dans l'Académie ! Prépare-toi pour une belle aventure.",
    "Que Dieu bénisse ton parcours ici.",
    "Ton voyage spirituel commence maintenant.",
    "Fais comme chez toi, ici on grandit ensemble.",
  ],
}

function getMoodAnimation(mood: MascotMood): string {
  switch (mood) {
    case 'happy':
      return 'animate-[gentleFloat_3s_ease-in-out_infinite]'
    case 'proud':
      return 'animate-[jumpJoy_0.6s_ease-in-out]'
    case 'attentive':
      return 'animate-[softPulse_2s_ease-in-out_infinite]'
    case 'welcoming':
      return 'animate-[waveHand_1.5s_ease-in-out_infinite]'
  }
}

function getMoodColors(mood: MascotMood) {
  switch (mood) {
    case 'happy':
      return { flame: '#D4A017', glow: '#D4A01740', eyes: '#1B6B63' }
    case 'proud':
      return { flame: '#D4A017', glow: '#FFD70060', eyes: '#1B6B63' }
    case 'attentive':
      return { flame: '#E8A317', glow: '#E8A31730', eyes: '#A82A2E' }
    case 'welcoming':
      return { flame: '#D4A017', glow: '#D4A01750', eyes: '#1B6B63' }
  }
}

export function MascotCompanion({
  mood = 'happy',
  message,
  className = '',
  size = 64,
  onClick,
}: MascotCompanionProps) {
  const colors = useMemo(() => getMoodColors(mood), [mood])
  const animClass = useMemo(() => getMoodAnimation(mood), [mood])
  const displayMessage = useMemo(() => {
    if (message) return message
    const msgs = MESSAGES[mood]
    return msgs[Math.floor(Math.random() * msgs.length)]
  }, [mood, message])

  return (
    <div
      className={`relative inline-flex flex-col items-center gap-1 ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Speech bubble */}
      {displayMessage && (
        <div className="relative max-w-[200px] rounded-xl border border-sable/60 bg-white px-3 py-2 text-xs leading-snug text-bordeaux shadow-sm dark:bg-white/10 dark:text-slate-200 dark:border-white/10">
          {displayMessage}
          {/* Bubble arrow */}
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-sable/60 bg-white dark:bg-white/10 dark:border-white/10" />
        </div>
      )}

      {/* Mascot SVG */}
      <div className={`${animClass} cursor-pointer`} style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          {/* Glow */}
          <defs>
            <radialGradient id={`glow-${mood}`} cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor={colors.glow} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="55" r="40" fill={`url(#glow-${mood})`} />

          {/* Flame body */}
          <path
            d="M50 15 C55 30, 72 40, 72 58 C72 75, 60 85, 50 85 C40 85, 28 75, 28 58 C28 40, 45 30, 50 15Z"
            fill={colors.flame}
            className="origin-bottom"
          />
          {/* Inner flame highlight */}
          <path
            d="M50 30 C53 40, 62 46, 62 58 C62 68, 56 74, 50 74 C44 74, 38 68, 38 58 C38 46, 47 40, 50 30Z"
            fill="#FFD700"
            opacity="0.5"
          />

          {/* Eyes */}
          <ellipse cx="42" cy="55" rx="3.5" ry={mood === 'proud' ? 2 : 4} fill={colors.eyes} />
          <ellipse cx="58" cy="55" rx="3.5" ry={mood === 'proud' ? 2 : 4} fill={colors.eyes} />
          {/* Eye shine */}
          <circle cx="43.5" cy="53.5" r="1.2" fill="white" />
          <circle cx="59.5" cy="53.5" r="1.2" fill="white" />

          {/* Mouth */}
          {mood === 'happy' || mood === 'proud' || mood === 'welcoming' ? (
            <path
              d="M44 63 Q50 69 56 63"
              fill="none"
              stroke={colors.eyes}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M44 65 Q50 62 56 65"
              fill="none"
              stroke={colors.eyes}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Blush */}
          {(mood === 'happy' || mood === 'proud') && (
            <>
              <circle cx="36" cy="62" r="3" fill="#E88" opacity="0.3" />
              <circle cx="64" cy="62" r="3" fill="#E88" opacity="0.3" />
            </>
          )}
        </svg>
      </div>
    </div>
  )
}

export function getRandomMoodMessage(mood: MascotMood): string {
  const msgs = MESSAGES[mood]
  return msgs[Math.floor(Math.random() * msgs.length)]
}
