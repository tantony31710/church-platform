# Church Volunteer Platform

Volunteer matching, attendance (QR check-in), and points/leaderboard
for a church community, built on Next.js + Firebase.

## Structure

- `app/` — Next.js App Router pages (auth routes + role-gated dashboard)
- `components/` — UI components, grouped by feature
- `lib/` — Firebase client/admin init, shared types, auth context
- `functions/` — Cloud Functions (points calculation, runs server-side
  via Admin SDK — separate deploy target from the Next.js app)
- `firestore.rules` — security rules enforcing admin/volunteer RBAC
- `firestore.indexes.json` — composite indexes the queries in this
  app require (Firestore will also prompt you for these the first
  time an unindexed query runs, if you forget to deploy this file)

## Setup

1. `npm install` in the project root, then `cd functions && npm install`
2. Create a Firebase project, enable Firestore + Authentication (Email/Password)
3. Copy `.env.local.example` to `.env.local` and fill in your Firebase
   client config (Project Settings > General > Your apps)
4. For the Admin SDK (functions + firestore_data_utils.py), generate a
   service account key (Project Settings > Service Accounts) — do NOT
   commit it
5. `firebase deploy --only firestore:rules,firestore:indexes,functions`
6. `npm run dev`

## Build order (recommended)

1. Get `TaskList` + `TaskCard` working against a real Firestore project
   in test mode (permissive rules) — confirm the volunteer matching
   loop works end to end
2. Deploy `firestore.rules` and confirm claiming a task still works
   (rules bugs show up as silent permission-denied errors here)
3. Deploy the Cloud Functions and confirm points actually increment
   on task completion
4. Layer in the QR attendance flow
5. Layer in the 3D hub, Framer Motion polish, and Insights charts last
   — these are presentation, not logic, and are much easier to add to
   a working app than logic is to add to a pretty one
