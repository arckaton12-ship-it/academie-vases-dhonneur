import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentProfile, signOut, UserRole } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        // Force refresh session on app load (mobile fix)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.auth.refreshSession()
        }
      } catch {
        // silent fail — will be caught by getCurrentProfile
      }

      try {
        const profile = await getCurrentProfile()
        if (cancelled) return
        if (!profile || !roles.includes(profile.role as UserRole)) {
          navigate('/')
          return
        }
        if (profile.active === false) {
          await signOut().catch(() => undefined)
          if (cancelled) return
          navigate('/')
          return
        }
        setAllowed(true)
      } catch {
        if (!cancelled) navigate('/')
      }
    }

    checkAuth()

    // Listen for auth state changes (token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (!cancelled) navigate('/')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Session refreshed successfully
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [navigate, roles])

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-pierre">
        Vérification de l'accès…
      </div>
    )
  }

  return <>{children}</>
}
