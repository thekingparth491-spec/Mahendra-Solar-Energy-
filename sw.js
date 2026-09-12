/* ═══════════════════════════════════════════════
   sw.js · Mahendra Solar Energy — Service Worker
   Caches all app assets for offline use
════════════════════════════════════════════════ */

const CACHE_NAME = 'mahendra-solar-v1';

const ASSETS = [
  '/index.html',
  '/app.css',
  '/app.js',
  '/manifest.json',
  '/icon.svg'
];

/* ── INSTALL — cache all assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).catch(() => {
      /* fail silently — app still works online */
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE — clean old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH — serve from cache, fallback to network ── */
self.addEventListener('fetch', event => {
  /* skip non-GET and cross-origin requests */
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        /* only cache valid same-origin responses */
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        /* offline fallback — return cached index.html */
        return caches.match('/index.html');
      });
    })
  );
});
