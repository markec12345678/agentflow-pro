// Service Worker Unregister Script
// Run this in browser console to completely remove Service Worker

(async function unregisterServiceWorker() {
  console.log('🔍 Checking for Service Workers...');
  
  if ('serviceWorker' in navigator) {
    try {
      // Get all registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      console.log(`📋 Found ${registrations.length} Service Worker registration(s)`);
      
      // Unregister all
      for (const registration of registrations) {
        const success = await registration.unregister();
        console.log(`✅ Service Worker ${success ? 'UNREGISTERED' : 'FAILED'}: ${registration.scope}`);
      }
      
      // Clear all caches
      const cacheNames = await caches.keys();
      console.log(`🗑️  Found ${cacheNames.length} cache(s)`);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`✅ Cache DELETED: ${cacheName}`);
      }
      
      console.log('\n✅✅✅ ALL DONE! ✅✅✅');
      console.log('🔄 NOW HARD REFRESH: Press Ctrl+Shift+R');
      console.log('🔐 Then try to login again!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  } else {
    console.log('❌ Service Workers not supported in this browser');
  }
})();
