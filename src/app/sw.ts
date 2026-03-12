// Service Worker disabled for development
// Uncomment for production PWA support

const CACHE_NAME = 'agentflow-pro-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets
];

// Disabled for development - uncomment for production
/*
self.addEventListener('install', (event: Event) => {
  const extendableEvent = event as ExtendableEvent;
  extendableEvent.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event: Event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(fetchEvent.request);
    })
  );
});

self.addEventListener('activate', (event: Event) => {
  const extendableEvent = event as ExtendableEvent;
  extendableEvent.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
*/

// Type declarations for service worker
declare global {
  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<void>): void;
  }

  interface FetchEvent extends Event {
    respondWith(response: Promise<Response> | Response): void;
    request: Request;
  }
}
