/* Jimato service worker. Generated into dist/sw.js at build time by the plugin in vite.config.js, which
   fills in VERSION and PRECACHE (every file of the build). The app shell is cached on install, so the app
   opens and works with no connection. A new build installs in the background and waits: the page shows
   "update ready" and only after the person taps it does the new worker take over (never mid-workout). */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL_CACHE = `jimato-shell-${VERSION}`;
const RUNTIME_CACHE = 'jimato-runtime'; // fonts and other cross-origin files, kept across versions
const scope = self.registration.scope;
const INDEX = new URL('index.html', scope).href;
// `ignoreVary`: some hosts send `Vary: Origin`, and a module script request would then miss the copy cached on install.
const MATCH = { ignoreVary: true };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE.map((path) => new URL(path, scope).href))),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('jimato-shell-') && key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Page loads (also with ?trainer=... deep links) open the cached shell, falling back to the network.
  if (request.mode === 'navigate') {
    event.respondWith(caches.match(INDEX, MATCH).then((cached) => cached || fetch(request)));
    return;
  }

  // Our own files: cached copy first (they are content-hashed, so a copy never goes stale).
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request, MATCH).then((cached) => cached || fetch(request)));
    return;
  }

  // Fonts and other outside files: show the cached copy right away, refresh it in the background.
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request, MATCH).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || network;
        }),
      ),
    );
  }
});
