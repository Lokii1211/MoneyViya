const CACHE_NAME = 'moneyviya-v2';
const ASSETS = ['/', '/static/index.html', '/static/landing.html', '/static/logo.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('/api/')) return; // Never cache API calls
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
