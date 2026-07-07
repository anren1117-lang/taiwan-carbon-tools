// sw.js — minimal cache-first service worker so the dashboard
// keeps working when a Yunlin farmer\'s 4G drops between rice paddies.
//
// Strategy:
//   - Pre-cache the HTML shell + carbon engine + manifest + favicon
//     on install (everything needed to render the dashboard offline).
//   - For navigation requests (.html): try network first, fall back
//     to cache. So the user gets fresh code online + the last-known
//     good version offline.
//   - For all other GETs (JSON, JS, fonts): cache-first with network
//     fallback + opportunistic cache fill. Misses propagate as 404.
//   - Bumps the cache name when this file changes — old caches
//     auto-cleared on activate.

const CACHE = 'tct-v6-2026-07-07c';
const PRECACHE = [
  './',
  './index.html',
  './farm-dashboard.html',
  './farm-pitch.html',
  './farm-onboard.html',
  './farm-buyer.html',
  './farms.html',
  './household.html',
  './business.html',
  './farm.html',
  './farm-carbon-engine.js?v=3',
  './farm-carbon-engine.js?v=2',
  './manifest.webmanifest',
  './robots.txt',
  './sitemap.xml',
  './farms/demo.json',
  './farms/chen-rice-yilan.json',
  './farms/wei-dairy-changhua.json',
  './farms/lai-mango-pingtung.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      // { cache: 'reload' } forces a network fetch that bypasses
      // the browser HTTP cache so we're pre-caching current content,
      // not whatever old copy the browser had lying around.
      Promise.allSettled(PRECACHE.map((u) =>
        fetch(u, { cache: 'reload' })
          .then((res) => (res && res.ok) ? c.put(u, res) : null)
          .catch(() => null)
      ))
    ).then(() => self.skipWaiting())
  );
});

// Allow the page to trigger skipWaiting on the new SW so the
// user\'s "🔄 New version ready" pill click activates instantly.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // skip cross-origin

  // Navigation: network-first so updates land quickly when online
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./farm-dashboard.html')))
    );
    return;
  }

  // Static assets: cache-first with opportunistic refill
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
