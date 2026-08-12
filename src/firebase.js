// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = REQUIRED_VARS.filter(k => !import.meta.env[k]);
export const isConfigured = missing.length === 0;

if (!isConfigured) {
  console.error(
    '⚠️ Missing Firebase environment variables:\n' + missing.join('\n') +
    '\n\nAdd them to your Vercel project: Settings → Environment Variables'
  );
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize if config is valid — avoids silent crash on missing env vars
const app = isConfigured ? initializeApp(firebaseConfig) : null;

export const auth           = app ? getAuth(app)      : null;
export const db             = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

