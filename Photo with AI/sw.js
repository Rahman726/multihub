// ===================== PhotoStore PWA Service Worker =====================
// Version: 3.0 — Full offline-capable PWA
const CACHE_NAME = 'photostore-v3';
const STATIC_CACHE = 'photostore-static-v3';
const IMAGE_CACHE = 'photostore-images-v3';
const DYNAMIC_CACHE = 'photostore-dynamic-v3';

// Assets to pre-cache on install (core app shell)
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/data.js',
    '/js/state.js',
    '/js/gallery.js',
    '/js/filters.js',
    '/js/search.js',
    '/js/trending.js',
    '/js/favorites.js',
    '/js/lightbox.js',
    '/js/download.js',
    '/js/infinite.js',
    '/js/loadMore.js',
    '/js/toast.js',
    '/js/auth.js',
    '/js/ai.js',
    '/js/darkmode.js',
    '/js/init.js',
    '/js/comments.js',
    '/js/ratings.js',
    '/js/tags.js',
    '/js/albums.js',
    '/js/notifications.js',
    '/js/dashboard.js',
    '/js/explore.js',
    '/js/filters-ui.js',
    '/js/batch-download.js',
    '/js/collage.js',
    '/js/i18n.js',
    '/js/themes.js',
    '/js/share.js',
    '/js/slideshow.js',
    '/js/music.js',
    '/js/profiles.js',
    '/js/parallax.js',
    '/js/color-match.js',
    '/js/editor.js',
    '/js/heatmap.js',
    '/js/upload.js',
    '/js/chat.js'
];

// Install event - pre-cache core assets (resilient to missing files)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(async (cache) => {
            // Use individual add() calls so one missing file doesn't break the whole cache
            const results = await Promise.allSettled(
                PRECACHE_ASSETS.map(url => 
                    cache.add(url).catch(err => {
                        console.warn('Skipping non-cacheable asset:', url, err.message);
                    })
                )
            );
            const failed = results.filter(r => r.status === 'rejected').length;
            if (failed > 0) {
                console.warn(`Service worker: ${failed} assets could not be cached (non-critical)`);
            }
        }).then(() => {
            return self.skipWaiting();
        }).catch((err) => {
            console.error('Service worker install error:', err.message);
        })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    const validCaches = [CACHE_NAME, STATIC_CACHE, IMAGE_CACHE, DYNAMIC_CACHE];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (!validCaches.includes(name)) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Helper: is this a same-origin request?
function isSameOrigin(url) {
    return url.startsWith(self.location.origin) || url.startsWith('/');
}

// Helper: is this an image request?
function isImageRequest(url) {
    return url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|avif)(\?.*)?$/i);
}

// Helper: is this an API request?
function isApiRequest(url) {
    return url.includes('/api/');
}

// Helper: is this a Google Fonts request?
function isGoogleFont(url) {
    return url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
}

// Helper: put item in cache with size limit
async function cacheWithLimit(cacheName, request, response, maxItems = 100) {
    const cache = await caches.open(cacheName);
    // Remove oldest entries if over limit
    const keys = await cache.keys();
    if (keys.length >= maxItems) {
        const oldest = keys.slice(0, keys.length - maxItems + 1);
        await Promise.all(oldest.map(key => cache.delete(key)));
    }
    cache.put(request, response.clone());
}

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    // Skip non-GET requests and browser extension requests
    if (request.method !== 'GET' || url.startsWith('chrome-extension://')) {
        return;
    }

    // Bypass service worker for external image CDNs — let browser load them directly
    // so the gallery's onerror fallback works properly when they fail
    if (url.includes('picsum.photos') || url.includes('pollinations.ai') || url.includes('googleusercontent.com')) {
        return;
    }

    // Same-origin static assets: Cache-first strategy
    if (isSameOrigin(url) && !isApiRequest(url) && !isImageRequest(url)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then((response) => {
                    if (response.ok) {
                        const cacheCopy = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => cache.put(request, cacheCopy));
                    }
                    return response;
                }).catch(() => {
                    // If offline and not cached, show fallback
                    return caches.match('/');
                });
            })
        );
        return;
    }

    // Image requests: Cache-first (same-origin images)
    if (isImageRequest(url)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const cacheCopy = response.clone();
                        cacheWithLimit(IMAGE_CACHE, request, cacheCopy, 200);
                    }
                    return response;
                })
            })
        );
        return;
    }

    // API requests: Network-first with timeout, fallback to cache or offline response
    if (isApiRequest(url)) {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        event.respondWith(
            fetch(request, { signal: controller.signal }).then((response) => {
                clearTimeout(timeoutId);
                if (response.ok) {
                    const cacheCopy = response.clone();
                    cacheWithLimit(DYNAMIC_CACHE, request, cacheCopy, 50);
                }
                return response;
            }).catch(async () => {
                // Try cache first
                clearTimeout(timeoutId);
                const cachedResponse = await caches.match(request);
                if (cachedResponse) return cachedResponse;
                
                // Return a JSON offline response for API calls
                return new Response(
                    JSON.stringify({ 
                        offline: true, 
                        error: 'Server is offline. Some features may be limited.',
                        message: 'Using offline data from local storage.'
                    }),
                    { 
                        headers: { 'Content-Type': 'application/json' },
                        status: 503
                    }
                );
            })
        );
        return;
    }

    // Google Fonts: Cache-first
    if (isGoogleFont(url)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then((response) => {
                    const cacheCopy = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(request, cacheCopy));
                    return response;
                });
            })
        );
        return;
    }

    // Everything else: Network-first, fallback to cache
    event.respondWith(
        fetch(request).then((response) => {
            if (response.ok) {
                const cacheCopy = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, cacheCopy));
            }
            return response;
        }).catch(async () => {
            const cachedResponse = await caches.match(request);
            return cachedResponse || new Response('Offline', { status: 503 });
        })
    );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
