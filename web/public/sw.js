/* Nakoa Service Worker — PWA installable + offline + push notifications.
 *
 * Stratégies de cache :
 *  - assets statiques (/_next/static, /icon-*, fonts)  → cache-first
 *  - documents HTML (navigation)                       → network-first + fallback /offline
 *  - images publiques                                  → stale-while-revalidate
 *  - API (/api/v1/*)                                   → network-only (jamais cacher de l'authentifié)
 *
 * Compatible iOS 16.4+ : Web Push fonctionne quand la PWA est installée sur l'écran d'accueil.
 */

const VERSION = "nakoa-sw-v1.0.0";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMAGE_CACHE = `${VERSION}-images`;

// Pages à pré-cacher pour fonctionner offline
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

// ============================================================
// Lifecycle
// ============================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Précache partiel :", err);
      }),
    ),
  );
  // Active la nouvelle version sans attendre la fermeture des onglets
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Nettoie les anciens caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Permet au front d'envoyer "skipWaiting" pour activer une mise à jour immédiate
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ============================================================
// Fetch routing
// ============================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET — on ne cache jamais les POST/PUT/PATCH/DELETE
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1) Ignore les origin-cross (sauf fonts.googleapis qu'on cache séparément)
  if (url.origin !== self.location.origin && !url.host.includes("fonts.")) {
    return; // laisse passer normalement
  }

  // 2) API → toujours réseau (on ne cache pas l'authentifié)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 3) Assets Next statiques → cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 4) Images → stale-while-revalidate
  if (request.destination === "image" || url.pathname.startsWith("/uploads/")) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 5) Navigations HTML → network-first + fallback /offline
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // Par défaut : network-first
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

// ============================================================
// Stratégies
// ============================================================
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    return (
      (await cache.match(request)) ||
      (await cache.match("/offline")) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// ============================================================
// Push notifications (compatible iOS 16.4+)
// ============================================================
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Nakoa", body: event.data?.text() || "" };
  }

  const {
    title = "Nakoa",
    body = "",
    icon = "/icon-192.png",
    badge = "/icon-72.png",
    image,
    tag,
    data = {},
    actions = [],
    requireInteraction = false,
    silent = false,
  } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      image,
      tag: tag || "nakoa-default",
      renotify: !!tag,
      data,
      actions,
      requireInteraction,
      silent,
      vibrate: silent ? undefined : [120, 60, 120],
    }),
  );

  // Met à jour le badge d'app si supporté (Chrome desktop, Edge)
  if (self.registration.navigator && "setAppBadge" in self.navigator) {
    try {
      // best-effort, on n'a pas le count exact ici
      self.navigator.setAppBadge();
    } catch {}
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/notifications";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch {}
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

// ============================================================
// Background Sync (queue offline → flush when online)
// ============================================================
self.addEventListener("sync", (event) => {
  if (event.tag === "nakoa-flush-queue") {
    event.waitUntil(flushOfflineQueue());
  }
});

async function flushOfflineQueue() {
  // Placeholder — à remplir si on stocke des POST en IndexedDB pour replay.
  // Pour l'instant, on se contente de notifier les clients.
  const clientsList = await self.clients.matchAll();
  clientsList.forEach((c) => c.postMessage({ type: "SYNC_NOW" }));
}
