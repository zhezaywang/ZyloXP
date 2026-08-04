const CACHE_PREFIX = 'zyloxp-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-v3`;
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
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(APP_INDEX, copy));
          return response;
        })
        .catch(() => caches.match(APP_INDEX)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const fallbackUrl = new URL('#/learn', self.registration.scope).href;
  const targetUrl =
    typeof event.notification.data?.url === 'string'
      ? event.notification.data.url
      : fallbackUrl;

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
