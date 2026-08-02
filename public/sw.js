// The cache name changes whenever the shipped shell or visual assets change.
const CACHE_NAME = 'kawaii-habits-v13';

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json?v=1.1.0',
];

// Keep both approved garden moods and the companion expressions available offline.
const STATIC_ASSET_URLS = [
  '/icon-192-v1.1.0.png',
  '/icon-512-v1.1.0.png',
  '/icon-maskable-v1.1.0.png',
  '/apple-touch-icon-v1.1.0.png',
  '/favicon-48-v1.1.0.png',
  '/scene-garden-day.webp',
  '/scene-garden-night.webp',
  '/screenshots/today-phone.webp',
  '/screenshots/today-tablet.webp',
  '/neko-cat-happy.webp',
  '/neko-cat-normal.webp',
  '/neko-cat-blissful.webp',
  '/neko-cat-sleepy.webp',
  '/neko-cat-sad.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(SHELL_URLS);
      await Promise.allSettled(STATIC_ASSET_URLS.map((url) => cache.add(url)));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Let the page tell a waiting worker to take over immediately (update prompt).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ignore the chat API / fonts / CDNs

  // Navigations: network-first so users get fresh HTML, fall back to the cached
  // shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Everything else: stale-while-revalidate. Serve cache instantly, refresh in
  // the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
