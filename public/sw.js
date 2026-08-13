const CACHE_PREFIX = 'zyloxp-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-v4`;
const CACHEABLE_DESTINATIONS = new Set([
  'font',
  'image',
  'manifest',
  'script',
  'style',
]);
const appUrl = (path = '') => new URL(path, self.registration.scope).href;
const APP_INDEX = appUrl('index.html');
const APP_SHELL = [
  appUrl(),
  APP_INDEX,
  appUrl('manifest.webmanifest'),
  appUrl('zylo-app-icon.svg'),
  appUrl('zylo-app-icon-180.png'),
  appUrl('zylo-app-icon-192.png'),
  appUrl('zylo-app-icon-512.png'),
];

function shouldCacheResponse(response) {
  const cacheControl = response.headers.get('Cache-Control') ?? '';
  return (
    response.ok &&
    response.type === 'basic' &&
    !cacheControl.toLowerCase().includes('no-store')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (shouldCacheResponse(response)) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(APP_INDEX, response.clone());
          }
          return response;
        })
        .catch(() => caches.match(APP_INDEX)),
    );
    return;
  }

  const isManifest = url.pathname.endsWith('/manifest.webmanifest');
  if (!CACHEABLE_DESTINATIONS.has(request.destination) && !isManifest) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then(async (response) => {
          if (shouldCacheResponse(response)) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    }),
  );
});

function getSafeNotificationUrl(value) {
  const fallbackUrl = new URL('#/learn', self.registration.scope);
  if (typeof value !== 'string') {
    return fallbackUrl.href;
  }

  try {
    const scopeUrl = new URL(self.registration.scope);
    const candidateUrl = new URL(value, scopeUrl);
    const withinScope = candidateUrl.pathname.startsWith(scopeUrl.pathname);
    return candidateUrl.origin === scopeUrl.origin && withinScope
      ? candidateUrl.href
      : fallbackUrl.href;
  } catch {
    return fallbackUrl.href;
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = getSafeNotificationUrl(event.notification.data?.url);

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then(async (windowClients) => {
        const existingClient = windowClients.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );

        if (existingClient) {
          await existingClient.navigate(targetUrl);
          return existingClient.focus();
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
