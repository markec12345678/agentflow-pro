# 🔐 GOOGLE LOGIN - COMPLETE SETUP FOR AGENTFLOW PRO

**Status:** ✅ READY TO COPY
**Source:** NextAuth v5 (Auth.js) - Working 2026

---

## 📋 STEP 1: INSTALL DEPENDENCIES

```bash
cd f:\ffff\agentflow-pro
npm install next-auth@beta
```

---

## 🔑 STEP 2: GET GOOGLE CREDENTIALS

### **Quick Setup (5 minutes):**

1. **Go to:** https://console.cloud.google.com/

2. **Create New Project:**
   - Project name: `AgentFlow Pro`
   - Click "CREATE"

3. **Enable Google+ API:**
   - Search "Google+ API"
   - Click "ENABLE"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: `Web application`
   - Name: `AgentFlow Pro Localhost`

5. **Add Redirect URI:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

6. **Copy Credentials:**
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxx`

---

## 📁 STEP 3: CREATE FILES

### **File 1: `.env.local`**

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=w633x0pcSu+g4swH1YQvYGwQLsbnk4VGkdnzeUIsUX0=

# App URL
NEXTAUTH_URL=http://localhost:3000
```

---

### **File 2: `auth.config.ts`**

**Location:** `f:\ffff\agentflow-pro\auth.config.ts`

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

---

### **File 3: `auth.ts`**

**Location:** `f:\ffff\agentflow-pro\auth.ts`

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

### **File 4: `src/pages/api/auth/[...nextauth].ts`**

**Location:** `f:\ffff\agentflow-pro\src\pages\api\auth\[...nextauth].ts`

```typescript
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

---

### **File 5: `src/components/auth/LoginButton.tsx`**

**Location:** `f:\ffff\agentflow-pro\src\components\auth\LoginButton.tsx`

```typescript
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-gray-700">
          Hello, {session.user?.name}
        </span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Sign in with Google
    </button>
  );
}
```

---

### **File 6: `middleware.ts`**

**Location:** `f:\ffff\agentflow-pro\middleware.ts`

```typescript
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
```

---

### **File 7: `src/app/layout.tsx`** (Update)

**Location:** `f:\ffff\agentflow-pro\src\app\layout.tsx`

```typescript
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## 🚀 STEP 4: TEST IT

### **1. Update .env.local:**

Replace with YOUR Google credentials:
```bash
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### **2. Restart Dev Server:**

```bash
# Stop current server (CTRL+C)
npm run dev
```

### **3. Test Login:**

1. **Open:** http://localhost:3000
2. **Click:** "Login" button
3. **Choose:** "Sign in with Google"
4. **Select:** Your Google account
5. **Success!** You're logged in

---

## ✅ VERIFICATION CHECKLIST

```
□ next-auth@beta installed
□ Google OAuth credentials obtained
□ .env.local configured
□ auth.config.ts created
□ auth.ts created
□ API route created
□ LoginButton component created
□ middleware.ts created
□ layout.tsx updated
□ Server restarted
□ Login works!
```

---

## 🐛 TROUBLESHOOTING

### **"Invalid redirect URI":**
Add this to Google Cloud Console:
```
http://localhost:3000/api/auth/callback/google
```

### **"NEXTAUTH_SECRET missing":**
Generate new secret:
```bash
openssl rand -base64 32
```

### **"Session not working":**
Check middleware.ts is in root folder

---

## 📦 PACKAGE.JSON UPDATE

Add to your `package.json`:

```json
{
  "dependencies": {
    "next-auth": "5.0.0-beta.15"
  }
}
```

---

**Vse pripravljeno! Samo kopiraj in testiraj! 🚀**

*Created: 2026-03-17*
*Source: NextAuth v5 (Auth.js) - Working 2026*
