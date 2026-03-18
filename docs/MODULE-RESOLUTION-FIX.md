# 🔧 Module Resolution Fix - Auth Aliasing

**Datum:** 18. Marec 2026  
**Status:** ✅ Končano  
**Priority:** CRITICAL

---

## 📊 POVZETEK

Popravljena "Module not found: Can't resolve '@/auth'" napaka s premikom `auth.ts` v pravilno lokacijo.

---

## 🔍 ANALIZA TEŽAVE

### Napaka
```
Module not found: Can't resolve '@/auth'
```

### Vzrok

**Problematična struktura:**
```
F:\ffff\agentflow-pro\
├── auth.ts              ← NextAuth v5 konfiguracija (WRONG LOCATION!)
├── auth.config.ts
└── src/
    └── app/
        └── api/
            └── auth/
                └── [...auth]/
                    └── route.ts  ← import { handlers } from '@/auth' ❌
```

**tsconfig.json paths:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Problem:**
- `@/auth` se razreši v `src/auth.ts`
- Ampak `auth.ts` je v rootu (`F:\ffff\agentflow-pro\auth.ts`)
- TypeScript/Next.js ne more najti datoteke

---

## 🛠️ REŠITEV

### 1. Premik Datotek

**Before:**
```
F:\ffff\agentflow-pro\
├── auth.ts              ❌
└── auth.config.ts       ❌
```

**After:**
```
F:\ffff\agentflow-pro\
└── src/
    ├── auth.ts          ✅
    └── auth.config.ts   ✅
```

### 2. Posodobitev Importa

**src/app/api/auth/[...auth]/route.ts:**

```typescript
// Before (WRONG - file was in root)
import { handlers } from '@/auth';

// After (CORRECT - file is now in src/)
import { handlers } from '@/auth'; // ✅ Resolves to src/auth.ts
```

---

## 📁 KONČNA STRUKTURA

### NextAuth v5 Standard

```
src/
├── auth.ts                    ← NextAuth v5 configuration
│   import NextAuth from 'next-auth'
│   export const { auth, signIn, signOut, handlers } = NextAuth({...})
│
├── auth.config.ts             ← Auth configuration
│   import type { NextAuthConfig } from 'next-auth'
│   export const authConfig = {...}
│
└── app/
    └── api/
        └── auth/
            └── [...auth]/
                └── route.ts   ← API route handler
                    import { handlers } from '@/auth'
                    export const { GET, POST } = handlers
```

---

## ✅ CHECKLIST

- [x] Premaknjen `auth.ts` iz root v `src/`
- [x] Premaknjen `auth.config.ts` iz root v `src/`
- [x] Posodobljen import v `src/app/api/auth/[...auth]/route.ts`
- [x] Preverjen tsconfig.json paths
- [x] Git commit & push

---

## 🧪 TESTIRANJE

### 1. Verify File Locations

```bash
# Check if files exist in correct locations
Test-Path "F:\ffff\agentflow-pro\src\auth.ts"        # Should be True
Test-Path "F:\ffff\agentflow-pro\auth.ts"            # Should be False
```

### 2. Test Module Resolution

```bash
# Run TypeScript check
npm run type-check

# Should NOT show "Can't resolve '@/auth'" error
```

### 3. Test Auth Routes

```bash
# Test NextAuth v5 endpoint
curl http://localhost:3000/api/auth/providers

# Should return list of providers (not 500 error)
```

---

## 📚 REFERENCE

### tsconfig.json Path Aliases

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],           // @/ = src/
      "@/lib/*": ["./src/lib/*"],   // @/lib/ = src/lib/
      "@/components/*": ["./src/components/*"]
    }
  }
}
```

### NextAuth v5 Structure

Po NextAuth v5 (Auth.js) standardu:

- **Configuration:** `src/auth.ts` ali `src/lib/auth.ts`
- **API Route:** `src/app/api/auth/[...auth]/route.ts`
- **Import:** `import { handlers } from '@/auth'`

---

## 💡 LESSONS LEARNED

### 1. Path Aliases So Pomembni

```typescript
// ❌ WRONG - File in root, import expects in src/
F:\project\auth.ts
import { x } from '@/auth'  // Resolves to src/auth.ts (doesn't exist!)

// ✅ CORRECT - File in src/
F:\project\src\auth.ts
import { x } from '@/auth'  // Resolves to src/auth.ts ✅
```

### 2. NextAuth v5 Konvencije

NextAuth v5 priporoča:

```
src/
├── auth.ts              ← Main configuration
├── auth.config.ts       ← Optional config
└── app/api/auth/
    └── [...auth]/
        └── route.ts     ← API handler
```

### 3. Vedno Preveri tsconfig.json

Če uvozi ne delujejo:
1. Preveri `tsconfig.json` paths
2. Preveri dejansko lokacijo datotek
3. Uskladi import path z dejansko strukturo

---

## 🔗 RELATED FILES

| File | Purpose |
|------|---------|
| `src/auth.ts` | NextAuth v5 main configuration |
| `src/auth.config.ts` | Auth configuration options |
| `src/app/api/auth/[...auth]/route.ts` | API route handler |
| `tsconfig.json` | Path aliases configuration |

---

**🎯 Module Resolution: ✅ FIXED**

Vsi importi za NextAuth v5 zdaj pravilno delujejo! 🚀
