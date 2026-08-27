# ChurchConnect Operations Runbook

This runbook describes the production topology and the commands used to operate the application. The browser is a Firebase Auth/Firestore client. The Express server is the same-origin API gateway for the Python RAG/ML tools and the optional Gemini answer layer. Firebase Cloud Functions are the trusted event handlers that award task points and update attendance counters.

## 1. Production topology

| Component | Responsibility | Recommended runtime |
|---|---|---|
| Vite client | Volunteer and administrator UI | Static files on Vercel, Firebase Hosting, or a CDN |
| Express server | Protected AI/data API and Python subprocess gateway | Cloud Run or another long-running Node service |
| `python_engine.py` | RAG retrieval, churn scoring, clustering, forecasting, optimization, and constrained workbench | Same container as Express |
| Firebase Functions | Trusted task-completion and attendance triggers | Firebase Functions, Node 20 |
| Firestore | Users, tasks, attendance, settings, leaderboard | Firebase production project |

Vercel can host the Vite client, but the current Express server starts a Python subprocess and should not be treated as a static-only deployment. In production, either run the Express/Python service on Cloud Run and configure the client’s same-origin API proxy, or split the API into a separately deployed service and point the client requests at that service through a controlled server-side proxy.

## 2. Run the Python and Express services locally

Install Node dependencies from the repository root and Python dependencies used by the optional analyst tools:

```bash
npm install
python3 -m venv .venv
. .venv/bin/activate
pip install firebase-admin pandas numpy
```

Copy `.env.example` to `.env` and fill the Firebase client variables, `ADMIN_EMAIL`, and either `FIREBASE_SERVICE_ACCOUNT` or the three split server credential variables. Do not commit `.env`, service-account JSON, or private keys.

Start the combined service:

```bash
npm run dev
```

The Express server serves the Vite application and exposes the protected routes under `/api`. The Python engine is not a second HTTP server: Express starts one short-lived Python process per analysis request. This avoids maintaining a stale Python process and ensures each request receives the current Firestore snapshot supplied by the authenticated browser.

For production, build and start the Node service inside a container or Cloud Run revision:

```bash
npm run build
NODE_ENV=production PORT=8080 node dist/server.cjs
```

Set `FIREBASE_SERVICE_ACCOUNT`, `ADMIN_EMAIL`, and `GEMINI_API_KEY` as secret environment variables in the service runtime. The service must have Python 3 installed because it executes `python_engine.py`. The API rejects requests without a valid Firebase ID token, requires the designated admin claim for sensitive analytics routes, limits request body size, rate-limits API calls, caps RAG result count, and kills analyses that exceed the timeout.

## 3. Test task points with the Firebase Emulator

Install the Firebase CLI once if it is not already installed:

```bash
npm install --global firebase-tools
firebase login
```

Run the Firestore and Functions emulators from the repository root. The project uses the local ID `church-platform-local`, so no production project is touched:

```bash
npm run firebase:emulators
```

In a second terminal, compile and run the integration test:

```bash
npm install
npm run test:points:emulator
```

The test creates a volunteer at zero points, creates an assigned 15-point task, changes the task to `completed`, waits for the `onTaskCompleted` trigger, and asserts `points === 15` and `tasksCompletedCount === 1`. It then writes to the already-completed task and asserts the balance remains 15. A successful run prints:

```text
PASS: completed task awarded 15 points exactly once.
```

If the test times out, inspect the Functions emulator terminal. Common causes are a missing Java runtime for the Firestore emulator, an uncompiled Functions bundle, or the emulator running under a different project ID. The emulator UI is available at `http://127.0.0.1:4000` when enabled.

## 4. Provision exactly one administrator

Choose your real administrator email and use the same normalized address in both `ADMIN_EMAIL` and `VITE_ADMIN_EMAIL`. The address is not a secret; the service-account credential is secret.

First create the account through Firebase Authentication or the volunteer registration flow. Then, from a trusted machine with Firebase Admin credentials, run:

```bash
export ADMIN_EMAIL='your-real-admin-email@example.com'
python3 admin_bootstrap.py --email "$ADMIN_EMAIL" --promote
python3 admin_bootstrap.py --list
```

