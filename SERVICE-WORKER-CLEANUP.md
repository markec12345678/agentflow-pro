# 🧹 Service Worker Cleanup

## Problem
Stari Service Worker (`sw.js`) poskuša cacheirati produkcijo Vercel URL (`https://agentflow-pro-seven.vercel.app`) namesto lokalnega strežnika (`http://localhost:3002`).

To povzroča:
- 503 Service Unavailable napake
- Nalaganje napačnih strani iz cachea
- Težave z authentication flow

---

## Rešitev

### Opcija 1: Brskalnik DevTools (Priporočeno)

1. **Odpri DevTools** (F12 ali Ctrl+Shift+I)
2. **Pojdi na "Application" tab**
3. **Klikni "Service Workers"** v levem meniju
4. **Klikni "Unregister"** na obstoječem Service Workerju
5. **Klikni "Clear storage"** → "Clear site data"
6. **Osveži stran** (Ctrl+R ali F5)

### Opcija 2: Console Command

Odpri DevTools Console (F12) in prilepi:

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('✓ Service Workers unregistered');
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  console.log('✓ Caches cleared');
});
```

### Opcija 3: Hard Refresh

Pritisni **Ctrl+Shift+R** (Windows) ali **Cmd+Shift+R** (Mac) za hard refresh brez cachea.

---

## Preverjanje

Po unregisteriranju:

1. **Odpri Console** (F12)
2. **Poglej Service Worker loge:**
   ```
   Service Worker: Installing...
   Service Worker: Activating...
   Service Worker: Ready
   ```
3. **Preveri da ni 503 napak**
4. **Stran se mora naložiti pravilno**

---

## Kaj Je Bilo Popravljeno

### `src/app/sw.ts`
- ✅ Posodobljen na verzijo v2
- ✅ Odstranjeno cacheiranje external URLs
- ✅ Dodana validacija za origin
- ✅ Izboljšan error handling

### Nastavitve
- ✅ `NEXTAUTH_URL` nastavljen na `http://localhost:3002`
- ✅ `.next` folder očiščen
- ✅ Server restartan

---

## Če Težave Vztrajajo

1. **Zapri vse tabe** z `http://localhost:3002`
2. **Pobriši brskalnik cache**:
   - Chrome: `chrome://settings/clearBrowserData`
   - Firefox: `about:preferences#privacy`
3. **Zaženi ponovno:**
   ```bash
   taskkill /F /IM node.exe
   npm run dev
   ```
4. **Odpri novo okno** in pojdi na `http://localhost:3002`

---

**Zadnja Posodobitev:** 2026-03-08 22:45  
**Status:** ✅ Popravljeno - unregisteriraj stari SW za popolno delovanje
