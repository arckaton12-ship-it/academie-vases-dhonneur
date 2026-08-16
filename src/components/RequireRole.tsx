import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { UserRole } from '@/lib/auth'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const checkAuth = async (attempt = 0) => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return

        if (!session) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000))
            if (!cancelled) return checkAuth(attempt + 1)
          }
          navigate('/', { replace: true })
          return
        }

        // Session exists — try to verify role from profiles table
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, active')
            .eq('id', session.user.id)
            .single()

          if (cancelled) return

          if (!profile) {
            navigate('/', { replace: true })
            return
          }
          if (profile.active === false) {
            await supabase.auth.signOut().catch(() => undefined)
            if (cancelled) return
            navigate('/', { replace: true })
            return
          }
          if (!roles.includes(profile.role as UserRole)) {
            navigate('/', { replace: true })
            return
          }
        } catch {
          navigate('/', { replace: true })
          return
        }

        setAllowed(true)
      } catch {
        if (!cancelled) navigate('/', { replace: true })
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-pierre">
        <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Chargement...
      </div>
    )
  }

  return <>{children}</>
}
