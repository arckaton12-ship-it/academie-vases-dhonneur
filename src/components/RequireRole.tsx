import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRole } from '@/lib/auth'
import { FullResetButton } from '@/components/FullResetButton'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
}

const STORAGE_KEY = 'academie-vh-auth'

interface StoredSession {
  access_token: string
  user: { id: string }
}

function readSessionFromStorage(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const current = parsed?.current ?? parsed
    if (current?.access_token && current?.user?.id) return current as StoredSession
    return null
  } catch {
    return null
  }
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
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 10000)
    const timeoutTimer = setTimeout(() => {
      if (!cancelled) setTimedOut(true)
    }, 8000)

    async function check() {
      const session = readSessionFromStorage()
      if (cancelled || !session) {
        if (!cancelled) navigate('/', { replace: true })
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
          localStorage.removeItem(STORAGE_KEY)
          if (!cancelled) navigate('/', { replace: true })
          return
        }
        if (!roles.includes(profile.role as UserRole)) {
          navigate('/', { replace: true })
          return
        }
        if (profile.must_change_password) {
          const role = profile.role as UserRole
          if (role === 'ADMIN_CLASSE') navigate('/admin-classe/changer-mot-de-passe', { replace: true })
          else navigate('/moderateur/changer-mot-de-passe', { replace: true })
          return
        }

        if (!cancelled) setAllowed(true)
      } catch {
        if (!cancelled) navigate('/', { replace: true })
      }
    }

    check()

    return () => {
      cancelled = true
      ac.abort()
      clearTimeout(timer)
      clearTimeout(timeoutTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (allowed === null) {
    if (timedOut) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center p-8">
            <p className="text-sm text-pierre mb-4">Le chargement prend plus de temps que prévu.</p>
            <FullResetButton />
          </div>
        </div>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-pierre">
        <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Chargement...
      </div>
    )
  }

  return <>{children}</>
}
