/* ============================================
   BARRAX Service Worker
   Handles push notifications + offline support.

   Two caches:
   - STATIC_CACHE: cache-first for JS/CSS/fonts/icons.
     Next.js chunks are content-hashed so cache-first
     is always safe.
   - NAV_CACHE: stale-while-revalidate for HTML page
     navigations. Serves a cached shell when offline
     so the app can open in dead zones (gym basements,
     remote runs) without a "page couldn't load" crash.
     Auth routes are NOT cached — they must always hit
     the network for fresh session state.
   ============================================ */

const STATIC_CACHE = "barrax-static-v4";
const NAV_CACHE = "barrax-nav-v1";

// Install — skip waiting so new SW activates immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate — clean up old caches (preserve NAV_CACHE so users
// don't lose their offline shell on a code deploy)
self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, NAV_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler — routes requests to one of three strategies:
// 1. Navigation: stale-while-revalidate from NAV_CACHE
// 2. Static asset: cache-first from STATIC_CACHE
// 3. Everything else: pass through to network (no SW involvement)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API calls — always hit network (Supabase, /api/*)
  if (url.pathname.startsWith("/api/")) return;

  // Skip cross-origin requests entirely
  if (url.origin !== self.location.origin) return;

  // --- STRATEGY 1: Navigation (HTML page loads) ---
  if (event.request.mode === "navigate") {
    // Auth routes must always be fresh — skip caching entirely
    if (url.pathname.startsWith("/auth/")) return;

    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request, { cacheName: NAV_CACHE });

        // Kick off a background refresh regardless of cache hit
        const networkFetch = fetch(event.request)
          .then(async (response) => {
            // Only cache successful HTML responses
            if (response && response.ok && response.type === "basic") {
              const copy = response.clone();
              const cache = await caches.open(NAV_CACHE);
              await cache.put(event.request, copy);
            }
            return response;
          })
          .catch(() => null);

        // Return cache immediately if present; otherwise wait for network
        if (cached) {
          // Fire-and-forget the refresh
          event.waitUntil(networkFetch);
          return cached;
        }

        // No cache — wait for network. If network also fails, fall back
        // to the root shell which will usually still be cached.
        const fresh = await networkFetch;
        if (fresh) return fresh;
        const rootShell = await caches.match("/", { cacheName: NAV_CACHE });
        if (rootShell) return rootShell;
        // Last resort: a minimal offline response so the browser doesn't
        // show its default "can't connect" page.
        return new Response(
          "<html><body style='font-family:monospace;background:#0C0C0C;color:#9BA89C;padding:40px;text-align:center'>" +
            "<h1 style='color:#D4A574'>BARRAX</h1><p>OFFLINE — connection required on first load.</p>" +
            "</body></html>",
          { headers: { "Content-Type": "text/html" } },
        );
      })(),
    );
    return;
  }

  // --- STRATEGY 2: Static assets (JS chunks, CSS, fonts, images) ---
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (!isStaticAsset) return;

  // Cache-first for static assets (they're content-hashed by Next.js)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
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
