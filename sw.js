// প্রতিবার আপডেটে ভার্সন বাড়াবেন (v4 থেকে v5 করে দিন)
const CACHE_NAME = 'SafaBoxbd-v7'; 

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
  if (e.request.url.includes('script.google.com') || e.request.url.includes('action=')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('Offline', { status: 503 }))
    );
    return; 
  }

  // নেভিগেশন রিকোয়েস্ট (index.html) - Network First
  if (e.request.mode === 'navigate') {
    e.respondWith(
      // { cache: 'no-cache' } যোগ করা হয়েছে। এটি ব্রাউজারের নিজস্ব ক্যাশ ইগনোর করে সরাসরি সার্ভার থেকে নতুন ফাইল আনবে।
      fetch(e.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // ইন্টারনেট না থাকলে পুরনো ক্যাশ দেখাবে
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
