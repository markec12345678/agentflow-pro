/**
 * Firebase Configuration
 *
 * For Firebase JS SDK v7.20.0 and later
 * measurementId is optional
 *
 * Project: agentflow-auth
 * https://console.firebase.google.com/project/agentflow-auth
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBc5yHZk-eYAFjetf2TLys9pd43xH4SvLE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "agentflow-auth.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "agentflow-auth",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "agentflow-auth.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "114548306327",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:114548306327:web:6915dbeaa1a042bb00d4d2",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GBDT20NL0Q",
};

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only on client side
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
