/* ============================================
   BARRAX Service Worker
   Handles push notifications only.
   Does NOT cache HTML pages (they're dynamic and
   auth-dependent, caching them causes "page couldn't
   load" errors on tab switches).
   Only caches static assets like JS, CSS, fonts, icons.
   ============================================ */

const CACHE_NAME = "barrax-v3";

// Install — skip waiting so new SW activates immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — only cache static assets (JS, CSS, fonts, images)
// NEVER cache HTML pages or API calls
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API calls
  if (url.pathname.startsWith("/api/")) return;

  // Skip HTML navigation requests entirely — let them always hit the network
  // This prevents stale cached pages from causing "page couldn't load" errors
  if (event.request.mode === "navigate") return;

  // Only cache static assets: JS chunks, CSS, fonts, images, icons
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (!isStaticAsset) return;

  // Cache-first for static assets (they're versioned by Next.js)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Push notification
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "BARRAX", {
      body: data.body || "You have a new notification.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "barrax-push",
      data: { url: data.url || "/" },
    })
  );
});

// Notification click — open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
