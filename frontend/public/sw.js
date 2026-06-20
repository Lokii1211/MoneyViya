const CACHE_NAME = 'viya-v13';
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/manifest.json'
];

// Install — cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network-first for API, Cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Always go to network for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  
  // Network-first for navigation (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('/')))
    );
    return;
  }
  
  // Cache-first for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Viya', body: 'You have a new notification!' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Viya', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: data.url ? { url: data.url } : {}
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
