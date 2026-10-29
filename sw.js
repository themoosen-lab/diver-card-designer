/* Diver Card Designer: lets the site open as an app and keep working without internet.
   The page and the icon pack come from the internet whenever it's there (so updates and new icons show straight away),
   and from this saved copy when it isn't. Fonts are saved the first time they load. */
const CACHE = 'diver-card-v1';
const CORE = ['./', './index.html', './icons.js', './manifest.webmanifest', './app-192.png', './app-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const save = (req, res) => { if (res && (res.ok || res.type === 'opaque')){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin){
    // internet first, saved copy when offline
    e.respondWith(fetch(req).then(res => save(req, res)).catch(() =>
      caches.match(req, { ignoreSearch:true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    // fonts never change: saved copy first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => save(req, res))));
  }
});
