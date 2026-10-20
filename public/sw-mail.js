/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Service Worker & Web Push Handler (PMH-401 & PMH-402)
 * Platformă: RXM Automobile & DealerOS (CARVANA SRL)
 * ════════════════════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'parcos-mail-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/manifest-mail.json'
];

// 1. Instalare Service Worker & Caching Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW-Mail] Eroare la pre-caching shell:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activare & Curățare Cache-uri vechi
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

// 3. Receptionare Eveniment Web Push (PMH-402)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'ParcOS Mail Hub',
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
      url: data.url || '/?tab=mail&folder=unassigned',
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
    : '/?tab=mail';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Dacă există deja o fereastră deschisă, o aducem în prim-plan
      for (const client of clientList) {
        if (client.url.includes('/?tab=mail') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Altfel, deschidem o fereastră nouă
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
