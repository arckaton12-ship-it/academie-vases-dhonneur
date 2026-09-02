import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE || 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
    ],
    beforeSend(event) {
      // Never send auth tokens
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['apikey']
      }
      // Scrub localStorage tokens from contexts
      try {
        const session = localStorage.getItem('academie-vh-auth')
        if (session) {
          const parsed = JSON.parse(session)
          const token = parsed?.current?.access_token || parsed?.access_token
          if (token && event.message?.includes(token)) {
            event.message = '[REDACTED]'
          }
        }
      } catch { /* ignore */ }
      return event
    },
  })
}

export { Sentry }
