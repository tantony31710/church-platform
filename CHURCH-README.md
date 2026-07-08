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

## Recent Architectural Improvements

- **AI/Data Pipeline:** Implemented data lineage tracking in Cloud Functions for auditability.
- **UX/Accessibility:** Enhanced `InteractionHub` with ARIA roles/labels for WCAG compliance.
- **Security:** Hardened Firestore security rules with strict Role-Based Access Control (RBAC).

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
