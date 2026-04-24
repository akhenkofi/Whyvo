const CACHE_NAME = 'farmsavior-pwa-v11';
const URLS_TO_CACHE = ['/manifest.webmanifest', '/assets/farmsavior-logo.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: 'FARMSAVIOR_SW_UPDATED', version: CACHE_NAME }));
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset = /\.(js|mjs|css|map)$/i.test(url.pathname);
  const isNavigation = event.request.mode === 'navigate';

  if (isSameOrigin && (isStaticAsset || isNavigation || url.pathname === '/' || url.pathname.endsWith('.html'))) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || null))
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text?.() || '' }; }
  const title = data.title || 'FarmSavior Call';
  const body = data.body || 'Incoming call';
  const mode = data.mode || 'audio';
  const base = data.url || '/?go=community'
  const callUrl = `${base}${String(base).includes('?') ? '&' : '?'}incomingCall=1&callId=${encodeURIComponent(String(data.callId || ''))}&callType=${encodeURIComponent(String(mode || 'audio'))}`;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: `farmsavior-call-${data.callId || Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: { url: callUrl, callId: data.callId || '', mode },
      icon: '/assets/farmsavior-logo.jpg',
      badge: '/assets/farmsavior-logo.jpg'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/?go=community';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});
