const CACHE = 'bbc-teacher-95a1bd7b3cf7';
const CORE = ["./", "./index.html", "./study-data.json", "./kjv-verses.json", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./assets/image-001.jpg", "./assets/image-002.jpg", "./assets/image-003.jpg", "./assets/image-004.jpg", "./assets/image-005.jpg", "./assets/image-006.gif", "./assets/image-007.jpg", "./assets/image-008.jpg", "./assets/image-009.jpg", "./assets/image-010.jpg", "./assets/image-011.jpg", "./assets/image-012.jpg", "./assets/image-013.jpg", "./assets/image-014.gif", "./assets/image-018.png", "./assets/image-019.png", "./assets/image-015.jpg", "./assets/image-016.jpg", "./assets/image-017.png", "./assets/image-020.png", "./study-pdfs/Study_01.pdf", "./study-pdfs/Study_02.pdf", "./study-pdfs/Study_03.pdf", "./study-pdfs/Study_04.pdf", "./study-pdfs/Study_05.pdf", "./study-pdfs/Study_06.pdf", "./study-pdfs/Study_07.pdf", "./study-pdfs/Study_08.pdf", "./study-pdfs/Study_09.pdf", "./study-pdfs/Study_10.pdf", "./study-pdfs/Study_11.pdf", "./study-pdfs/Study_12.pdf", "./study-pdfs/Study_13.pdf", "./study-pdfs/Study_14.pdf", "./study-pdfs/Study_15.pdf", "./study-pdfs/Study_16.pdf", "./study-pdfs/Study_17.pdf", "./study-pdfs/Study_18.pdf", "./study-pdfs/Study_19.pdf", "./study-pdfs/Study_20.pdf", "./study-pdfs/Study_21.pdf", "./study-pdfs/Study_22.pdf", "./study-pdfs/Study_23.pdf", "./study-pdfs/Study_24.pdf", "./study-pdfs/Study_25.pdf", "./study-pdfs/Study_26.pdf", "./study-pdfs/Study_27.pdf", "./study-pdfs/Study_28.pdf", "./study-pdfs/Supplement_BBC_Texts_Only.pdf"];
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
