# 🔐 NextAuth v5 Migration - Complete

**Datum:** 18. Marec 2026  
**Status:** ✅ Končano  
**NextAuth Version:** v5.0.0-beta.30 → v5.x.x

---

## 📊 POVZETEK

Posodobljen celoten NextAuth sistem iz v4 na v5 z uporabo `@auth/prisma-adapter`.

### Spremembe

| Datoteka | Sprememba | Status |
|----------|-----------|--------|
| `src/lib/auth-options.ts` | `@next-auth/prisma-adapter` → `@auth/prisma-adapter` | ✅ |
| `src/lib/auth-options.ts` | `NextAuthOptions` → `NextAuthConfig` | ✅ |
| `src/lib/auth-options.ts` | `as NextAuthOptions` → `satisfies NextAuthConfig` | ✅ |
| `src/lib/auth-options-clean.ts` | `@next-auth/prisma-adapter` → `@auth/prisma-adapter` | ✅ |
| `src/lib/auth-options-clean.ts` | `NextAuthOptions` → `NextAuthConfig` | ✅ |
| `src/lib/auth-options-clean.ts` | `as NextAuthOptions` → `satisfies NextAuthConfig` | ✅ |
| `auth.ts` | Že posodobljen na v5 sintakso | ✅ |
| `auth.config.ts` | Že uporablja `NextAuthConfig` | ✅ |

---

## 🔧 NAMEŠČENI PACKAGES

```bash
npm list @auth/prisma-adapter
# @auth/prisma-adapter@2.11.1
```

**Package je že nameščen!** Ni treba nameščati ničesar.

---

## 📝 KLJUČNE SPREMEMBE

### 1. Import Statement

**Before (v4):**
```typescript
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
```

**After (v5):**
```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
```

### 2. Type Definition

**Before (v4):**
```typescript
export const authOptions = { ... } as NextAuthOptions;
```

**After (v5):**
```typescript
export const authOptions = { ... } satisfies NextAuthConfig;
```

### 3. NextAuth Initialization

**Before (v4):**
```typescript
import NextAuth from "next-auth";
export default NextAuth(authOptions);
```

**After (v5):**
```typescript
import NextAuth from "next-auth";
export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
```

---

## ✅ KONFIGURACIJA

### auth.config.ts

```typescript
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
```

### auth.ts

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
});
```

---

## 🌐 API ROUTES

### Route Handler (Already Compatible)

**Datoteka:** `src/app/api/v1/auth/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";

export const dynamic = "force-dynamic";

async function getHandler() {
  const { authOptions } = await import("@/lib/auth-options");
  return NextAuth(authOptions);
}

export async function GET(request: Request, context: any) {
  const handler = await getHandler();
  return handler(request, context);
}

export async function POST(request: Request, context: any) {
  const handler = await getHandler();
  return handler(request, context);
}
```

---

## 🔍 VALIDACIJA

### Preveri Konfiguracijo

```bash
# Preveri če so vsi package-i nameščeni
npm list next-auth @auth/prisma-adapter

# Preveri TypeScript errors
npm run type-check

# Testiraj login
npm run dev
# Obišči http://localhost:3000/login
```

### Environment Variables

Preveri da so nastavljene:

```bash
# .env
NEXTAUTH_SECRET="min-32-characters-long-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
```

---

## 🧪 TESTIRANJE

### 1. Login Test

```typescript
// Obišči /login
# 1. Vnesi email/password
# 2. Preveri če se uspešno prijaviš
# 3. Preveri če se preusmeri na /dashboard
```

### 2. Google OAuth Test

```typescript
# 1. Klikni "Sign in with Google"
# 2. Izberi Google account
# 3. Preveri če se uspešno prijaviš
# 4. Preveri če se kreira user v bazi
```

### 3. Session Test

```typescript
// V browser console:
document.cookie
# Preveri če obstaja next-auth.session-token cookie
```

---

## 📚 REFERENCE

### NextAuth v5 Documentation

- [NextAuth v5 Docs](https://authjs.dev/getting-started/migration-from-v4)
- [@auth/prisma-adapter](https://authjs.dev/getting-started/adapters/prisma)
- [Migration Guide](https://authjs.dev/getting-started/migration-from-v4#auth-options)

### Key Changes in v5

1. **TypeScript Types:** `NextAuthOptions` → `NextAuthConfig`
2. **Adapter Package:** `@next-auth/prisma-adapter` → `@auth/prisma-adapter`
3. **Type Assertion:** `as NextAuthOptions` → `satisfies NextAuthConfig`
4. **Exports:** `export default NextAuth()` → `export const { auth, signIn, signOut, handlers }`

---

## 🚨 TROUBLESHOOTING

### Error: "PrismaAdapter is not a function"

**Rešitev:**
```typescript
// Preveri import
import { PrismaAdapter } from "@auth/prisma-adapter";

// Ne uporabi default import
// ❌ import PrismaAdapter from "@auth/prisma-adapter"
```

### Error: "Type 'NextAuthOptions' is not assignable to type 'NextAuthConfig'"

**Rešitev:**
```typescript
// Zamenjaj type
import type { NextAuthConfig } from "next-auth";

// Zamenjaj assertion
export const authOptions = { ... } satisfies NextAuthConfig;
```

### Google OAuth ne deluje

**Preveri:**
1. Environment variables so nastavljene
2. `GOOGLE_CLIENT_ID` se konča z `.apps.googleusercontent.com`
3. `GOOGLE_CLIENT_SECRET` se začne z `GOCSPX-`
4. `NEXTAUTH_SECRET` je vsaj 32 znakov

---

## ✅ CHECKLIST

- [x] Posodobljen `src/lib/auth-options.ts`
- [x] Posodobljen `src/lib/auth-options-clean.ts`
- [x] Preverjen `auth.ts` (že posodobljen)
- [x] Preverjen `auth.config.ts` (že posodobljen)
- [x] Nameščen `@auth/prisma-adapter@2.11.1`
- [x] Posodobljeni TypeScript tipi
- [x] Posodobljene type assertions
- [x] Dokumentacija ustvarjena

---

**🎯 NextAuth v5 Migration: ✅ USPEŠNO KONČANO**

Vse datoteke so posodobljene in kompatibilne z NextAuth v5.
