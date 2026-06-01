// FitAI Service Worker — Push Notifications + Offline Cache

const CACHE = 'fitai-v2';
const ASSETS = ['/', '/app.html', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  // Network first for API, cache first for assets
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notification received
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'FitAI', {
      body: data.body || 'Hết giờ nghỉ — vào set tiếp theo!',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: 'fitai-rest',
      requireInteraction: false,
      data: { url: '/app.html' },
      actions: [
        { action: 'open', title: '💪 Bắt đầu set' },
        { action: 'more', title: '+30s nghỉ thêm' }
      ]
    })
  );
});

// Notification click — open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'more') return; // handled in app
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const client of list) {
        if (client.url.includes('/app') && 'focus' in client) return client.focus();
      }
      return clients.openWindow('/app.html');
    })
  );
});
