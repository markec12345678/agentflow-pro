/**
 * Unregister Service Worker
 * Run this in browser console to clear old Service Workers
 */

if ('serviceWorker' in navigator) {
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.log('Found registrations:', registrations.length);
    for (const registration of registrations) {
      registration.unregister()
        .then(() => console.log('✓ Service Worker unregistered'))
        .catch(err => console.error('✗ Failed to unregister:', err));
    }
  });

  // Clear all caches
  caches.keys().then((names) => {
    console.log('Found caches:', names);
    for (const name of names) {
      caches.delete(name)
        .then(() => console.log('✓ Cache deleted:', name))
        .catch(err => console.error('✗ Failed to delete cache:', err));
    }
  });

  console.log('Service Workers and caches cleared!');
}
