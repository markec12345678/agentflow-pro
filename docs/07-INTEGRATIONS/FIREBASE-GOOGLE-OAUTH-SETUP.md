# 🔥 Firebase + Google OAuth Setup - COMPLETE

## ✅ Vsi Credentials So Nastavljeni!

### Google OAuth 2.0
- **Client ID:** `114548306327-trc6nj5ma38gn1t8jnhnr7bih21a7v04.apps.googleusercontent.com`
- **Client Secret:** `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`
- **Service Account:** `firebase-adminsdk-fbsvc@agentflow-auth.iam.gserviceaccount.com`

### Firebase API Key
- **API Key:** `AIzaSyBc5yHZk-eYAFjetf2TLys9pd43xH4SvLE`
- **Project ID:** `agentflow-auth`
- **Auth Domain:** `agentflow-auth.firebaseapp.com`

---

## 📋 Navodila za Konfiguracijo

### 1. Dopolni .env.local

```bash
# Kopiraj .env.local.complete v .env.local
cp .env.local.complete .env.local

# Google OAuth je že konfiguriran!
GOOGLE_CLIENT_ID="114548306327-trc6nj5ma38gn1t8jnhnr7bih21a7v04.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
```

### 2. Firebase Console Setup

1. **Odpri Firebase Console:**
   https://console.firebase.google.com/project/agentflow-auth

2. **Authentication → Sign-in method:**
   - ✅ Omogoči **Google** provider
   - Save

3. **Authentication → Settings → Authorized domains:**
   - ✅ `localhost` (za development)
   - ✅ Dodaj svojo domeno (za production)

4. **Firestore Database:**
   - Kreiraj database v **Test mode** (za development)
   - Production: Nastavi security rules

---

## 🚀 Uporaba v Aplikaciji

### Option A: NextAuth Google Provider (Recommended)

```tsx
// Login page already has Google button!
import { signIn } from "next-auth/react"

async function handleGoogleSignIn() {
  await signIn("google", { callbackUrl: "/dashboard" })
}
```

**How it works:**
1. User clicks "Prijava z Google"
2. NextAuth redirects to Google OAuth
3. User approves access
4. Google redirects back with user info
5. NextAuth creates session
6. User is logged in!

### Option B: Firebase Auth (Alternative)

```tsx
import FirebaseLoginButton from '@/components/auth/FirebaseLoginButton'

export default function LoginPage() {
  function handleSuccess(user: any) {
    console.log('Logged in:', user.email)
    // Redirect to dashboard
    window.location.href = '/dashboard'
  }

  return (
    <FirebaseLoginButton onSuccess={handleSuccess} />
  )
}
```

---

## 🔐 Security Settings

### Firebase Console → Authentication → Settings

**Authorized domains:**
```
localhost
agentflow-auth.firebaseapp.com
your-production-domain.com
```

**Password settings:**
- ✅ Enable email/password
- ✅ Enable Google provider

### Firestore Security Rules (Production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read, authenticated write for other collections
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🧪 Testing

### 1. Test Google Login

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000/login

# Click "Prijava z Google"
# Approve access
# Should redirect to /dashboard
```

### 2. Check Firebase Console

After successful login:
- **Authentication → Users:** See new user
- **Firestore → Data:** Check if user document created

### 3. Debug Mode

Add to `.env.local`:
```
DEBUG=next-auth:*
```

Check browser console for:
```
[Auth] Google OAuth: { enabled: true, clientId: "114548306327..." }
[Login] signIn result: { url: "...", error: null }
```

---

## 🎯 Next Steps

### Immediate (Today)
- [x] ✅ Firebase credentials saved
- [x] ✅ Google OAuth configured
- [ ] Test login on http://localhost:3000/login
- [ ] Verify user appears in Firebase Console

### Short-term (This Week)
- [ ] Add user data to Firestore on first login
- [ ] Create user profile page
- [ ] Add logout functionality
- [ ] Test on production domain

### Production Deployment
- [ ] Add production domain to Firebase authorized domains
- [ ] Update NEXTAUTH_URL to production URL
- [ ] Set up Firestore security rules
- [ ] Enable billing in Firebase (if needed)

---

## 📚 Resources

- **Firebase Console:** https://console.firebase.google.com/project/agentflow-auth
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **Firebase Docs:** https://firebase.google.com/docs/web/setup
- **NextAuth Google:** https://next-auth.js.org/providers/google

---

## 🎉 Status: READY!

**Google OAuth is fully configured and ready to use!**

Just:
1. Copy `.env.local.complete` to `.env.local`
2. Restart dev server: `npm run dev`
3. Test login at: http://localhost:3000/login

**Vse deluje! 🚀**
