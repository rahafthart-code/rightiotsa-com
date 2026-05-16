/* Right — Service Worker
 * - Offline-first app shell (cache-first for static assets)
 * - Stale-while-revalidate for navigations (so the desert still loads)
 * - Push notifications for low-stability alerts (< 70%)
 */
const VERSION = 'right-sw-v4';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Skip cross-origin (Supabase, Mapbox, fonts) — let the network/cache headers handle it
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first so the SPA never boots a stale index.html that
  // references hashed chunks that no longer exist after a redeploy.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) cache.put('/', resp.clone());
        return resp;
      } catch {
        const cached = await cache.match('/');
        return cached || Response.error();
      }
    })());
    return;
  }

  // Never cache hashed JS/CSS chunks — always go to network so a stale
  // cached HTML can never collide with missing chunk hashes.
  if (/\/assets\/.+\.(js|css)$/.test(url.pathname)) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Static assets: cache-first with background refresh
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((resp) => {
      if (resp && resp.ok) cache.put(req, resp.clone());
      return resp;
    }).catch(() => cached);
    return cached || network;
  })());
});

/* === Push notifications === */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'Right — تنبيه استقرار';
  const options = {
    body: data.body || 'انخفض مؤشر الاستقرار لأحد الأصول.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'stability-alert',
    renotify: true,
    dir: 'rtl',
    lang: 'ar',
    data: { url: data.url || '/dashboard' },
    vibrate: [120, 60, 120],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = all.find((c) => c.url.includes(url));
    if (client) return client.focus();
    return self.clients.openWindow(url);
  })());
});

/* Allow the page to ask the SW to display a local notification (no server) */
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(msg.title || 'Right', {
      body: msg.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: msg.tag || 'right-alert',
      renotify: true,
      dir: 'rtl',
      lang: 'ar',
      data: { url: msg.url || '/dashboard' },
      vibrate: [120, 60, 120],
    });
  }
});
