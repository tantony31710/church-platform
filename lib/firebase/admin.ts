// Server-only Firebase Admin init. Never import this file from a
// component that could end up in a client bundle — it uses a service
// account with full database access and no security rules applied.
// Safe to import from: Route Handlers (app/api/**/route.ts),
// Server Actions, and Cloud Functions.

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Escaped newlines in env vars need to be restored.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} else {
  adminApp = getApps()[0];
}

export const adminDb = getFirestore(adminApp);
export default adminApp;
