// ══════════════════════════════════════════════
//  CHAI KING — SERVICE WORKER
//  Cache-first strategy, full offline support
//  Bump CACHE_NAME to force refresh on update
// ══════════════════════════════════════════════

const CACHE_NAME = 'chaiking-v1';

const CACHE_FILES = [
  './index.html',
  './manifest.json',

  // Icons (all lowercase except extension)
  './icon/192.png',
  './icon/512.png',

  // Fonts (F capital, rest lowercase)
  './Font/Baloo2.woff2',
  './Font/Nunito.woff2',

  // Sounds (all lowercase)
  './sounds/achivement.mp3',
  './sounds/buy.mp3',
  './sounds/collectcoin.mp3',
  './sounds/critical.mp3',
  './sounds/golden.mp3',
  './sounds/levelup.mp3',
  './sounds/loop.mp3',
  './sounds/rocketlaunch.mp3',
  './sounds/tap.mp3',
];

// ── INSTALL: cache everything ──
self.addEventListener('install', e => {
  console.log('[SW] Installing Chai King...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching all files');
        // addAll fails if any file 404s — use individual adds with error catching
        return Promise.allSettled(
          CACHE_FILES.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW] Failed to cache: ${url}`, err)
            )
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: delete old caches ──
self.addEventListener('activate', e => {
  console.log('[SW] Activating...');
  e.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first, fallback to network ──
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if(e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if(cached) return cached; // serve from cache instantly

        // Not cached — try network
        return fetch(e.request)
          .then(response => {
            // Only cache valid responses
            if(response && response.status === 200 && response.type === 'basic'){
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(e.request, clone));
            }
            return response;
          })
          .catch(() => {
            console.warn('[SW] Offline + not cached:', e.request.url);
          });
      })
  );
});
