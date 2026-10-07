/* وِردي — service worker : l'application fonctionne hors ligne une fois ouverte.
 * Changez VERSION à chaque mise à jour du site pour que les téléphones récupèrent la nouvelle version. */
const VERSION = "wirdi-v2";
const SHELL = ["./", "index.html", "enseignant.html", "app.css", "core.js", "student.js", "teacher.js",
  "pdf-lib.min.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Pages : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne. Les paramètres du lien sont ignorés pour le cache.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(url.pathname, copy)); return r; })
      .catch(() => caches.match(url.pathname).then(r => r || caches.match("index.html"))));
    return;
  }
  // Polices Google et fichiers du site : cache d'abord, mise à jour en arrière-plan.
  if (url.origin === location.origin || url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSION).then(c => c.match(req, { ignoreSearch: url.origin === location.origin }).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
