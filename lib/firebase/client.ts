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

// Firebase's client SDKs are meant to run in the browser, but Next.js
// still executes this module once during server-side prerendering of
// 'use client' components (to produce their initial HTML). In that
// pass there's no window and often no real env vars loaded, and
// getAuth()/initializeFirestore() throw immediately on an invalid
// API key — which crashes the *entire* build, not just this page.
//
// Guarding with typeof window !== 'undefined' skips real
// initialization during that server pass and swaps in a proxy that
// throws only if something actually tries to use it server-side
// (which would be a real bug worth surfacing, just not at build time).
const isBrowser = typeof window !== 'undefined';

// getApps() guard prevents "Firebase app already exists" errors during
// Next.js hot reload in development.
const app = isBrowser ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : ({} as ReturnType<typeof initializeApp>);

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
function initDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = isBrowser ? initDb() : (null as unknown as ReturnType<typeof initDb>);
export const auth = isBrowser ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
export default app;
