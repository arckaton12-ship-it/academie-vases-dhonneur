import { useState, useCallback } from 'react'

export function useLoadingState(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      return result
    } catch (e: any) {
      const msg = e?.message || 'Une erreur est survenue.'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, withLoading, setLoading, setError }
}
