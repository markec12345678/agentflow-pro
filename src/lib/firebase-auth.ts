/**
 * Firebase Authentication Adapter for NextAuth
 *
 * Use Firebase Auth as a NextAuth provider
 */

import type { Provider } from "next-auth/providers";
import { auth } from "@/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  UserCredential,
} from "firebase/auth";

const firebaseProvider: Provider = {
  id: "firebase",
  name: "Firebase",
  type: "credentials",
  credentials: {},
  async authorize(credentials) {
    // This is handled client-side with Firebase SDK
    return null;
  },
};

// Client-side Firebase auth helpers
export const firebaseAuth = {
  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },

  async signOut(): Promise<void> {
    return signOut(auth);
  },

  getCurrentUser() {
    return auth.currentUser;
  },
};

export default firebaseProvider;
