// প্রতিবার আপডেটে ভার্সন বাড়াবেন (v4 থেকে v5 করে দিন)
const CACHE_NAME = 'SafaBoxbd-v2'; 

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
//এ কোডগুলো মধ্যে যখন শুধুমাত্র সিটের পরিবর্তনের আপডেট গুলো ম্যানুয়ালি কোন রিফ্রেশ ছাড়া আপডেট হতো, তারপর আমি আমার ইনডেক্স ফাইল যেন কোন ম্যানুয়ালি রিফ্রেশ ছাড়া আপডেট হয় তার জন্য কোড এডিট করলাম কোডের নতুন লজিক যুক্ত করলাম। তারপর থেকে এখন শীটের পরিবর্তন গুলো আবার ম্যানুয়ালি রিফ্রেশ না দিলে আপডেট হয় না। আমি চাই পুরাতন ইউজার আমার ওয়েবসাইটে ঢুকলে যেনো অতিরিক্ত আর কোন ম্যানুয়াল ভাবে রিফ্রেশ দিতে না হয়, আমার সর্বশেষ সিটের আপডেট গুলো এবং ইনডেক্সাইলের আপডেট গুলো যেন আপডেট হয়ে যায়। আরেকটি দেশে বলে রাখা দরকার, আমার 2018 সালে একটি মোবাইল কিনেছিলাম সেই মোবাইলে দুইটা বিষয়ই আপডেট হয়ে যায়। কিন্তু আমি 25 সালে যে মোবাইলটি কিনেছি সেই মোবাইলে শুধুমাত্র ইনডেক্স ফাইলটি আপডেট হয় কিন্তু শীটের পরিবর্তনগুলো মেনুয়ালি রিফ্রেশ দিলে আপডেট হয় । ম্যানুয়ালি রিফ্রেস ছাড়া হয় না।
