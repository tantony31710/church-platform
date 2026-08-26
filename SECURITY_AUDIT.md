# ChurchConnect Security Audit

## Scope

This review covers the browser authentication flow, Firestore rules, Express API, Python execution boundary, Cloud Functions point-award path, deployment secrets, and administrator provisioning.

## Implemented controls

| Area | Control | Status |
|---|---|---|
| Authentication | Firebase ID tokens are required for all RAG, ML, analytics, and workbench endpoints | Implemented |
| Admin identity | Admin API access requires the configured `ADMIN_EMAIL`, a verified Firebase email, the Firebase `{ admin: true }` custom claim, and a Firestore profile with `role: admin` | Implemented |
| Admin UI | Login is split into Volunteer and Administrator tabs; admin-only tabs, QR broadcast, and admin hub are role-gated | Implemented |
| User privacy | Volunteers can read only their own private user document; live leaderboard data is served through a separate read-only projection | Implemented |
| Point integrity | Client writes cannot change points, role, completed-task counters, attendance counters, or badges | Implemented |
| Point awarding | `onTaskCompleted` awards task points only on a transition into `completed`, in a transaction, and does not double-award later writes | Implemented |
| Attendance integrity | Attendance creation is limited to the authenticated user and requires `pointsAwarded == 0` | Implemented |
| Task integrity | Volunteer claim and assigned-task updates are field-limited and preserve title, owner, and point value | Implemented |
| API payloads | JSON body size is capped at 256 KB; RAG `top_k` is bounded to 1–5; Python payloads and stdout are bounded | Implemented |
| API abuse | General and analysis-specific in-memory rate limits are enabled | Implemented |
| Python execution | Workbench code is length-limited, blocks dunder access and dangerous builtins, and allows only `json`, `math`, and `collections` imports | Implemented |
| Secret handling | Admin credentials and Gemini keys are server-only; only Firebase browser configuration and the designated email use `VITE_*` variables | Implemented |
| Deployment runtime | Dockerfile provides Node 20 and Python 3 for the combined Express/Python service | Implemented |

## Verification performed

The following checks passed during implementation:

| Test | Result |
|---|---|
| Frontend TypeScript compiler | Passed |
| Vite production build | Passed; existing large-chunk warning remains |
| Express production bundle | Passed |
| Firebase Functions type-check and build | Passed |
| Python syntax checks | Passed |
| Python RAG, churn, clustering, forecast, and optimizer smoke tests | Passed |
| Firestore emulator task completion test | Passed; 15 points awarded exactly once |
| Firestore Rules emulator test | Passed; private profiles and protected writes denied as expected |
| Express unauthenticated RAG request | Passed; returned HTTP 401 |
| Analyst pipeline feature/report test | Passed |

## Residual operational risks

The application is code-ready but cannot identify the real administrator until `ADMIN_EMAIL` and `VITE_ADMIN_EMAIL` are replaced with the user’s actual address and the Firebase custom claim is provisioned with `admin_bootstrap.py`. The Express service also cannot verify tokens in production until a Firebase Admin service account is supplied through Secret Manager or equivalent server-only environment variables.

The current in-memory rate limiter is appropriate for a single Cloud Run instance but is not globally coordinated across multiple replicas. If the API is scaled horizontally or placed behind a public gateway, add a gateway-level quota or a shared rate-limit store. Cloud Run deployment should route `/api/*` to the Express service and should not expose Admin SDK credentials or Gemini keys to the Vite client.

The Python workbench is constrained but remains an administrator-only feature. Keep the allow-list narrow, review new imports before permitting them, and treat all analyst output as operational decision support rather than an automated pastoral or safeguarding decision.
