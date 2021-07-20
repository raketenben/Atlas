var CACHE_NAME = 'Atlas-v1';

importScripts(
    'https://static.caesi.dev/js/service/general.js',
    'https://static.caesi.dev/js/service/offline.js',
)

self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            cache.addAll([
                '/bundle.js',
                '/index.html',
                '/main.css',
                '/atom-one-dark.css'
            ]);
            return;
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        self.clients.claim()
    );
});

self.addEventListener('fetch', function(event) {
    let url = new URL(event.request.url);
    console.log("service", url.pathname)
    if (url.pathname === "/offline-game") {
        console.log("no")
    } else {
        event.respondWith(new Promise(function(res, rej) {
            fetch(event.request).then(function(networkResponse) {
                res(networkResponse);
            }, function() {
                caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        res(cachedResponse);
                    } else {
                        console.log("no match");
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.match(OFFLINE_PAGE).then(function(offlinePage) {
                                res(offlinePage);
                            });
                        });
                    }
                });
            })
        }));
    }
});