// ============================================================
// Firebase Client Configuration & Initialization
// ============================================================
// Uses Firebase Spark (Free Tier) services:
// - Firebase Authentication (Email/Password & Google Sign-In)
// - Cloud Firestore (NoSQL real-time document database)
//
// Safe initialization: If environment variables are not yet
// set in .env.local, the app remains fully functional in demo mode.
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if credentials have been provided
export const isFirebaseConfigured = () => {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-api-key-here'
  );
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (typeof window !== 'undefined' || isFirebaseConfigured()) {
  try {
    if (isFirebaseConfigured()) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      
      // Use long-polling to prevent WebChannel 10s connection timeouts
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      } catch {
        db = getFirestore(app);
      }

      googleProvider = new GoogleAuthProvider();
      // Enforce account chooser prompt on Google sign-in
      googleProvider.setCustomParameters({ prompt: 'select_account' });
    }
  } catch (err) {
    console.warn('Firebase initialization notice:', err.message);
  }
}

export { app, auth, db, googleProvider };
