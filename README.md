# Church Volunteer Platform (Vite)

Volunteer matching, attendance (QR check-in), and points/leaderboard
for a church community — Vite + React + TypeScript + Firebase.

Migrated from Next.js. The app is 100% client-rendered (Firebase
Auth/Firestore only work in the browser anyway), so Vite is a more
direct fit than Next.js was — no server-side prerendering, no
`ssr: false` boundary rules, no server/client component split.

## Structure

- `src/pages/` — one file per route (React Router, not file-based routing)
- `src/components/` — UI components, grouped by feature
- `src/lib/` — Firebase init, shared types, auth context, hooks
- `functions/` — Cloud Functions (points calculation via Admin SDK —
  separate deploy target, unaffected by the Next.js → Vite switch)
- `firestore.rules` / `firestore.indexes.json` — unchanged from before

## Setup

1. `npm install`, then `cd functions && npm install`
2. Create/use a Firebase project, enable Firestore + Email/Password Auth
3. Copy `.env.example` to `.env` and fill in `VITE_FIREBASE_*` values
   (Vite requires the `VITE_` prefix to expose a var to browser code —
   this replaces Next.js's `NEXT_PUBLIC_` prefix)
4. `firebase deploy --only firestore:rules,firestore:indexes,functions`
5. `npm run dev`

## Deploying to Vercel

Vercel auto-detects Vite projects. Framework preset: Vite. Build
command: `npm run build`. Output directory: `dist`.

`vercel.json` in this repo handles the one Vite-specific gotcha:
without it, refreshing the browser on a route like `/tasks` 404s,
because there's no actual file at that path — React Router only
knows about it client-side. The rewrite rule sends every path to
`index.html` so React Router can take over.

Env vars go in Vercel's dashboard exactly like before, just renamed
to the `VITE_` prefix instead of `NEXT_PUBLIC_`.

## Live application behavior

The authenticated workspace is backed by Firebase Auth and Firestore. Users, tasks, attendance records, organization settings, announcements, and the active check-in session are synchronized across browser sessions. The browser no longer provides demo persona switching, role toggling, synthetic volunteer generation, or arbitrary bonus points.

Every newly registered volunteer is created with `points: 0`, `tasksCompletedCount: 0`, and `attendanceCount: 0`. Attendance is stored as engagement telemetry and does not award points. The `onTaskCompleted` Cloud Function awards the task’s `pointsValue` exactly once when a task transitions to `completed`, and updates the volunteer profile and leaderboard transactionally.

### Provisioning the one administrator

Create the administrator’s Firebase Auth account, register the account through the application if needed, and then run the trusted bootstrap script from an environment with Firebase Admin credentials:

```bash
python admin_bootstrap.py --email admin@example.com --promote
python admin_bootstrap.py --list
```

Promotion demotes any other admin account before assigning the `admin` role, so the live database has one administrator. The browser cannot promote users, toggle roles, or switch personas.

### Python AI and data services

The Express server exposes the Python engine at `/api/python/rag-query`, `/api/python/churn-analysis`, `/api/python/clustering`, `/api/python/attendance-forecast`, `/api/python/optimize-tasks`, and `/api/python/run`. The **Insights & AI** route renders these capabilities through the Python RAG assistant, churn/retention model, task optimizer, interactive data workbench, attendance analytics, embedding clusters, and drift views. The workbench receives live users, tasks, and attendance records and runs with a constrained standard-library surface.

For local operation, start the application with `npm run dev`. Python 3 is required. For production, deploy the Firebase rules and Cloud Functions, configure all `VITE_FIREBASE_*` variables from `.env.example`, and deploy the Vite output through Vercel or another static hosting provider with the included SPA rewrite.
