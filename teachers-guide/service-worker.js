const CACHE = 'bbc-teacher-generated-2e66bb3a4523';
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim().then(async () => {
    const keys=await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('bbc-teacher-') && k !== CACHE).map(k => caches.delete(k)));
  }));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin)return;
  const url=new URL(event.request.url);
  // PDF pages are fetched only when opened; never pre-cache or store them.
  if(url.pathname.includes('/study-pdfs/') && url.pathname.endsWith('.pdf')) {
    event.respondWith(fetch(event.request));
    return;
  }
  const fresh=/\/(?:index\.html|study-data\.json|service-worker\.js)$/.test(url.pathname)||url.pathname.endsWith('/');
  if(fresh){
    event.respondWith(fetch(event.request).then(response => {
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
      return response;
    }).catch(async()=> (await caches.match(event.request,{ignoreSearch:true})) || Response.error()));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  })));
});
