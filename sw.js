// Radiology Decision Suite — Service Worker
// Bump CACHE_VER whenever guidelines are updated to trigger auto-update
const CACHE_VER = 'radsuite-2024.6';
const ASSETS   = ['./index.html', './manifest.json', './sw.js'];

// ── INSTALL: cache all assets immediately ──────────────────────────────────
self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE_VER)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())   // activate immediately even if old tab open
  );
});

// ── ACTIVATE: delete old caches, take control ──────────────────────────────
self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: serve from cache, refresh in background ─────────────────────────
self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(
    caches.match(ev.request).then(cached => {
      const network = fetch(ev.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VER).then(c => c.put(ev.request, clone));
        }
        return res;
      }).catch(() => null);
      // Return cached immediately; fresh copy loads next time
      return cached || network;
    })
  );
});

// ── MESSAGE: allow page to trigger update ─────────────────────────────────
self.addEventListener('message', ev => {
  if (ev.data?.action === 'skipWaiting') self.skipWaiting();
});
