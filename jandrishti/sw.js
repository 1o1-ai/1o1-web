/* JanDrishti service worker: network-first app shell so the installed app opens offline.
 * Only same-origin GETs are cached; API data (another origin, behind sign-in) never is. */
const VERSION = 'executive-ui-1';
const CACHE = `jandrishti-shell-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jandrishti-shell-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Pages are always fetched fresh from the server (GitHub Pages lets browsers reuse them for
  // 10 minutes); versioned scripts and styles can use the normal HTTP cache.
  e.respondWith(fetch(req, req.mode === 'navigate' ? { cache: 'no-store' } : undefined).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
