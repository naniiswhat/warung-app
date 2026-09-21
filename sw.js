const CACHE_NAME = 'warung-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/vendors.html',
    '/sejarah.html',
    '/style.css',
    '/app.js',
    '/vendors.js',
    '/sejarah.js',
    '/database.js',
    '/manifest.json',
    '/icon.png'
];

// Install Event: Cache the files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch Event: Serve from cache if offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});