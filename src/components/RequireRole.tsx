import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserRole } from '@/lib/auth'
import { readStoredSession, clearStoredSession, ROLE_CHECK_TIMEOUT_MS } from '@/lib/session'
import { FullResetButton } from '@/components/FullResetButton'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
}

function fetchJson(url: string, token: string, signal?: AbortSignal): Promise<any> {
  return fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal,
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isChangePasswordPage = /\/changer-mot-de-passe$/.test(location.pathname)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), ROLE_CHECK_TIMEOUT_MS)

    setAllowed(null)
    setFailed(false)

    async function check() {
      const session = readStoredSession()
      if (cancelled) return
      if (!session) {
        navigate('/', { replace: true })
        return
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const userId = session.user.id

      try {
        const profiles = await fetchJson(
          `${supabaseUrl}/rest/v1/profiles?select=role,active,must_change_password&id=eq.${userId}&limit=1`,
          session.access_token,
          ac.signal
        )

        if (cancelled) return

        const profile = profiles?.[0]
        if (!profile) {
          navigate('/', { replace: true })
          return
        }
        if (profile.active === false) {
          clearStoredSession()
          if (!cancelled) navigate('/', { replace: true })
          return
        }
        if (!roles.includes(profile.role as UserRole)) {
          navigate('/', { replace: true })
          return
        }
        if (profile.must_change_password && !isChangePasswordPage) {
          const role = profile.role as UserRole
          if (role === 'ADMIN_CLASSE') navigate('/admin-classe/changer-mot-de-passe', { replace: true })
          else navigate('/moderateur/changer-mot-de-passe', { replace: true })
          return
        }

        if (!cancelled) setAllowed(true)
      } catch (error) {
        if (cancelled) return
        // Un abandon signifie que la vérification a dépassé le délai : on ne
        // déconnecte pas l'utilisateur, on lui propose de réessayer.
        if (error instanceof DOMException && error.name === 'AbortError') {
          setFailed(true)
          return
        }
        navigate('/', { replace: true })
      } finally {
        clearTimeout(timer)
      }
    }

    check()

    return () => {
      cancelled = true
      ac.abort()
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChangePasswordPage, attempt])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  const reconnect = useCallback(() => {
    clearStoredSession()
    navigate('/', { replace: true })
  }, [navigate])

  if (allowed === null) {
    if (failed) {
      return (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="glass-panel w-full max-w-sm p-7 text-center">
            <p className="font-display text-lg text-bordeaux dark:text-slate-100">
              La vérification prend trop de temps
            </p>
            <p className="mt-2 text-sm text-pierre dark:text-slate-400">
              Ta connexion est peut-être instable. Tu peux réessayer sans perdre ta session.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={retry}
                className="rounded-full bg-bordeaux px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bordeaux/90 dark:bg-or dark:text-slate-900"
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={reconnect}
                className="glass-pill px-5 py-2.5 text-sm font-medium text-bordeaux dark:text-slate-200"
              >
                Se reconnecter
              </button>
            </div>
            <div className="mt-4 border-t border-white/40 pt-3 dark:border-white/10">
              <FullResetButton />
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-pierre">
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Chargement...
      </div>
    )
  }

  return <>{children}</>
}
