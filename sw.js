const CACHE_NAME = 'SafaBoxbd-v2'; // ভার্সন আপডেট করেছি (v3 থেকে v4)

// ⚠️ গুরুত্বপূর্ণ: index.html এখানে রাখবেন না!
// শুধুমাত্র বাহ্যিক লাইব্রেরি ক্যাশ করবো যাতে স্কেলেটন ফাস্ট লোড হয়
const ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Bungee&display=swap'
];

// ১. ইন্সটল ইভেন্ট
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// ২. অ্যাক্টিভেট ইভেন্ট (পুরনো ক্যাশ ডিলিট)
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

// ৩. ফেচ ইভেন্ট (আপডেট-ফ্রেন্ডলি লজিক)
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // ক. GAS API কল — ক্যাশ ছাড়াই সরাসরি সার্ভারে যাবে
  if (url.includes('script.google.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', {status: 503})));
    return; 
  }

  // খ. index.html এবং v.txt — সবসময় নেটওয়ার্ক থেকে ফ্রেশ নেবে (ক্যাশ থেকে না!)
  // এটাই আগের সমস্যার সমাধান
  if (url.includes('index.html') || url.includes('v.txt')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // গ. বাকি সবকিছু (Tailwind, FontAwesome ইত্যাদি) — ক্যাশ ফার্স্ট
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
