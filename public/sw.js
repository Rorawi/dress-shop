/*
 * Recovery worker for browsers that still have an older root service worker
 * registered. It clears stale Cache Storage, handles no fetches, then removes
 * its own registration so page assets load directly from the current server.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
