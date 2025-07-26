
// This is your Service Worker file.
// It must be in the root of the 'public' folder.

const CACHE_NAME = 'maida-app-cache-v1';
const urlsToCache = [
  '/',
  '/login',
  '/chef',
  '/pos',
  // You might want to add other static assets here
  // such as main CSS/JS files, logos, or fonts.
];

// Listen for the 'install' event to cache the app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache:', error);
      })
  );
  self.skipWaiting(); // Activate the new Service Worker immediately
});

// Listen for the 'activate' event to clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim(); // Take immediate control of all open pages
  console.log('[Service Worker] Service Worker activated successfully!');
});

// Listen for the 'fetch' event to intercept network requests
self.addEventListener('fetch', (event) => {
  // Apply a Cache-First strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If found in cache, return it
      if (response) {
        return response;
      }
      // Otherwise, fetch from the network
      return fetch(event.request).catch(() => {
        console.log('[Service Worker] Fetch failed for:', event.request.url);
        // You could return a custom offline page here if you had one
        // return caches.match('/offline.html');
      });
    })
  );
});

// IMPORTANT: Listen for the 'sync' event for background synchronization
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-operations') {
    console.log('[Service Worker] Background sync event triggered for pending operations!');
    event.waitUntil(
      // The Service Worker will message any active client to perform the sync.
      // This is a simpler strategy that avoids complex IndexedDB access from the SW context.
      // For true offline sync (when app is closed), a more direct DB access from SW is needed.
      notifyClientsToSync()
    );
  }
});

async function notifyClientsToSync() {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    if (clients && clients.length > 0) {
      console.log('[Service Worker] Notifying active client to perform sync...');
      // Send a message to the first available client
      clients[0].postMessage({ type: 'SYNC_REQUEST' });
    } else {
      console.log('[Service Worker] No active clients found to request sync.');
      // In a more advanced implementation, you would handle direct DB access here.
    }
}
