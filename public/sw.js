/**
 * Self-destroying service worker.
 *
 * The app used to ship a Workbox service worker via @ducanh2912/next-pwa. Dropping the
 * plugin stops NEW visitors from getting one, but every browser that already registered
 * `/sw.js` keeps running the old cached copy — potentially serving a stale build forever,
 * because nothing would ever tell it to stop.
 *
 * Browsers re-fetch this file on navigation (at most every 24h) and install it as an
 * update to the old worker. It then unregisters itself, drops every cache the old worker
 * filled, and reloads open tabs so they come back on the network.
 *
 * Keep this file until the old workers are gone from the wild. Deleting it early makes
 * `/sw.js` return a 404, which is a less reliable way to retire a worker than replacing it.
 */

self.addEventListener("install", () => {
  // Skip the waiting phase so this replaces the old worker on the first update check
  // instead of sitting idle until every tab using the old one is closed.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();

      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));

      // The page that triggered this is still controlled by the dying worker, so it needs
      // a navigation to be served fresh.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});
