import { useState } from 'react'

const APP_KEYS = ['academie-vh-auth', 'academy_splash_seen', 'app_version', 'theme', 'notif_prompt_dismissed', 'accent_color']

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
      className="rounded-lg bg-turquoise px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-turquoise-fonce disabled:opacity-50"
    >
      {resetting ? 'Réinitialisation...' : 'Réinitialiser et recharger'}
    </button>
  )
}
