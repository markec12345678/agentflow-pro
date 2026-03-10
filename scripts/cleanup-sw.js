/**
 * Cleanup Service Workers and Caches
 * Run this in browser console BEFORE testing
 */

(async () => {
  console.log('🧹 Starting Service Worker cleanup...');

  // 1. Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`📋 Found ${registrations.length} service worker registration(s)`);
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('✓ Unregistered:', registration.scope);
    }
  }

  // 2. Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log(`📦 Found ${cacheNames.length} cache(s)`);
    
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('✓ Deleted cache:', cacheName);
    }
  }

  // 3. Clear all storage
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    console.log('💾 Storage usage:', estimate.usage, 'bytes');
  }

  // 4. Force reload
  console.log('✅ Cleanup complete! Reloading page in 2 seconds...');
  setTimeout(() => {
    window.location.reload(true);
  }, 2000);

})();
