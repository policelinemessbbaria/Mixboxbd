// প্রতিবার আপডেটে ভার্সন বাড়াবেন (v2 থেকে v3 বা v5 করে দিন)
const CACHE_NAME = 'SafaBoxbd-v3'; // আপনি চাইলে এখনই v3 বা v5 করে দিতে পারেন যেন নতুন নিয়মটি কার্যকর হয়

self.addEventListener('install', (e) => {
  self.skipWaiting(); 
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // গুগল স্ক্রিপ্ট এবং শিটের ডাটা হ্যান্ডেল করার অংশ
  if (e.request.url.includes('script.google.com') || e.request.url.includes('action=')) {
    if (e.request.method === 'GET') {
      e.respondWith(
        fetch(e.request, { cache: 'no-cache' }).catch(() => new Response('Offline', { status: 503 }))
      );
    } else {
      e.respondWith(
        fetch(e.request).catch(() => new Response('Offline', { status: 503 }))
      );
    }
    return; 
  }

  // নেভিগেশন রিকোয়েস্ট (index.html) - Network First
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // অন্যান্য ফাইল (CSS, JS, Image) - Cache First
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
