importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyAeSiYt1qNVkxQxVxQ4-mB_YTk7c4GJQSU",
  authDomain: "academie-vases-dhonneur.firebaseapp.com",
  projectId: "academie-vases-dhonneur",
  storageBucket: "academie-vases-dhonneur.firebasestorage.app",
  messagingSenderId: "1837792857",
  appId: "1:1837792857:web:5977acda5709b36926bb48"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  const title = (payload.notification && payload.notification.title) || 'Académie Vases d\'Honneur'
  const body = (payload.notification && payload.notification.body) || ''
  const icon = '/logo.png'

  self.registration.showNotification(title, {
    body: body,
    icon: icon,
    badge: icon,
    tag: (payload.data && payload.data.tag) || 'bg-' + Date.now()
  })
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i]
        if (client.url.indexOf('/') !== -1 && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow('/')
    })
  )
})
