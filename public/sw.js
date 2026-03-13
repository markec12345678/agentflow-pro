// Service Worker for AgentFlow Pro - Offline Support & Push Notifications

const CACHE_NAME = 'agentflow-v1';
const STATIC_CACHE_NAME = 'agentflow-static-v1';
const DYNAMIC_CACHE_NAME = 'agentflow-dynamic-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/register',
  '/pricing',
  '/_next/static/css/app/layout.css',
  '/_next/static/css/app/page.css',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Old caches cleaned up');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to clean up caches:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (API calls, CDN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle static requests (pages, assets, etc.)
async function handleStaticRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, serving from cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, serve offline page
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return a basic offline response
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache GET requests for offline access
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: API request failed, checking cache:', request.url);
    
    // For GET requests, try to serve from cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        // Add offline indicator to response
        const modifiedResponse = new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...cachedResponse.headers,
            'X-Offline-Cache': 'true',
            'X-Offline-Timestamp': new Date().toISOString()
          }
        });
        
        return modifiedResponse;
      }
    }
    
    // For POST/PUT/DELETE requests, queue for later sync
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      return queueForSync(request);
    }
    
    // Return offline error
    return new Response(JSON.stringify({
      error: 'Offline - No cached version available',
      offline: true,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Error': 'true'
      }
    });
  }
}

// Queue requests for later sync
async function queueForSync(request) {
  try {
    // Store request for later sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    // Get existing queued requests
    const queuedRequests = await getQueuedRequests();
    queuedRequests.push(requestData);
    
    // Save to IndexedDB
    await saveQueuedRequests(queuedRequests);
    
    console.log('Service Worker: Request queued for sync:', request.url);
    
    return new Response(JSON.stringify({
      message: 'Request queued for sync when online',
      offline: true,
      queued: true,
      timestamp: new Date().toISOString()
    }), {
      status: 202,
      statusText: 'Accepted',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Queued': 'true'
      }
    });
  } catch (error) {
    console.error('Service Worker: Failed to queue request:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to queue request',
      offline: true,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// IndexedDB operations for queued requests
async function getQueuedRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AgentFlowOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queuedRequests')) {
        db.createObjectStore('queuedRequests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['queuedRequests'], 'readonly');
      const store = transaction.objectStore('queuedRequests');
      const getRequest = store.getAll();
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => resolve(getRequest.result || []);
    };
  });
}

async function saveQueuedRequests(requests) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AgentFlowOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['queuedRequests'], 'readwrite');
      const store = transaction.objectStore('queuedRequests');
      
      // Clear existing requests
      const clearRequest = store.clear();
      
      clearRequest.onerror = () => reject(clearRequest.error);
      clearRequest.onsuccess = () => {
        // Add new requests
        const addRequests = requests.map(req => store.add(req));
        
        Promise.all(addRequests)
          .then(() => resolve())
          .catch(reject);
      };
    };
  });
}

// Sync queued requests when online
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync event triggered');
  
  if (event.tag === 'sync-queued-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  try {
    const queuedRequests = await getQueuedRequests();
    console.log('Service Worker: Syncing', queuedRequests.length, 'queued requests');
    
    for (const requestData of queuedRequests) {
      try {
        // Recreate the request
        const request = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        // Try to send the request
        const response = await fetch(request);
        
        if (response.ok) {
          console.log('Service Worker: Successfully synced request:', requestData.url);
        } else {
          console.error('Service Worker: Failed to sync request:', requestData.url, response.status);
        }
      } catch (error) {
        console.error('Service Worker: Error syncing request:', requestData.url, error);
      }
    }
    
    // Clear synced requests
    await saveQueuedRequests([]);
    
    console.log('Service Worker: Sync completed');
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      image: data.image,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      actions: data.actions,
      data: data.data,
      vibrate: [200, 100, 200],
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Service Worker: Error handling push notification:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  const notification = event.notification;
  const action = event.action;
  
  if (action) {
    console.log('Service Worker: Action clicked:', action);
    // Handle specific actions here
  } else {
    // Default click behavior - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
  
  notification.close();
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed:', event.notification.tag);
});

// Background sync for periodic updates
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync event');
  
  if (event.tag === 'periodic-sync') {
    event.waitUntil(
      // Perform periodic background tasks
      performPeriodicSync()
    );
  }
});

async function performPeriodicSync() {
  try {
    // Update cached data
    console.log('Service Worker: Performing periodic sync');
    
    // Example: Refresh booking data
    const response = await fetch('/api/bookings/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('Service Worker: Periodic sync completed successfully');
    }
  } catch (error) {
    console.error('Service Worker: Periodic sync failed:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
  
  if (event.data.type === 'FORCE_REFRESH') {
    event.waitUntil(
      caches.delete(DYNAMIC_CACHE_NAME).then(() => {
        console.log('Service Worker: Dynamic cache cleared');
      })
    );
  }
});

// Network status monitoring
self.addEventListener('online', () => {
  console.log('Service Worker: Client is online');
  
  // Trigger sync when coming back online
  self.registration.sync.register('sync-queued-requests');
});

self.addEventListener('offline', () => {
  console.log('Service Worker: Client is offline');
});

// Cache cleanup on storage pressure
self.addEventListener('storage', (event) => {
  if (event.key === 'agentflow-cache-cleanup') {
    console.log('Service Worker: Performing cache cleanup');
    
    event.waitUntil(
      cleanupOldCache()
    );
  }
});

async function cleanupOldCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove items older than 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      const timestamp = response?.headers.get('X-Cache-Timestamp');
      
      if (timestamp && parseInt(timestamp) < sevenDaysAgo) {
        await cache.delete(request);
        console.log('Service Worker: Deleted old cache entry:', request.url);
      }
    }
  } catch (error) {
    console.error('Service Worker: Cache cleanup failed:', error);
  }
}

console.log('Service Worker: Loaded successfully');
