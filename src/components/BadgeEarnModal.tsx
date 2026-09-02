import { useEffect, useState, useCallback } from 'react'
import { BadgeCoin } from '@/components/Badge'
import { BADGES, isBadgeKey } from '@/lib/badges'
import { playSuccess } from '@/lib/sound'

interface BadgeEarnModalProps {
  badgeType: string
  onClose: () => void
}

const CONFETTI_COLORS = ['#CFAF5B', '#5D2A41', '#8A9A5B', '#FFD700', '#B76E79', '#F8F4E9']

function ConfettiParticle({ index, color }: { index: number; color: string }) {
  const left = Math.random() * 100
  const delay = Math.random() * 0.6
  const duration = 1.5 + Math.random() * 1.5
  const rotate = Math.random() * 720 - 360
  const drift = (Math.random() - 0.5) * 200
  const size = 6 + Math.random() * 8

  return (
    <div
      className="pointer-events-none fixed z-[210]"
      style={{
        left: `${left}%`,
        top: '-10px',
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        borderRadius: size > 10 ? '50%' : '2px',
        animation: `confettiFall ${duration}s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg) scale(1); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateY(100vh) translateX(${drift}px) rotate(${rotate}deg) scale(0.3); }
        }
      `}</style>
    </div>
  )
}

export function BadgeEarnModal({ badgeType, onClose }: BadgeEarnModalProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const meta = isBadgeKey(badgeType) ? BADGES[badgeType] : null

  const handleClose = useCallback(() => {
    setDismissed(true)
    setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    playSuccess()
    const enterTimer = setTimeout(() => setVisible(true), 50)
    const autoClose = setTimeout(handleClose, 4500)
    return () => { clearTimeout(enterTimer); clearTimeout(autoClose) }
  }, [handleClose])

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${
        visible && !dismissed ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Confetti particles */}
      {visible && !dismissed && Array.from({ length: 40 }).map((_, i) => (
        <ConfettiParticle key={i} index={i} color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} />
      ))}

      {/* Backdrop */}
      <div className={`absolute inset-0 bg-bordeaux/30 backdrop-blur-sm transition-opacity duration-300 ${dismissed ? 'opacity-0' : 'opacity-100'}`} />

      {/* Modal */}
      <div
        className={`relative z-10 mx-4 flex max-w-sm flex-col items-center rounded-2xl border-2 border-or/40 bg-parchemin px-8 py-10 text-center shadow-2xl transition-all duration-500 dark:bg-slate-800 ${
          visible && !dismissed ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-or/20 to-or/5 blur-sm" />

        {/* Badge */}
        <div className="badge-pop relative z-10 mb-4">
          <BadgeCoin type={badgeType} size={96} />
        </div>

        {/* Text */}
        <h3 className="relative z-10 font-display text-xl font-bold text-bordeaux dark:text-or">
          Badge débloqué !
        </h3>
        <p className="relative z-10 mt-2 text-sm font-semibold text-bordeaux/80 dark:text-slate-200">
          {meta?.label ?? badgeType}
        </p>
        {meta && (
          <p className="relative z-10 mt-1 text-xs text-pierre dark:text-slate-400">
            {meta.description}
          </p>
        )}

        {/* Tap to dismiss */}
        <p className="relative z-10 mt-6 text-[10px] text-pierre/50 dark:text-slate-500">
          Appuie pour fermer
        </p>
      </div>
    </div>
  )
}
