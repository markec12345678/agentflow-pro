# Google OAuth Setup – Sign in with Google

AgentFlow Pro supports "Sign in with Google" when configured. The code is ready; you only need to set up OAuth credentials.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
4. If prompted, configure the OAuth consent screen:
   - User type: External (or Internal for workspace-only)
   - App name: AgentFlow Pro
   - User support email: your email
   - Developer contact: your email
5. Application type: **Web application**.
6. Name: e.g. "AgentFlow Pro Web".
7. **Authorized JavaScript origins:**
   - Production: `https://[your-vercel-domain].vercel.app`
   - Dev: `http://localhost:3002`
8. **Authorized redirect URIs:**
   - Production: `https://[your-vercel-domain].vercel.app/api/auth/callback/google`
   - Dev: `http://localhost:3002/api/auth/callback/google`
9. Create and copy the **Client ID** and **Client Secret**.

## 2. Environment Variables

### Vercel (Production)

1. Vercel Dashboard → Project → Settings → Environment Variables.
2. Add:
   - `GOOGLE_CLIENT_ID` = [your Client ID]
   - `GOOGLE_CLIENT_SECRET` = [your Client Secret]
3. Redeploy if needed.

### Local (.env.local)

Add the same variables to `.env.local`:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="http://localhost:3002"
```

## 3. Verify

- Login page shows "Sign in with Google" when both env vars are set.
- Clicking it redirects to Google, then back to the app after sign-in.
- Without credentials, the Google button is hidden (graceful fallback).

## Reference

- [src/lib/auth-options.ts](../src/lib/auth-options.ts) – NextAuth Google provider
- [src/app/api/auth/providers/route.ts](../src/app/api/auth/providers/route.ts) – returns `{ google: true }` when configured
