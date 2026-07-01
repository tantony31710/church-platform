// Server-only Firebase Admin init. Never import this file from a
// component that could end up in a client bundle — it uses a service
// account with full database access and no security rules applied.
// Safe to import from: Route Handlers (app/api/**/route.ts),
// Server Actions, and Cloud Functions.

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

// Supports two ways of providing credentials, since both are common
// depending on how a hosting provider's env var UI behaves:
//
// 1. FIREBASE_SERVICE_ACCOUNT (recommended for Vercel) — paste the
//    ENTIRE downloaded JSON file as the value of one env var. This
//    avoids the classic "private key newlines got mangled" problem
//    that happens when a multi-line PEM key is split across separate
//    variables and re-escaped by a dashboard UI.
//
// 2. FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
//    — three separate variables, useful for providers where pasting
//    a large multi-line JSON blob into one field isn't practical.
function getCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (raw) {
    let parsed: { project_id: string; client_email: string; private_key: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON. Make sure you pasted the ' +
          'entire contents of the downloaded serviceAccountKey.json file, unmodified.'
      );
    }
    return cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    });
  }

  return cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Escaped newlines in env vars need to be restored.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  });
}

if (!getApps().length) {
  adminApp = initializeApp({ credential: getCredential() });
} else {
  adminApp = getApps()[0];
}

export const adminDb = getFirestore(adminApp);
export default adminApp;
