# 📦 Firebase Setup Guide

## ✅ Firebase je nameščen in konfiguriran!

### Nameščeni Package-i
- ✅ `firebase` - Firebase SDK

### Konfiguracijske Datoteke
- ✅ `src/lib/firebase.ts` - Firebase initialization
- ✅ `src/lib/firebase-auth.ts` - Firebase Auth helpers
- ✅ `.env` - Firebase config variables

---

## 🔧 Uporaba

### 1. Client-Side Firebase Auth

```tsx
'use client'

import { firebaseAuth } from '@/lib/firebase-auth'

export default function LoginButton() {
  async function handleGoogleLogin() {
    try {
      const result = await firebaseAuth.signInWithGoogle()
      console.log('Logged in as:', result.user.email)
      // Redirect or update UI
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <button onClick={handleGoogleLogin}>
      Prijava z Google
    </button>
  )
}
```

### 2. Firebase Firestore Database

```tsx
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

async function createDocument() {
  await addDoc(collection(db, 'users'), {
    name: 'John Doe',
    email: 'john@example.com'
  })
}
```

### 3. Firebase Storage

```tsx
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

async function uploadFile(file: File) {
  const storageRef = ref(storage, `uploads/${file.name}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return url
}
```

---

## 🔥 Firebase Console

**Project:** agentflow-auth  
**URL:** https://console.firebase.google.com/project/agentflow-auth

### Omogočene Storitve:
- ✅ Authentication (Google Provider)
- ✅ Firestore Database
- ✅ Storage
- ✅ Analytics

---

## 📊 Analytics

Firebase Analytics je avtomatsko omogočen za spremljanje uporabe:

```tsx
import { analytics } from '@/lib/firebase'
import { logEvent } from 'firebase/analytics'

// Log custom event
logEvent(analytics, 'login_success', {
  method: 'google'
})
```

---

## 🔐 Varnostna Pravila

### Firestore Rules (primer)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules (primer)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🚀 Next Steps

1. **Dodaj Firebase Auth v Login Page:**
   - Ustvari komponento `FirebaseLogin.tsx`
   - Integriraj z NextAuth

2. **Nastavi Firestore Database:**
   - Kreiraj kolekcije v Firebase Console
   - Nastavi security rules

3. **Integriraj Analytics:**
   - Dodaj event tracking
   - Nastavi conversion goals

---

## 📚 Dokumentacija

- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Firebase Auth](https://firebase.google.com/docs/auth/web/start)
- [Firestore](https://firebase.google.com/docs/firestore/quickstart)
- [Storage](https://firebase.google.com/docs/storage/web/start)
- [Analytics](https://firebase.google.com/docs/analytics/get-started)

---

**Status:** ✅ Pripravljeno za uporabo!
