/* Pizza Dough Calculator — intentionally small, dependency-free service worker. */
const CACHE_PREFIX = "pdc-";
const CACHE_VERSION = "pdc-shell-v1";
const SHELL_CACHE = `${CACHE_VERSION}-routes`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const OFFLINE_FALLBACK = "/offline";
const CORE_ROUTES = new Set(["/", "/bake"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add(OFFLINE_FALLBACK))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && !key.startsWith(CACHE_VERSION)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname === "/icon.svg" ||
      url.pathname === "/icon-192.png" ||
      url.pathname === "/icon-512.png" ||
      url.pathname === "/icon-maskable-512.png" ||
      url.pathname === "/manifest.webmanifest")
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function navigationResponse(request) {
  const url = new URL(request.url);
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && CORE_ROUTES.has(url.pathname) && url.search === "")
      await cache.put(url.pathname, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(url.pathname)) ||
      (await cache.match(OFFLINE_FALLBACK)) ||
      Response.error()
    );
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (isStaticAsset(url)) event.respondWith(cacheFirst(request));
});

function assetUrlsFromHtml(html) {
  const urls = new Set();
  const pattern = /(?:src|href)=["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(html))) {
    const url = new URL(match[1], self.location.origin);
    if (isStaticAsset(url)) urls.add(url.pathname + url.search);
  }
  return [...urls];
}

async function prepareOffline() {
  const shell = await caches.open(SHELL_CACHE);
  const assets = await caches.open(ASSET_CACHE);
  for (const path of CORE_ROUTES) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not prepare ${path}`);
    const html = await response.clone().text();
    await shell.put(path, response);
    await Promise.all(
      assetUrlsFromHtml(html).map(async (assetPath) => {
        const assetResponse = await fetch(assetPath);
        if (assetResponse.ok) await assets.put(assetPath, assetResponse);
      })
    );
  }
}

async function clearAppCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key))
  );
}

self.addEventListener("message", (event) => {
  const message = event.data;
  if (message?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (!message?.requestId || !event.ports[0]) return;
  const port = event.ports[0];
  const task =
    message.type === "PREPARE_OFFLINE"
      ? prepareOffline()
      : message.type === "CLEAR_APP_CACHES"
        ? clearAppCaches()
        : Promise.reject(new Error("Unknown service-worker action"));
  event.waitUntil(
    task.then(
      () => port.postMessage({ ok: true, cacheVersion: CACHE_VERSION }),
      () => port.postMessage({ ok: false })
    )
  );
});
