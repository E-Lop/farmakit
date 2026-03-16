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
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
);

// SPA navigation fallback
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api/],
  }),
);

// ============================================================================
// Push notification handlers
// ============================================================================

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: { url?: string; medicineId?: string; type?: string };
}

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: "Farmakit", body: event.data.text() };
  }

  const options: NotificationOptions & Record<string, unknown> = {
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192x192.png",
    badge: payload.badge ?? "/icons/favicon-32x32.png",
    tag: payload.tag ?? "farmakit-expiry",
    data: payload.data ?? { url: "/" },
    vibrate: [100, 50, 200],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const urlToOpen = (event.notification.data as { url?: string })?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const existingClient = windowClients[0];
        if (existingClient) {
          existingClient.focus();
          existingClient.postMessage({
            type: "NOTIFICATION_CLICK",
            url: urlToOpen,
          });
          return;
        }
        return self.clients.openWindow(urlToOpen);
      }),
  );
});

self.addEventListener("pushsubscriptionchange", (event: Event) => {
  const pushEvent = event as ExtendableEvent & {
    oldSubscription?: PushSubscription;
    newSubscription?: PushSubscription;
  };

  if (!pushEvent.newSubscription) return;

  const subscriptionJson = pushEvent.newSubscription.toJSON();
  pushEvent.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        client.postMessage({
          type: "PUSH_SUBSCRIPTION_CHANGED",
          subscription: subscriptionJson,
        });
      }
    }),
  );
});
