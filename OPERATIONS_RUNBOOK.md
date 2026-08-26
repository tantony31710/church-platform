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
