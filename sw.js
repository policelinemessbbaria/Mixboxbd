const CACHE_NAME = 'police-phonebook-v2'; // ভার্সন চেঞ্জ করেছি (v1 থেকে v2)

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ১. ইন্সটল ইভেন্ট
self.addEventListener('install', (e) => {
  // নতুন সার্ভিস ওয়ার্কার ডাউনলোড হলে সাথে সাথে অ্যাক্টিভ হবে (waiting থাকবে না)
  self.skipWaiting(); 

  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// ২. অ্যাক্টিভেট ইভেন্ট (নতুন ভার্সন আসলে পুরনো ক্যাশ ডিলিট হবে)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // যদি ক্যাশের নাম বর্তমান ভার্সনের সাথে ম্যাচ না করে, তবে সেটি ডিলিট করুন
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // সব ক্লায়েন্টকে (ট্যাব) নিয়ন্ত্রণ করবে
  return self.clients.claim();
});

// ৩. ফেচ ইভেন্ট (ক্যাশ থেকে লোড করবে, না থাকলে সার্ভার থেকে)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
