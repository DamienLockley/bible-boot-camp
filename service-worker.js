const CACHE = 'bbc-teacher-e36642ac1666';
const CORE = ["./", "./index.html", "./study-data.json", "./kjv-verses.json", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./assets/image-001.jpg", "./assets/image-002.jpg", "./assets/image-003.jpg", "./assets/image-004.jpg", "./assets/image-005.jpg", "./assets/image-006.gif", "./assets/image-007.jpg", "./assets/image-008.jpg", "./assets/image-009.jpg", "./assets/image-010.jpg", "./assets/image-011.jpg", "./assets/image-012.jpg", "./assets/image-013.jpg", "./assets/image-014.gif", "./assets/image-018.png", "./assets/image-019.png", "./assets/image-015.jpg", "./assets/image-016.jpg", "./assets/image-017.png", "./assets/image-020.png"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('bbc-teacher-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  })));
});
