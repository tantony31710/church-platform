# Vercel Python and Services findings

Research date: 2026-08-27

## Official Python runtime

Source: https://vercel.com/docs/functions/runtimes/python

Vercel Python Functions support ASGI and WSGI applications. Vercel detects supported Python frameworks from requirements.txt, pyproject.toml, or Pipfile and loads a supported entrypoint such as app.py, index.py, server.py, main.py, wsgi.py, or asgi.py. The entrypoint must expose a top-level `app` or `application`. Python versions currently documented include 3.12 as default, plus 3.13 and 3.14. A file-based `/api` function is supported, but each Python file under `/api` is treated as a separately routable function rather than a drop-in replacement for an Express process.

## Official Services model

Source: https://vercel.com/docs/services

Vercel Services are documented as Beta and available on all plans. A project can contain multiple independently built services across runtimes, such as a JavaScript frontend and a Python FastAPI backend. The services are exposed through top-level rewrites in `vercel.json`; an `/api/(.*)` rewrite can target the Python backend and a catch-all rewrite can target the frontend. Services share a deployment and can use internal bindings. Build and runtime settings belong inside each service configuration when the `services` key is used.

## Relevance to ChurchConnect

The repository currently has a Vite frontend, an Express server that dispatches to a Python subprocess, and Python engine code that is not an ASGI/WSGI application. A simple `api/index.py` wrapper would therefore require a new web framework adapter and would not automatically preserve the existing Express authentication, rate limiting, Firestore dataset loading, Python subprocess model, or Gemini orchestration. The newer Services model is the official Vercel-native path for a separate Python web service, but it would require restructuring the repository into independently built frontend and backend service roots.

The current minimal-change deployment remains the existing Express-plus-Python server as one Cloud Run service, with Vercel frontend requests routed to its URL using `VITE_API_BASE_URL` and exact-origin `CORS_ORIGINS`. A Vercel-native migration is possible, but should be implemented as a deliberate architecture migration rather than placing the current `server.ts` or `python_engine.py` directly into `/api`.

## Security constraints

Firebase Admin credentials, Gemini credentials, and server administrator allowlists must remain server-side. The browser may carry only public Firebase web configuration and the public Cloud Run/API base URL. Authenticated API requests must continue to validate Firebase ID tokens and administrator claims server-side.

## File-based `/api` routing clarification

Source: https://vercel.com/docs/functions/runtimes/python/api-directory

Without a detected Python framework preset, each `.py` file inside `/api` becomes a separate Vercel Function at its file path; for example, `api/index.py` serves `/api` and `api/users.py` serves `/api/users`. Each file must expose `app`, `application`, or `handler`. The same documentation explicitly recommends a framework preset for new Python applications and Vercel Services for a Python backend alongside another framework.

Source: https://vercel.com/docs/frameworks/backend/express

Vercel can deploy an Express app as one serverless function when the application is exported from a supported entrypoint. Static assets are not served by `express.static()` in that mode; they belong in `public/**`. The existing ChurchConnect `server.ts` uses a port listener, serves the Vite `dist` folder, and launches `python3` as a subprocess, so an Express-on-Vercel migration would need its own entrypoint and serverless/static-serving adjustments.

Implementation implication: a raw `api/index.py` with the current CLI engine is not sufficient. The safe Vercel-native design is a FastAPI application entrypoint in an independently built backend service, with shared engine modules imported directly and server-side Firebase/Gemini configuration. If using the Services model, top-level rewrites must route `/api/*` to the backend service and all other paths to the Vite frontend service.
