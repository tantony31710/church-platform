// Client-side Firebase init. Safe to run in the browser.
// These NEXT_PUBLIC_ values are not secrets — Firebase security is
// enforced by firestore.rules, not by hiding this config.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// getApps() guard prevents "Firebase app already exists" errors during
// Next.js hot reload in development.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Offline persistence: caches reads in IndexedDB and queues writes
// while offline, replaying them once connectivity returns. This is
// the piece that matters for a church hall with flaky wifi — a
// volunteer marking attendance mid-dropout still gets a write queued
// locally instead of a hard failure.
//
// persistentMultipleTabManager lets multiple open tabs (or the same
// site opened twice) share one cache instead of fighting over a lock,
// which otherwise throws "failed-precondition" in the second tab.
//
// initializeFirestore (not getFirestore) must be called before any
// other Firestore call on this app instance, and only once per app —
// calling it twice throws. In dev, Next.js Fast Refresh can re-run
// this module without a full reload, so the try/catch falls back to
// getFirestore() (which just returns the already-initialized
// instance) instead of crashing on the second run.
let dbInstance: ReturnType<typeof initializeFirestore>;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

export const auth = getAuth(app);
export default app;
