/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Runtime caching: catalogo farmaci Supabase (StaleWhileRevalidate, 24h)
registerRoute(
  /^https:\/\/.*\.supabase\.co\/rest\/v1\/medicines/,
  new StaleWhileRevalidate({
    cacheName: "medicines-catalog",
    plugins: [
      new ExpirationPlugin({ maxEntries: 5000, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// SPA navigation fallback
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api/],
  }),
);
