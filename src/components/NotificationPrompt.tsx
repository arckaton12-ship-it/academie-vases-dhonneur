import { useState, useEffect } from 'react'
import { isPushSupported, registerPushAfterConsent } from '@/lib/pushNotifications'
import { getSafeSession } from '@/lib/auth'

const DISMISSED_KEY = 'notif_prompt_dismissed'
const SHOWN_KEY = 'notif_prompt_shown'

export function NotificationPrompt() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!(await isPushSupported())) return
      if (cancelled || localStorage.getItem(DISMISSED_KEY)) return
      if (Notification.permission !== 'default') return
      if (sessionStorage.getItem(SHOWN_KEY)) return

      const timer = setTimeout(() => {
        if (!cancelled) {
          setShow(true)
          sessionStorage.setItem(SHOWN_KEY, '1')
        }
      }, 5000)

      return () => clearTimeout(timer)
    })()
    return () => { cancelled = true }
  }, [])

  const handleActivate = async () => {
    setLoading(true)
    try {
      const session = getSafeSession()
      if (session) {
        await registerPushAfterConsent(session.user.id)
      }
    } catch {
      // silent fail
    }
    setShow(false)
    setLoading(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-40 w-72 -translate-x-1/2 animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-teal/30 bg-white p-4 shadow-xl dark:bg-slate-800 dark:border-teal/20">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 p-1 text-pierre/40 hover:text-pierre dark:text-slate-400"
        >
          ✕
        </button>
        <div className="mb-2 text-center text-sm font-medium text-bordeaux dark:text-slate-200">
          Ne manque rien !
        </div>
        <p className="mb-3 text-center text-xs text-pierre dark:text-slate-400">
          Active les notifications pour être averti des nouveaux messages, devoirs et badges.
        </p>
        <button
          onClick={handleActivate}
          disabled={loading}
          className="w-full rounded-xl bg-teal py-2 text-sm font-semibold text-white transition-all hover:bg-teal/90 disabled:opacity-50"
        >
          {loading ? 'Activation...' : 'Activer'}
        </button>
      </div>
    </div>
  )
}
