// ── sw.js ── Service Worker Dayscape

const CACHE_NAME = "dayscape-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/firebase-init.js",
  "/js/auth.js",
  "/js/firestore.js",
  "/js/cloudinary.js",
  "/js/app.js",
  "/manifest.json",
  "/icons/ralph.png"
];

// ── Installation : mise en cache des assets ──
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activation : supprime les anciens caches ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : cache d'abord, réseau ensuite ──
self.addEventListener("fetch", event => {
  // On ne cache pas les requêtes Firebase ni Cloudinary
  if (
    event.request.url.includes("firebaseapp.com") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("cloudinary.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Met en cache les nouvelles ressources statiques
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match("/index.html"))
  );
});
