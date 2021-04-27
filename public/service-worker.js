const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/styles.css"
];

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

self.addEventListener('fetch', function (evt) {
    // The following code caches responses for requests
    if (evt.request.url.includes('./routes/api/')) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(
                (cache) => {
                    return fetch(evt.request).then(
                        (response) => {
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }
                            return response;
                        }
                    ).catch(
                        (err) => {
                            return cache.match(evt.request);
                        }
                    );
                }).catch(
                    (err) => {
                        console.log(err)
                    }
                )
        );
        return;
    }

    // Serves static files from the cache
    // Carry on with the fetch request when the requested data is not in the cache
    // This allows the page to be accessible offline
    evt.respondWith(
        caches.open(CACHE_NAME).then(
            (cache) => {
                return cache.match(evt.request).then(
                    (response) => {
                        return response || fetch(evt.request);
                    });
            })
    );
});