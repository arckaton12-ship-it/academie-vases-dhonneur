import { useState } from 'react'
import { AUTH_STORAGE_KEY } from '@/lib/session'

const APP_KEYS = [AUTH_STORAGE_KEY, 'academy_splash_seen', 'app_version', 'theme', 'notif_prompt_dismissed', 'accent_color']

async function fullReset() {
  // 1. Unregister all Service Workers
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    } catch { /* ignore */ }
  }

  // 2. Delete all caches
  if ('caches' in window) {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    } catch { /* ignore */ }
  }

  // 3. Clear app-related localStorage
  try {
    APP_KEYS.forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }

  // 4. Hard redirect to landing
  window.location.href = '/'
}

export function FullResetButton() {
  const [resetting, setResetting] = useState(false)

  return (
    <button
      disabled={resetting}
      onClick={() => {
        setResetting(true)
        fullReset()
      }}
      className="text-xs font-medium text-pierre underline underline-offset-2 transition-colors hover:text-bordeaux disabled:opacity-50 dark:text-slate-500 dark:hover:text-or"
    >
      {resetting ? 'Réinitialisation...' : 'Réinitialiser l’application'}
    </button>
  )
}