Promotion refuses any email that does not exactly match `ADMIN_EMAIL`, demotes any other Firestore admin records, sets the Firebase custom claim `{ "admin": true }` on the designated account, and clears that claim from other accounts. The designated account must sign out and sign back in, or refresh its ID token, after the claim changes. The browser also checks the email, the custom claim, and the Firestore role before showing administrator UI.

There is intentionally no client-side role switcher. Other emails can register and sign in only as volunteers. They cannot create an admin profile, change roles, edit points, write leaderboard documents, access admin analytics routes, or open the leader QR broadcast view.

## 5. Deploy Firestore rules and Functions with production credentials

Select the production Firebase project and verify the active account before deploying:

```bash
firebase login
firebase projects:list
firebase use --add
firebase use YOUR_PRODUCTION_PROJECT_ID
```

Install and compile the Functions package:

```bash
cd functions
npm install
npm run build
cd ..
```

Deploy only the Firestore rules, indexes, and Functions first:

```bash
firebase deploy --project YOUR_PRODUCTION_PROJECT_ID \
  --only firestore:rules,firestore:indexes,functions
```

Set the production server environment separately. Do not put Admin SDK credentials in Vite variables because `VITE_*` values are public browser configuration:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_APP_ID
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_ADMIN_EMAIL
ADMIN_EMAIL
FIREBASE_SERVICE_ACCOUNT  # server only, or use the split credential variables
GEMINI_API_KEY            # optional; local RAG still works without it
```

Deploy the client after the production environment is configured:

```bash
npm run build
```

For Cloud Run, deploy the Node/Python service from a container with `PORT=8080`, then configure the client hosting layer to route `/api/*` to that service. For Vercel, host only the static Vite client unless you separately adapt the Express/Python gateway to the platform’s serverless runtime.

## 6. Security verification checklist

Run the following checks after every production deployment:

| Check | Expected result |
|---|---|
| `POST /api/python/rag-query` without `Authorization` | `401 Firebase ID token required` |
| Admin analytics route with a volunteer token | `403 Only the designated administrator...` |
| Admin analytics route with missing `ADMIN_EMAIL` | `503` and no model execution |
| Volunteer creates a user profile with points above zero | Firestore denied |
| Volunteer updates `points`, `role`, or trusted counters | Firestore denied |
| Volunteer writes attendance with non-zero `pointsAwarded` | Firestore denied |
| Browser writes leaderboard data | Firestore denied |
| Second update to a completed task | No second point award |
| Python workbench imports `os` or calls `open` | Workbench rejects the code |
| Oversized API body or runaway Python job | Request rejected or subprocess terminated |

Treat the Firebase service account as a production secret. Rotate it through the cloud provider’s secret manager if it is ever exposed, then redeploy the Express service and rerun the admin-claim provisioning command.

## 7. Analyst and engineer workflow

The repository contains three operational layers: `python_engine.py` for request-scoped RAG/ML execution, `ai_engineering.py` for feature engineering and retention experiments, and `analytics_pipeline.py` for deterministic data-quality reports and ML-ready feature exports.

To analyze a JSON export without touching production:

```bash
python3 analytics_pipeline.py exports/church-data.json --output reports/church-quality.json
```

The report includes counts, total and average points, skill demand versus supply, one feature row per volunteer, and quality issues such as duplicate IDs, invalid roles, negative point values, and missing attendance owners. It intentionally does not invent volunteers, tasks, or attendance records.

The browser’s administrator workbench sends no authoritative data values to the server. The protected Express API reads users, tasks, and attendance from Firestore with the verified administrator’s Admin SDK credentials, then passes that snapshot to Python. This prevents a client from submitting a fabricated dataset to influence church-wide analysis.

## 8. Cloud Run deployment example

Build and push the combined Node/Python service to Artifact Registry. Run these commands from the repository root after enabling Cloud Run, Artifact Registry, and Cloud Build in the Google Cloud project:

```bash
gcloud auth login
gcloud config set project YOUR_PRODUCTION_PROJECT_ID
gcloud artifacts repositories create churchconnect --repository-format=docker --location=REGION

gcloud builds submit --tag REGION-docker.pkg.dev/YOUR_PRODUCTION_PROJECT_ID/churchconnect/api:latest
```

Store the Firebase Admin credential and Gemini key in Secret Manager rather than in the image or source tree:

```bash
echo -n "$FIREBASE_SERVICE_ACCOUNT" | gcloud secrets create churchconnect-firebase-admin --data-file=-
echo -n "$GEMINI_API_KEY" | gcloud secrets create churchconnect-gemini-key --data-file=-
```

Deploy the API container with the designated admin email and secret references. The Cloud Run service account must be allowed to access both secrets:

```bash
gcloud run deploy churchconnect-api \
  --image REGION-docker.pkg.dev/YOUR_PRODUCTION_PROJECT_ID/churchconnect/api:latest \
  --region REGION \
  --platform managed \
  --set-env-vars ADMIN_EMAIL=YOUR_REAL_ADMIN_EMAIL \
  --set-secrets FIREBASE_SERVICE_ACCOUNT=churchconnect-firebase-admin:latest,GEMINI_API_KEY=churchconnect-gemini-key:latest \
  --allow-unauthenticated
```

`--allow-unauthenticated` applies to the HTTPS transport only; every `/api` handler still requires a Firebase ID token, and sensitive endpoints additionally require the designated email, verified-email state, custom admin claim, and Firestore admin role. If you prefer a private Cloud Run service, put an authenticated gateway in front of it and keep the same application-level token checks.

After deployment, configure the Vite host to route `/api/*` to the Cloud Run URL. Do not put `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PRIVATE_KEY`, or `GEMINI_API_KEY` in `VITE_*` variables because Vite exposes `VITE_*` values to browsers.

## 9. Configure and test Gemini locally

Gemini is optional for retrieval. The Python `rag-search` action can return matching church knowledge documents without a model key. When `GEMINI_API_KEY` is present, `/api/ai/ask-rag` uses Gemini to turn the retrieved documents into a concise answer. The browser never receives the key.

Create the local environment file and fill the values:

```bash
cp .env.example .env
```

Use this separation:

```dotenv
# Public Firebase browser configuration; these are safe to embed in the frontend.
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_ADMIN_EMAIL=your-real-admin-email@example.com

# Server-only values; never prefix these with VITE_.
ADMIN_EMAIL=your-real-admin-email@example.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
GEMINI_API_KEY=your-gemini-api-key
```

The service-account JSON must be one-line valid JSON if placed in `FIREBASE_SERVICE_ACCOUNT`. Alternatively leave it blank and provide `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. The `dotenv` package loads `.env` when `npm run dev` starts.

Start the application and check the non-secret status fields:

```bash
npm run dev
curl http://127.0.0.1:3000/api/health
```

With all server values present, the response includes `pythonReady: true`, `adminConfigured: true`, and `geminiConfigured: true`. A `401` from a protected RAG route without an `Authorization: Bearer <Firebase ID token>` header is expected.

To test the feature in the browser, open the local application, sign in with a Firebase Auth account, open **Insights → Python RAG & SOP AI**, ask a question covered by the church knowledge documents, and confirm that the answer includes retrieved-document context. The RAG route uses the signed-in Firebase session automatically. If Gemini is absent, the UI should still show the deterministic local retrieval answer; if the server is not configured, it should show an explicit API error rather than sample output.

For Vercel, add the six `VITE_FIREBASE_*` variables and `VITE_ADMIN_EMAIL` to the project’s Production environment, then redeploy. Do not add `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PRIVATE_KEY`, `ADMIN_EMAIL`, or `GEMINI_API_KEY` to Vercel unless Vercel is also running the protected Express API. In the recommended architecture, those server-only values belong in the Cloud Run service’s Secret Manager bindings, while Vercel hosts the static client and proxies `/api/*` to Cloud Run.

## 10. Troubleshoot `403 Missing or insufficient permissions` during admin bootstrap

The `google.cloud.firestore` positional-filter warning is harmless. The important error is `PERMISSION_DENIED`. It means the Python script is using credentials that do not have access to the Firebase project, or it is using credentials from a different project than the Vercel Firebase configuration.

For a reliable Windows PowerShell setup, download a service-account JSON from **Firebase Console → Project settings → Service accounts → Generate new private key**, save it locally as `serviceAccountKey.json` beside `admin_bootstrap.py`, and run:

```powershell
$env:ADMIN_EMAIL = "your-real-admin@example.com"
$env:FIREBASE_SERVICE_ACCOUNT_PATH = ".\serviceAccountKey.json"
py -3.13 admin_bootstrap.py --email $env:ADMIN_EMAIL --promote
py -3.13 admin_bootstrap.py --list
```

Confirm that the JSON’s `project_id` is the same project ID shown in the Firebase Console and the same value as `VITE_FIREBASE_PROJECT_ID` in the Vercel deployment. Keep the file out of Git; `.gitignore` already excludes `serviceAccountKey.json`. The updated bootstrap script now resolves the Firebase Auth account by UID instead of relying on a Firestore email query and returns a non-zero exit code when promotion fails.

After a successful promotion, verify the Firebase Console user has the correct email and that the Firestore profile at `users/<Firebase Auth UID>` has `role: admin`. The custom claim is not displayed in the Firestore document; it is attached to the Firebase Auth user token. Sign out and back in on the deployed site to refresh it. If the Administrator tab still returns a normal login error, first confirm the Firebase Auth account exists, Email/Password sign-in is enabled, the password is correct, and the email has been verified. If login succeeds but admin screens are unavailable, refresh the token and check `ADMIN_EMAIL`/`VITE_ADMIN_EMAIL` for exact spelling and casing-insensitive equality.

## 11. Exact Docker Compose and Cloud Build commands

`docker-compose.yml` is intended for local production-like testing; Cloud Run deploys the image built by `Dockerfile`, not the Compose file. After creating `.env`, run the combined Express/Python service locally with:

```bash
docker compose up --build
curl http://127.0.0.1:8080/api/health
```

The Compose file passes only `VITE_*` values as Docker build arguments. `ADMIN_EMAIL`, `FIREBASE_SERVICE_ACCOUNT`, and `GEMINI_API_KEY` are runtime environment values. The image listens on container port 8080 and is published locally on port 8080.

For Cloud Build, enable Artifact Registry, Cloud Build, and Cloud Run, create the repository once, and submit the provided `cloudbuild.yaml` with public Vite substitutions:

```bash
gcloud config set project YOUR_PRODUCTION_PROJECT_ID
gcloud artifacts repositories create churchconnect \
  --repository-format=docker --location=REGION

gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=REGION,_VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY",_VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID",_VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN",_VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID",_VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID",_VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET",_VITE_ADMIN_EMAIL="$ADMIN_EMAIL" .
```

Deploy the resulting image with Secret Manager bindings for the server-only values:

```bash
gcloud run deploy churchconnect-api \
  --image REGION-docker.pkg.dev/YOUR_PRODUCTION_PROJECT_ID/churchconnect/api:latest \
  --region REGION \
  --set-env-vars ADMIN_EMAIL="$ADMIN_EMAIL" \
  --set-secrets FIREBASE_SERVICE_ACCOUNT=churchconnect-firebase-admin:latest,GEMINI_API_KEY=churchconnect-gemini-key:latest \
  --allow-unauthenticated
```

## 12. Local RAG/Gemini smoke test

Create a dedicated Firebase Auth test account. Do not use a real user password in scripts or shell history. Start the app with `npm run dev`, then set the test credentials only in the current terminal session:

```bash
export VITE_FIREBASE_API_KEY='your-web-api-key'
export TEST_FIREBASE_EMAIL='rag-test@example.com'
export TEST_FIREBASE_PASSWORD='use-a-dedicated-test-password'
python3 scripts/test_rag_local.py "What is the volunteer check-in process?"
```

On Windows PowerShell:

```powershell
$env:VITE_FIREBASE_API_KEY = "your-web-api-key"
$env:TEST_FIREBASE_EMAIL = "rag-test@example.com"
$env:TEST_FIREBASE_PASSWORD = "use-a-dedicated-test-password"
py -3.13 scripts/test_rag_local.py "What is the volunteer check-in process?"
```

The test signs in through Firebase Auth, obtains a short-lived ID token, calls `/api/ai/ask-rag`, and prints the HTTP status, selected model, retrieved-document count, and answer. `modelUsed` will identify Gemini when `GEMINI_API_KEY` is loaded, or the deterministic local RAG engine when Gemini is intentionally absent.

## 13. Verify a production point award

After a real task is completed, obtain the task ID and the assignee’s Firebase Auth UID from the Firebase Console or the application. Use a service-account file from the same project and run:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_PATH = ".\serviceAccountKey.json"
py -3.13 scripts/verify_points.py \
  --task-id TASK_DOCUMENT_ID \
  --user-id FIREBASE_AUTH_UID \
  --expected-points EXPECTED_TOTAL_POINTS \
  --expected-completed-count EXPECTED_COMPLETED_TASK_COUNT
```

The script is read-only. It prints the task status, assignee, task point value, volunteer points, and completed-task count, then exits successfully only when the task is completed, assigned to the requested UID, and the optional expected totals match. It does not award or modify points.

## 14. Optional multi-admin configuration

The default configuration remains single-admin when only one email is listed. To approve more than one administrator, use a comma-separated allowlist in both the public frontend build configuration and the private server runtime configuration:

```dotenv
VITE_ADMIN_EMAILS=first-admin@example.com,second-admin@example.com
ADMIN_EMAILS=first-admin@example.com,second-admin@example.com
```

Do not rely on an email list inside Firestore Rules. Firestore Rules cannot read Cloud Run environment variables. Instead, each approved account must have a Firebase custom claim `{ "admin": true }` and a matching `users/<AUTH_UID>` document with `role: "admin"`. The rules continue to authorize the claim/profile combination, while the frontend and Express API additionally require the email to be in their respective allowlists.

Create each Firebase Auth account first, verify its email, ensure its profile document uses the exact Firebase Auth UID, and run the bootstrap command once per approved account:

```powershell
$env:ADMIN_EMAILS = "first-admin@example.com,second-admin@example.com"
$env:FIREBASE_SERVICE_ACCOUNT_PATH = "$PWD\serviceAccountKey.json"
py -3.13 .\admin_bootstrap.py --email "first-admin@example.com" --promote
py -3.13 .\admin_bootstrap.py --email "second-admin@example.com" --promote
py -3.13 .\admin_bootstrap.py --list
```

Promotion is refused for emails not in `ADMIN_EMAILS`. Existing admin records outside the allowlist and stale `admin` claims are demoted/cleared. Set the same list in Vercel as `VITE_ADMIN_EMAILS` and redeploy the frontend. Set `ADMIN_EMAILS` on Cloud Run and create a new revision. Keep `ADMIN_EMAIL` and `VITE_ADMIN_EMAIL` as one-email fallbacks during migration, but do not configure conflicting singular and plural values.

## 15. Cloud Run log troubleshooting

Get the service URL and recent revision list:

```powershell
gcloud config set project church-platform-36107
gcloud run services describe churchconnect-api --region us-central1 --format="value(status.url)"
gcloud run revisions list --service churchconnect-api --region us-central1
```

Read recent application logs:

```powershell
gcloud run services logs read churchconnect-api `
  --region us-central1 `
  --limit 100 `
  --format="table(timestamp,severity,textPayload)"
```

Stream logs while reproducing an API request:

```powershell
gcloud beta run services logs tail churchconnect-api --region us-central1
```

Filter for Express authentication, Python subprocess failures, Gemini calls, or startup failures:

```powershell
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="churchconnect-api" AND (textPayload:"API auth" OR textPayload:"Python" OR textPayload:"Gemini" OR severity>=ERROR)' `
  --project church-platform-36107 `
  --limit 100 `
  --format="table(timestamp,severity,textPayload)"
```

Check the Cloud Run revision environment contract without printing secret values:

```powershell
gcloud run services describe churchconnect-api `
  --region us-central1 `
  --format="yaml(status.url,spec.template.spec.containers[0].env,spec.template.spec.containers[0].envFrom,status.conditions)"
```

The expected health response is:

```powershell
$API_URL = gcloud run services describe churchconnect-api --region us-central1 --format="value(status.url)"
Invoke-RestMethod "$API_URL/api/health" | ConvertTo-Json
```

It should report `pythonReady: true`, `apiAuthRequired: true`, `adminConfigured: true`, and `geminiConfigured: true`. If `pythonReady` is true but RAG returns a 500, inspect `Python RAG error` and `Python engine returned invalid JSON` messages. If the server returns 401, inspect the browser’s Firebase ID token flow. If it returns 503, inspect whether the Cloud Run revision has the Firebase Admin credentials and `ADMIN_EMAILS` secret. If the response is 200 but `geminiConfigured` is false, create a new Cloud Run revision after correcting the Secret Manager binding.

For a direct authenticated request, use the local Python smoke-test client with `API_BASE_URL` set to the Cloud Run URL. Never put the Gemini key or Firebase service-account JSON in the request body or browser variables:

```powershell
$env:API_BASE_URL = $API_URL
$env:VITE_FIREBASE_API_KEY = "YOUR_FIREBASE_WEB_API_KEY"
$env:TEST_FIREBASE_EMAIL = "rag-test@example.com"
$env:TEST_FIREBASE_PASSWORD = "DEDICATED_TEST_PASSWORD"
py -3.13 .\scripts\test_rag_local.py "What is the volunteer check-in process?"
```

## 16. Inspect Vercel deployments and environment configuration

The Vercel dashboard is the safest place to inspect environment values without printing secrets. Open the project, go to **Settings → Environment Variables**, select **Production**, and confirm the public build variables `VITE_FIREBASE_PROJECT_ID`, `VITE_ADMIN_EMAILS`, and the remaining `VITE_FIREBASE_*` entries. Do not expose or copy server-only secrets into browser code.

From PowerShell, the Vercel CLI can inspect deployment status and logs after installing or using it through `npx`:

```powershell
Set-Location "C:\Users\LAP ME\Documents\Programming\Anton projects\church-platform"
npx vercel login
npx vercel link
npx vercel project ls
npx vercel ls
npx vercel inspect YOUR_DEPLOYMENT_URL --logs
```

Use the Vercel dashboard’s **Deployments → deployment → Building/Runtime Logs** view for the clearest result. Confirm that the deployment commit is the latest GitHub commit, that the build completed successfully, and that the Production environment was used. Vercel does not display secret values in logs; if a key is accidentally printed by application code, rotate it immediately.

To force a fresh production deployment from the linked repository:

```powershell
npx vercel --prod
```

The static frontend build can expose only `VITE_*` values. The Express/Python server’s `ADMIN_EMAILS`, `FIREBASE_SERVICE_ACCOUNT`, and `GEMINI_API_KEY` belong to the Cloud Run revision, not the Vercel browser build, unless the API is separately hosted by Vercel.

## 17. Read-only admin consistency check from PowerShell

Run the new wrapper from the project root:

```powershell
.\scripts\Test-AdminConsistency.ps1
```

For another approved administrator:

```powershell
.\scripts\Test-AdminConsistency.ps1 `
  -Email "second-admin@example.com" `
  -ServiceAccountPath ".\serviceAccountKey.json"
```

The check compares the Firebase Auth email and UID, email verification state, custom `{ "admin": true }` claim, and `users/<Auth UID>.role`. It exits with code 0 only when all checks pass. It never writes to Firebase. If PowerShell blocks local scripts for the current session, use:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\Test-AdminConsistency.ps1
```

## 18. Administrator redirect source files

The administrator redirect and role resolution are intentionally split across a few small files:

| File | Responsibility |
|---|---|
| `src/pages/Login.tsx` | Administrator/Volunteer tabs, email allowlist gate, Firebase password sign-in, forced claim refresh, and `/admin` versus `/tasks` navigation |
| `src/lib/auth-context.tsx` | Firebase session listener, Firestore profile lookup, custom claim verification, email allowlist check, and final `role` calculation |
| `src/pages/Admin.tsx` | Route-level guard; non-admin sessions are redirected to `/tasks` |
| `src/components/layout/DashboardLayout.tsx` | Authenticated-shell guard and visibility of the Admin Hub navigation item |
| `src/lib/firebase/client.ts` | Public Firebase browser configuration and initialization |
| `admin_bootstrap.py` | Trusted promotion, custom claim assignment, Firestore role synchronization, and admin allowlist enforcement |
| `firestore.rules` | Server-enforced claim/profile checks and protected role/points writes |

The role is considered administrator only when the email is approved, verified, has the custom claim, and has the Firestore role. A Firestore `role: admin` field by itself is deliberately insufficient.

## 19. Safely adding a secondary administrator

A secondary administrator must be a separate Firebase Authentication user whose email address is explicitly approved. The project operator account used for Firebase Console or Firebase CLI does not automatically become an application administrator.

First create the second person’s Auth account in **Authentication → Users → Add user**, or have the person register through the application. Use an email address whose mailbox they control, and have them complete email verification before granting administrator access. Do not share passwords or service-account files.

Add the normalized email to the approved lists. For a local bootstrap session in PowerShell:

```powershell
Set-Location "C:\Users\LAP ME\Documents\Programming\Anton projects\church-platform"

$env:ADMIN_EMAILS = "tantony31710@gmail.com,second-admin@example.com"
$env:FIREBASE_SERVICE_ACCOUNT_PATH = "$PWD\serviceAccountKey.json"

py -3.13 .\admin_bootstrap.py `
  --email "second-admin@example.com" `
  --promote
```

The same comma-separated list must be configured as the Production Vercel build variable:

```text
VITE_ADMIN_EMAILS=tantony31710@gmail.com,second-admin@example.com
```

If the Express/Python API is deployed separately, configure its server-only variable with the same list:

```text
ADMIN_EMAILS=tantony31710@gmail.com,second-admin@example.com
```

Redeploy Vercel after changing `VITE_ADMIN_EMAILS`, because Vite embeds public variables during the build. Redeploy the API revision after changing `ADMIN_EMAILS`. Then run the read-only checker for each approved address:

```powershell
.\scripts\Test-AdminConsistency.ps1 -Email "second-admin@example.com"
```

The bootstrap resolves the Auth user by email and writes the role to the exact `users/<Auth UID>` document. It also assigns the Auth custom claim. It does not authorize arbitrary emails, and a client cannot grant itself a role. If an approved email has no Auth account or no matching profile, promotion fails rather than guessing a UID.

## 20. Firestore administrator collection policy

Firestore rules are a second, server-enforced boundary. A browser is authorized as an administrator only when the signed-in token contains `admin: true`, the token contains `email_verified: true`, and the matching `users/<Auth UID>` document has `role: 'admin'`.

| Collection | Volunteer access | Administrator access | Client writes |
|---|---|---|---|
| `admin-data/{docId}` | None | Read and write | Admin only |
| `model_benchmarks/{benchmarkId}` | None | Read and write | Admin only |
| `settings/{settingId}` | Read | Read and write | Admin only for writes |
| `leaderboard/{userId}` | Read | Read | No client writes; trusted Functions/Admin SDK only |
| `users/{userId}` | Read/update own safe fields | Read roster; no role/points updates | Role, points, counters, and badges are not client-writable |
| `tasks/{taskId}` | Read; constrained claim/complete changes | Read, create, update, delete | Validated by role and field-diff rules |

The approved email list is intentionally enforced in the client login gate, the trusted bootstrap, and the server API. Firestore rules cannot safely contain a deploy-time email allowlist. The rules instead enforce the durable Auth claim, verification state, and same-UID Firestore role. This means a stale client configuration cannot grant access, and a role field without the Auth claim is insufficient.

The emulator test covers an approved primary administrator, an approved secondary administrator, an unverified account, an account without the admin claim, and an account whose profile role is `volunteer`. Run it with:

```powershell
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
$env:FIREBASE_EMULATOR_HUB = "127.0.0.1:4400"
pnpm run test:admin:emulator
```

The rule test must remain part of release validation whenever `firestore.rules`, the Auth claim model, or administrator collections change.

## 21. Connect the Vercel frontend to the Python API

A static Vercel deployment cannot execute the Express server’s POST routes by itself. The Python workbench and RAG requests are defined in `server.ts` as `POST /api/python/run` and `POST /api/ai/ask-rag`. When Vercel hosts only the static client, configure the client with the public API base URL of the separately deployed Cloud Run service:

```text
Vercel Production:
VITE_API_BASE_URL=https://YOUR-CLOUD-RUN-SERVICE-URL
```

Configure the Cloud Run service with the exact Vercel origin and server-only values:

```text
CORS_ORIGINS=https://church-platform-zeta.vercel.app
ADMIN_EMAILS=tantony31710@gmail.com
GEMINI_API_KEY=server-secret
```

If a custom Vercel domain is used, include each exact HTTPS origin as a comma-separated value. Do not use `*` with authenticated requests. Redeploy Cloud Run after changing `CORS_ORIGINS` and redeploy Vercel after changing `VITE_API_BASE_URL`.

The browser now refreshes its Firebase ID token once after a 401 response, reports a clear session-expired message for a persistent 401, reports administrator denial for 403, and identifies a 405 as a frontend/API deployment mismatch. Browser connectivity failures are reported separately from Python server errors. This preserves the security boundary while making configuration failures diagnosable.

For a simple production check, use the deployed API URL:

```powershell
$API_URL = "https://YOUR-CLOUD-RUN-SERVICE-URL"
Invoke-RestMethod "$API_URL/api/health" | ConvertTo-Json
```

The health endpoint should report `apiAuthRequired: true`, `adminConfigured: true`, and `pythonReady: true`. A browser request from the Vercel origin must also pass its CORS preflight before authenticated POST requests can reach the Python engine.

## 22. Vercel-native Python service

The Vercel deployment now has a Python service entrypoint at `api/index.py` and reusable engine modules under `api/engine/`. The Python service exposes secure routes for authenticated RAG and administrator-only data workflows:

```text
GET  /api/health
POST /api/python/rag-query
POST /api/ai/ask-rag
POST /api/python/run
POST /api/python/churn-analysis
POST /api/python/clustering
POST /api/python/attendance-forecast
POST /api/python/optimize-tasks
POST /api/python/analytics-report
GET  /api/python/analytics-report/latest
```

The service reads `users`, `tasks`, and `attendance` from live Firestore for administrator ML, workbench, optimization, and analytics requests. It never accepts a client-provided administrator role as proof of authorization. It verifies the Firebase ID token, verified-email state, `admin` claim, allowlisted email, and same-UID Firestore profile role before administrator routes run.

Vercel Production environment variables should be configured as follows:

```text
VITE_API_BASE_URL=
VITE_ADMIN_EMAILS=tantony31710@gmail.com
VITE_FIREBASE_PROJECT_ID=church-platform-36107
```

`VITE_API_BASE_URL` remains empty because the frontend and Python service share the Vercel project and `/api` route surface. Keep these server-only values in Vercel’s server environment, not in `VITE_*` variables:

```text
FIREBASE_SERVICE_ACCOUNT=<complete service-account JSON>
ADMIN_EMAILS=tantony31710@gmail.com
GEMINI_API_KEY=<server secret>
GEMINI_MODEL=gemini-2.5-flash
```

Do not commit `.env.local`, service-account JSON, Gemini keys, or Firebase Admin private keys. The Vercel service configuration is defined in `vercel.json`; the frontend service handles non-API paths and the Python service handles `/api/*`.

For local Python-service contract tests, install `api/requirements.txt` and run:

```powershell
python scripts/test_python_service.py
```

The test suite covers the unauthenticated health response, grounded RAG fallback, administrator workbench execution, non-admin denial, all live-data ML/optimization routes, and the three-domain analytics report. Production data is read from Firestore; test fixtures exist only to validate the HTTP and authorization contract.
