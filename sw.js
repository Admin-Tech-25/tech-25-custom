// =========================================================================
// 75 CUSTOM - PROGRESSIVE WEB APP SERVICE WORKER
// Version: v3.8.0
// =========================================================================

const CACHE_NAME = '75custom-v3.8.0';

// The absolute minimum core files needed to start the app
// The SW automatically handles caching dynamically requested image/config assets
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/apps/75custom/index.html'
];

// -------------------------------------------------------------------------
// 1. INSTALL EVENT: Pre-cache the core shell
// -------------------------------------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching core assets');
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting(); 
});

// -------------------------------------------------------------------------
// 2. ACTIVATE EVENT: Clean up old caches when version updates
// -------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); 
});

// -------------------------------------------------------------------------
// 3. FETCH EVENT: Advanced Caching Strategy for White-Labeling
// -------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Ignore cross-origin requests
    if (!req.url.startsWith(self.location.origin)) return;

    // STRATEGY A: Network-First for HTML and JS (index.html, config.js)
    if (req.headers.get('accept').includes('text/html') || req.url.includes('.js')) {
        event.respondWith(
            fetch(req).then((networkRes) => {
                const clone = networkRes.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                return networkRes;
            }).catch(() => {
                return caches.match(req);
            })
        );
        return;
    }

    // STRATEGY B: Cache-First for Images (Logos, Icons - webp included)
    if (req.url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i)) {
        event.respondWith(
            caches.match(req).then((cachedRes) => {
                if (cachedRes) return cachedRes; 
                
                return fetch(req).then((networkRes) => {
                    const clone = networkRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                    return networkRes;
                });
            })
        );
        return;
    }

    // STRATEGY C: Default fallback
    event.respondWith(
        caches.match(req).then((cachedRes) => {
            return cachedRes || fetch(req);
        })
    );
});
