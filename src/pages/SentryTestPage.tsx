import { useEffect } from 'react'

export function SentryTestPage() {
  useEffect(() => {
    if (!localStorage.getItem('sentry_test_done')) {
      localStorage.setItem('sentry_test_done', '1')
      throw new Error('[TEST SENTRY] Erreur volontaire pour tester le monitoring — OK si elle apparait dans Sentry')
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-lg font-bold mb-2">Test Sentry</h1>
        <p className="text-sm text-pierre">
          {localStorage.getItem('sentry_test_done')
            ? "Erreur deja envoyee. Verifie ton dashboard Sentry."
            : "L'erreur va se declencher..."}
        </p>
      </div>
    </div>
  )
}
