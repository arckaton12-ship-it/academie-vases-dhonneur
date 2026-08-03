import { useState } from 'react'
import { isSoundEnabled, playClick, toggleSound } from '@/lib/sound'

export function SoundToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled())

  function handleToggle() {
    toggleSound()
    const next = isSoundEnabled()
    setEnabled(next)
    if (next) playClick()
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? 'Désactiver le son' : 'Activer le son'}
      aria-pressed={enabled}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
        enabled
          ? 'border-or/50 bg-or/10 text-bordeaux'
          : 'border-pierre/25 bg-white/60 text-pierre'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        {enabled ? (
          <>
            <path
              d="M16 8.5c1.5 1.5 1.5 5.5 0 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M18.5 6c3 3 3 9 0 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
