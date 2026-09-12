import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDummyApiKeyForLocalVerification123",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-1234567890",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize analytics safely (analytics may not load/work in some iframe/sandboxed settings)
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Analytics initialization skipped:", err);
});

const dbId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

