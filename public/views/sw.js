// var CACHE_VERSION = 'app-v1';
// var CACHE_FILES = [
//     '/images/logo_75X75_t.png',
//     '/images/logo_145X145_t.png',
//     'css/main.css',
// ];


self.addEventListener('install', function (event) {
    event.waitUntil(
        // caches.open(CACHE_VERSION)
        //     .then(function (cache) {
        //         console.log('Opened cache');
        //         return cache.addAll(CACHE_FILES);
        //     })
    );
});