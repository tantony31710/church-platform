"""Vercel-native Python service for ChurchConnect AI and data workflows.

The module is intentionally an HTTP adapter around the existing pure-Python
engine. Firebase Admin credentials and the Gemini key are read only from
server-side environment variables.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

SERVICE_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = SERVICE_ROOT.parent
for import_path in (SERVICE_ROOT, PROJECT_ROOT):
    if str(import_path) not in sys.path:
        sys.path.insert(0, str(import_path))

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore

from engine.analytics_pipeline import summarize_dataset
from engine.python_engine import (
    calculate_churn_predictions,
    calculate_volunteer_clusters,
    compute_rag_search,
    forecast_attendance,
    optimize_task_allocation,
    restricted_import,
    validate_workbench_code,
)

try:
    from google import genai
except ImportError:  # Optional until Gemini is configured in the deployment.
    genai = None

app = FastAPI(title="ChurchConnect Python Service", version="1.0.0")
bearer = HTTPBearer(auto_error=False)
_firebase_app: firebase_admin.App | None = None
_firestore_client: firestore.Client | None = None
_gemini_client: Any = None


def _configured_admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", os.getenv("ADMIN_EMAIL", ""))
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


def _firebase() -> tuple[firebase_admin.App, firestore.Client]:
    global _firebase_app, _firestore_client
    if _firebase_app is not None and _firestore_client is not None:
        return _firebase_app, _firestore_client

    try:
        _firebase_app = firebase_admin.get_app()
    except ValueError:
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT", "").strip()
        if service_account_json:
            service_account = json.loads(service_account_json)
            if isinstance(service_account.get("private_key"), str):
                service_account["private_key"] = service_account["private_key"].replace("\\n", "\n")
            credential = credentials.Certificate(service_account)
        else:
            project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
            client_email = os.getenv("FIREBASE_CLIENT_EMAIL", "").strip()
            private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n").strip()
            if project_id and client_email and private_key:
                credential = credentials.Certificate(
                    {
                        "type": "service_account",
                        "project_id": project_id,
                        "client_email": client_email,
                        "private_key": private_key,
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                )
            else:
                credential = credentials.ApplicationDefault()
        _firebase_app = firebase_admin.initialize_app(_firebase_app or credential)

    _firestore_client = firestore.client(app=_firebase_app)
    return _firebase_app, _firestore_client


def _json_safe(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


def _record(document: Any) -> dict[str, Any]:
    data = document.to_dict() or {}
    data.setdefault("id", document.id)
    return _json_safe(data)


def _live_dataset() -> dict[str, list[dict[str, Any]]]:
    _, client = _firebase()
    return {
        "users": [_record(item) for item in client.collection("users").stream()],
        "tasks": [_record(item) for item in client.collection("tasks").stream()],
        "attendance": [_record(item) for item in client.collection("attendance").stream()],
    }


def _verify_user(credentials_value: HTTPAuthorizationCredentials | None) -> dict[str, Any]:
    if credentials_value is None or credentials_value.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase ID token required.")
    try:
        firebase_app, _ = _firebase()
    except Exception as error:
        print(f"[Python auth] Firebase Admin initialization failed: {type(error).__name__}: {error}", file=sys.stderr)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Server Firebase Admin credentials are not configured.") from error
    try:
        return firebase_auth.verify_id_token(credentials_value.credentials, app=firebase_app)
    except Exception as error:
        print(f"[Python auth] Firebase ID token verification failed: {type(error).__name__}: {error}", file=sys.stderr)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired Firebase ID token.") from error


def current_user(credentials_value: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict[str, Any]:
    return _verify_user(credentials_value)


def designated_admin(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    email = str(user.get("email", "")).strip().lower()
    if not _configured_admin_emails():
        raise HTTPException(status_code=503, detail="ADMIN_EMAILS is not configured on the server.")
    if (
        not email
        or email not in _configured_admin_emails()
        or user.get("admin") is not True
        or user.get("email_verified") is not True
    ):
        raise HTTPException(status_code=403, detail="Only a verified designated administrator can access this endpoint.")

    _, client = _firebase()
    profile = client.collection("users").document(str(user["uid"])).get()
    if not profile.exists or (profile.to_dict() or {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrator profile is not provisioned.")
    return user


def _gemini() -> Any:
    global _gemini_client
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or genai is None:
        return None
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


@app.get("/api/health")
@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "pythonReady": True,
        "apiAuthRequired": True,
        "adminConfigured": bool(_configured_admin_emails()),
        "geminiConfigured": bool(os.getenv("GEMINI_API_KEY", "").strip() and genai is not None),
    }


@app.post("/api/python/rag-query")
@app.post("/python/rag-query")
def rag_query(payload: dict[str, Any], _: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    query = str(payload.get("query", "")).strip()[:500]
    if not query:
        raise HTTPException(status_code=400, detail="A non-empty query is required.")
    top_k = max(1, min(5, int(payload.get("top_k", 3))))
    return {"success": True, "query": query, "results": compute_rag_search(query, top_k)}


@app.post("/api/ai/ask-rag")
@app.post("/ai/ask-rag")
def ask_rag(payload: dict[str, Any], _: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    question = str(payload.get("question", "")).strip()[:1000]
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    matched = compute_rag_search(question, 3)
    context = "\n\n".join(
        f"[Source {index}: {doc['title']} ({doc['category']})]\n{doc['content']}"
        for index, doc in enumerate(matched, start=1)
    )
    client = _gemini()
    if client is None:
        return {
            "answer": "Gemini is not configured on the server. Retrieved grounded documents are available below; configure GEMINI_API_KEY to generate a model answer.",
            "retrievedDocuments": matched,
            "modelUsed": "python-rag-retrieval-fallback",
        }

    prompt = (
        "You are the ChurchConnect ministry SOP assistant. Answer only from the grounded documents below. "
        "If the documents do not contain the answer, say that clearly. Do not invent church policy. "
        f"\n\nQuestion: {question}\n\nGrounded documents:\n{context}"
    )
    try:
        response = client.models.generate_content(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), contents=prompt)
        answer = str(getattr(response, "text", "") or "").strip()
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {error}") from error
    if not answer:
        raise HTTPException(status_code=502, detail="Gemini returned an empty answer.")
    return {"answer": answer, "retrievedDocuments": matched, "modelUsed": os.getenv("GEMINI_MODEL", "gemini-2.5-flash")}


@app.post("/api/python/churn-analysis")
@app.post("/python/churn-analysis")
def churn(_: dict[str, Any] = Depends(designated_admin)) -> dict[str, Any]:
    volunteers = [user for user in _live_dataset()["users"] if user.get("role") == "volunteer"]
    return {"success": True, "predictions": calculate_churn_predictions(volunteers)}


@app.post("/api/python/clustering")
@app.post("/python/clustering")
def clustering(_: dict[str, Any] = Depends(designated_admin)) -> dict[str, Any]:
    volunteers = [user for user in _live_dataset()["users"] if user.get("role") == "volunteer"]
    return {"success": True, "clustering": calculate_volunteer_clusters(volunteers)}


@app.post("/api/python/attendance-forecast")
@app.post("/python/attendance-forecast")
def attendance_forecast(_: dict[str, Any] = Depends(designated_admin)) -> dict[str, Any]:
    return {"success": True, "forecast": forecast_attendance(_live_dataset()["attendance"])}


@app.post("/api/python/optimize-tasks")
@app.post("/python/optimize-tasks")
def optimize(_: dict[str, Any] = Depends(designated_admin)) -> dict[str, Any]:
    dataset = _live_dataset()
    open_tasks = [task for task in dataset["tasks"] if task.get("status") == "open"]
    volunteers = [user for user in dataset["users"] if user.get("role") == "volunteer"]
    return {"success": True, "optimization": optimize_task_allocation(open_tasks, volunteers)}


@app.post("/api/python/run")
@app.post("/python/run")
def run_workbench(payload: dict[str, Any], _: dict[str, Any] = Depends(designated_admin)) -> dict[str, Any]:
    code = str(payload.get("code", ""))
    if not code.strip():
        raise HTTPException(status_code=400, detail="Python code is required.")
    if len(code) > 20_000:
        raise HTTPException(status_code=413, detail="Workbench code is limited to 20,000 characters.")

    dataset = _live_dataset()
    try:
        tree = validate_workbench_code(code)
        import io
        import math
        from collections import Counter
        from contextlib import redirect_stdout

        local_scope = {"volunteers": dataset["users"], "tasks": dataset["tasks"], "attendance": dataset["attendance"]}
        allowed_builtins = {
            "__import__": restricted_import,
            "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict,
            "enumerate": enumerate, "float": float, "int": int, "len": len,
            "list": list, "max": max, "min": min, "print": print, "range": range,
            "round": round, "set": set, "sorted": sorted, "str": str, "sum": sum,
            "tuple": tuple, "zip": zip,
        }
        safe_globals = {"__builtins__": allowed_builtins, "json": json, "math": math, "Counter": Counter}
        output_buffer = io.StringIO()
        with redirect_stdout(output_buffer):
            exec(compile(tree, "<church-workbench>", "exec"), safe_globals, local_scope)
        return {"success": True, "output": output_buffer.getvalue()}
    except Exception as error:
        return {"success": False, "error": str(error)}


@app.post("/api/python/analytics-report")
@app.post("/python/analytics-report")
def analytics_report(payload: dict[str, Any] | None = None, user: dict[str, Any] = Depends(designated_admin)) -> dict[str, Any]:
    dataset = _live_dataset()
    report = summarize_dataset(dataset)
    should_save = bool((payload or {}).get("save", True))
    report_id = None
    if should_save:
        _, client = _firebase()
        report_id = f"analytics_report_{datetime.utcnow().strftime('%Y%m%dT%H%M%S%fZ')}"
        client.collection("admin-data").document(report_id).set(
            {
                "type": "analytics-report",
                "createdBy": user["uid"],
                "createdAt": datetime.utcnow().isoformat() + "Z",
                "report": report,
            },
            merge=False,
        )
    return {"success": True, "report": report, "saved": should_save, "reportId": report_id}


@app.get("/api/python/analytics-report/latest")
@app.get("/python/analytics-report/latest")
def latest_report(_: dict[str, Any] = Depends(designated_admin)) -> dict[str, Any]:
    _, client = _firebase()
    reports = list(
        client.collection("admin-data")
        .where("type", "==", "analytics-report")
        .limit(50)
        .stream()
    )
    latest = max(
        reports,
        key=lambda item: str((item.to_dict() or {}).get("createdAt", "")),
        default=None,
    )
    if latest is None:
        return {"success": True, "report": None}
    return {"success": True, "reportId": latest.id, "report": _record(latest)}


@app.exception_handler(Exception)
async def unhandled_error(_: Request, error: Exception):
    # Do not expose tracebacks, tokens, service-account data, or request bodies.
    print(f"[Python service] unhandled error: {type(error).__name__}: {error}", file=sys.stderr)
    return JSONResponse(status_code=500, content={"error": "Python service failure."})
