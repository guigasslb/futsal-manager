// Service worker mínimo e seguro (Fase 10).
// Estratégia: network-first para navegação/dados (evita conteúdo obsoleto);
// cache dos assets estáticos do Next para arranque rápido e resiliência.
const CACHE = "fm-static-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Assets estáticos do Next: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg") {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const resp = await fetch(request);
        if (resp.ok) cache.put(request, resp.clone());
        return resp;
      }),
    );
    return;
  }

  // Restante: network-first, com fallback ao cache se offline.
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  );
});
