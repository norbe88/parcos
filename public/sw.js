/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Showroom — Service Worker & Web Push Handler (PMH-401 & PMH-402)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Netcup VPS (152.53.158.65)
 * Zero Socket Daemons • W3C Web Push via VAPID
 * ════════════════════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'parcos-showroom-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/admin/mail',
  '/favicon.ico',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/manifest.json'
];

// 1. Instalare Service Worker & Pre-caching Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Eroare la pre-caching shell:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activare & Curățare Versiuni Anterioare
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Receptionare Eveniment Web Push VAPID
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'ParcOS Showroom',
        body: event.data.text()
      };
    }
  }

  const title = data.title || '⚡ Lead Nou în Showroom';
  const options = {
    body: data.body || 'Ai primit o solicitare nouă de la un client.',
    icon: data.icon || '/favicon-192x192.png',
    badge: data.badge || '/favicon-48x48.png',
    tag: data.tag || 'parcos-lead-' + Date.now(),
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/admin/mail?folder=unassigned',
      threadId: data.threadId || null
    },
    actions: [
      { action: 'open', title: '👁️ Deschide Lead' },
      { action: 'close', title: 'Închide' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 4. Click pe Notificare Push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/admin/mail';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin/mail') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
