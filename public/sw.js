// Service Worker — Académie Vases d'Honneur
// Push notifications + cache cleanup only. No forced reloads.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const data = event.data.json()
    const title = data.title || 'Académie Vases d\'Honneur'
    const body = data.body || ''
    const icon = data.icon || '/logo.png'
    const url = data.url || '/'

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        data: { url },
        tag: data.tag || `academy-${Date.now()}`,
      })
    )
  } catch {
    // Invalid JSON, ignore
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          return
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
