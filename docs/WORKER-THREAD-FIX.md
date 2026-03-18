# 🔧 Worker Thread Crash Fix - Icon Component

**Datum:** 18. Marec 2026  
**Status:** ✅ Končano  
**Priority:** CRITICAL

---

## 📊 POVZETEK

Popravljena kritična napaka ki je povzročala sesutje Next.js worker threadov:

**Napaka:**
```
worker thread exited with code 1
worker.js not found
```

**Vzrok:**
- `src/app/icon.tsx` ni vračal `ImageResponse`
- Manjkal `export const runtime = 'edge'`
- Uporabljen `readFileSync` (filesystem access v edge runtime)

**Rešitev:**
- ✅ Uporabljen `ImageResponse` iz `next/og`
- ✅ Dodan `export const runtime = 'edge'`
- ✅ Odstranjen filesystem access
- ✅ Error handling z fallback

---

## 🛠️ POPRAVILA

### 1. Icon Component (src/app/icon.tsx)

**Before (WRONG):**
```typescript
import { Metadata } from 'next';
import { readFileSync } from 'fs';

export default function Icon() {
  return null; // ❌ Returns nothing!
}

export async function GET() {
  const faviconBuffer = readFileSync(faviconPath); // ❌ Filesystem access!
  return new NextResponse(faviconBuffer);
}
```

**After (CORRECT):**
```typescript
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// CRITICAL: Must use edge runtime for worker thread compatibility
export const runtime = 'edge'; // ✅ KLJUČNO!

export async function GET(request: NextRequest) {
  return new ImageResponse(
    (
      <div style={{ /* SVG icon */ }}>
        <svg>...</svg>
      </div>
    ),
    { width: 32, height: 32 }
  ); // ✅ Returns ImageResponse!
}
```

---

## 🔍 ZAKAJ SE TO DOGAJA?

### Worker Thread Architecture

Next.js 14+ uporablja ločene worker procese za:

1. **Image Optimization** - Generiranje OG images in favicon
2. **Metadata Generation** - Dynamic metadata
3. **Edge Runtime** - Serverless functions

**Ko icon.tsx pade:**

```
Request → /icon
  ↓
Next.js Edge Runtime
  ↓
Worker Thread #1
  ↓
icon.tsx execution
  ↓
❌ Missing return statement
  ↓
Worker crashes (exit code 1)
  ↓
Next.js išče worker.js
  ↓
❌ worker.js not found
  ↓
500 Error
```

### Edge Runtime Requirements

Za worker thread compatibility MORAŠ:

1. ✅ `export const runtime = 'edge'`
2. ✅ Return `ImageResponse` (ne `NextResponse`)
3. ✅ Brez filesystem access (`readFileSync`)
4. ✅ Brez Node.js built-in modules (`fs`, `path`, etc.)

---

## 📁 KONČNA KODA

### src/app/icon.tsx

```typescript
/**
 * App Icon - Dynamic Generation with ImageResponse
 * 
 * Generates favicon dynamically using Next.js OG Image API
 * Must use 'edge' runtime for worker thread compatibility
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// CRITICAL: Must use edge runtime for worker thread compatibility
export const runtime = 'edge';

const ICON_SIZE = 32;
const BACKGROUND_COLOR = '#1a73e8';
const TEXT_COLOR = '#ffffff';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const size = searchParams.get('size') || ICON_SIZE.toString();
    
    const width = parseInt(size, 10);
    const height = width;

    // Create ImageResponse with SVG icon
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${BACKGROUND_COLOR} 0%, #0d47a1 100%)`,
            borderRadius: '20%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* AgentFlow Pro Logo - Simplified "A" */}
          <svg
            width={width * 0.6}
            height={height * 0.6}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left leg of A */}
            <path
              d="M12 4L4 20H8L12 12L16 20H20L12 4Z"
              fill={TEXT_COLOR}
              stroke={TEXT_COLOR}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Crossbar of A */}
            <path
              d="M8 14H16"
              stroke={TEXT_COLOR}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ),
      {
        width,
        height,
        emoji: 'text',
      }
    );
  } catch (error) {
    console.error('[Icon] Error generating favicon:', error);
    
    // Fallback icon
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: BACKGROUND_COLOR,
            color: TEXT_COLOR,
            fontSize: 20,
            fontWeight: 'bold',
          }}
        >
          A
        </div>
      ),
      {
        width: ICON_SIZE,
        height: ICON_SIZE,
      }
    );
  }
}
```

---

## 🧪 TESTIRANJE

### 1. Test Icon Generation

```bash
# Default size (32x32)
curl http://localhost:3000/icon

# Custom size
curl http://localhost:3000/icon?size=64

# Apple touch icon size
curl http://localhost:3000/icon?size=180
```

**Expected Response:**
- Status: 200 OK
- Content-Type: image/png
- Body: PNG image data

### 2. Check Worker Logs

```bash
npm run dev

# Look for:
✓ Icon generated successfully
✓ Worker thread active
✗ NO "worker.js not found" errors
```

### 3. Browser Test

1. Odpri `http://localhost:3000`
2. Preveri favicon v browser tab
3. Open DevTools → Network
4. Refresh page
5. Find `/icon` request
6. Check status: 200 OK

---

## 📊 COMPARISON

| Aspect | Before | After |
|--------|--------|-------|
| **Runtime** | Node.js | Edge ✅ |
| **Response Type** | `NextResponse` | `ImageResponse` ✅ |
| **Filesystem Access** | `readFileSync` ❌ | None ✅ |
| **Worker Compatible** | ❌ No | ✅ Yes |
| **Error Handling** | ❌ None | ✅ Fallback icon |
| **Customizable** | ❌ No | ✅ Via query param |

---

## 🔗 REFERENCE

### Next.js Documentation

- [ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Metadata Icon](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/icons)

### Related Issues

- [Next.js Issue #58392](https://github.com/vercel/next.js/issues/58392) - Worker thread crashes with icon.tsx
- [Next.js Issue #59123](https://github.com/vercel/next.js/issues/59123) - ImageResponse requires edge runtime

---

## ✅ CHECKLIST

- [x] Uporabljen ImageResponse iz next/og
- [x] Dodan `export const runtime = 'edge'`
- [x] Odstranjen filesystem access (readFileSync)
- [x] Implementiran error handling
- [x] SVG icon z AgentFlow Pro logotipom
- [x] Customizable size via query param
- [x] Testirano z curl
- [x] Git commit & push

---

## 🚨 LESSONS LEARNED

### 1. Edge Runtime je OBVEZEN za ImageResponse

```typescript
// ❌ WRONG - Will crash worker threads
export async function GET() {
  return new ImageResponse(...);
}

// ✅ CORRECT - Worker compatible
export const runtime = 'edge';
export async function GET() {
  return new ImageResponse(...);
}
```

### 2. ImageResponse ≠ NextResponse

```typescript
// ❌ WRONG
import { NextResponse } from 'next/server';
return new NextResponse(buffer);

// ✅ CORRECT
import { ImageResponse } from 'next/og';
return new ImageResponse(...);
```

### 3. Brez Filesystem Access v Edge Runtime

```typescript
// ❌ WRONG - Node.js modules not available in edge
import { readFileSync } from 'fs';
const buffer = readFileSync(path);

// ✅ CORRECT - Generate dynamically
return new ImageResponse(<svg>...</svg>);
```

---

**🎯 Worker Thread Crash: ✅ FIXED**

Vse worker thread napake so popravljene! Next.js zdaj pravilno generira favicon brez sesutja. 🚀
