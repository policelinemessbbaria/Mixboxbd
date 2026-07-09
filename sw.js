// প্রতিবার index.html আপডেট করলে এই ভার্সন নম্বর বাড়াতে হবে (যেমন: v4, v5)
const CACHE_NAME = 'SafaBoxbd-v2'; 

// ১. ইন্সটল ইভেন্ট (ডাবল ডাউনলোড রোধে cache.addAll রিমুভ করা হয়েছে)
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  // আমরা এখানে কোনো ফাইল ডাউনলোড করব না। fetch ইভেন্টে ডাইনামিক্যালি ক্যাশ হবে।
});

// ২. অ্যাক্টিভেট ইভেন্ট (পুরনো ক্যাশ ডিলিট)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// ৩. ফেচ ইভেন্ট (মূল লজিক)
self.addEventListener('fetch', (e) => {
  // ক. Google Apps Script API ক্যাশ হবে না
  if (e.request.url.includes('script.google.com') || e.request.url.includes('action=')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('Offline', { status: 503 }))
    );
    return; 
  }

  // খ. নেভিগেশন রিকোয়েস্ট (index.html লোড হওয়ার সময়) - "Network First"
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          // সার্ভার থেকে নতুন ফাইল পাওয়া গেছে
          // ক্লোন করে ক্যাশে সেভ করা হচ্ছে (পরে অফলাইনে দেখানোর জন্য)
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          
          // ইউজারকে নতুন ফাইলটি দেখানো হচ্ছে
          return networkResponse;
        })
        .catch(() => {
          // ইন্টারনেট নেই (অফলাইন) - তাহলে ক্যাশ থেকে পুরনো ফাইল দেখাবে
          return caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // গ. অন্যান্য স্ট্যাটিক ফাইল (CSS, JS, ফন্ট, ছবি) - "Cache First"
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // ক্যাশে থাকলে সেটাই দেখাবে (দ্রুত লোডিং)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // ক্যাশে না থাকলে সার্ভার থেকে আনবে এবং ক্যাশে সেভ করবে
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
