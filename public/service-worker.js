const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/dist/index.bundle.js",
    "/dist/manifest.json",
    "/dist/assets/icons/icon_72x72.png",
    "/dist/assets/icons/icon_96x96.png",
    "/dist/assets/icons/icon_128x128.png",
    "/dist/assets/icons/icon_192x192.png",
    "/dist/assets/icons/icon_256x256.png",
    "/dist/assets/icons/icon_384x384.png",
    "/dist/assets/icons/icon_512x512.png",
];

// Cache files to be cached in memory
self.addEventListener('install', function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(
            (cache) => {
                cache.addAll(FILES_TO_CACHE)
            }
        )
    );

    self.skipWaiting();
});


self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(
            (keyList) => {
                return Promise.all(
                    keyList.map(
                        (key) => {
                            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                                console.log("Removing old cache data", key);
                                return caches.delete(key);
                            }
                        }
                    )
                );
            }
        )
    );

    self.clients.claim();
});

// fetch request
self.addEventListener('fetch', function (evt) {
    // The following code caches successful requests to API
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(
                async (cache) => {
                    try {
                        const response = await fetch(evt.request);
                        // Status 200: replicate & store it in cache
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }
                        return response;
                    } catch (err) {
                        return await cache.match(evt.request);
                    }
                }).catch(
                    (err) => {
                        console.log(err)
                    }
                )
        );
        return;
    }

    // If request isn't for API, deliver static assets instead
    evt.respondWith(
        caches.match(evt.request).then(function(response) {
          return response || fetch(evt.request);
        })
    );

});

