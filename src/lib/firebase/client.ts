// Client-side Firebase init. In Vite, only env vars prefixed VITE_
// are exposed to browser code (read via import.meta.env, not
// process.env — that's a Node/webpack concept that doesn't exist in
// Vite's browser bundle).
//
// Unlike the Next.js version of this file, there's no SSR/prerender
// pass here to guard against — Vite ships a plain client-side SPA, so
// this always runs in the browser. That removes an entire category of
// bugs (initializeFirestore throwing during a Node-side prerender).

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForPreviewModeOnly12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'church-platform.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'church-platform',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'church-platform.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Offline persistence: caches reads in IndexedDB and queues writes
// while offline, replaying them once connectivity returns — the
// piece that matters for a church hall with flaky wifi.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
export default app;
