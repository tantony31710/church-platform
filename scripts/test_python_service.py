"""Local contract tests for the Vercel-native ChurchConnect Python service.

The tests use small deterministic fixtures only to exercise authorization and
response contracts. Production routes read the live Firestore collections.
"""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import api.index as service


client = TestClient(service.app)

TEST_DATASET = {
    "users": [
        {
            "id": "volunteer-1",
            "role": "volunteer",
            "name": "Test Volunteer",
            "email": "volunteer@example.com",
            "points": 0,
            "streak": 1,
            "tasksCompletedCount": 0,
            "attendanceCount": 0,
            "skills": ["hospitality"],
            "department": "Hospitality",
        }
    ],
    "tasks": [
        {
            "id": "task-1",
            "status": "open",
            "title": "Welcome desk",
            "category": "Hospitality",
            "requiredSkill": "hospitality",
            "pointsValue": 15,
        }
    ],
    "attendance": [],
}


def admin_user() -> dict[str, object]:
    return {
        "uid": "admin-1",
        "email": "admin@example.com",
        "email_verified": True,
        "admin": True,
    }


def test_token_verifier_uses_initialized_firebase_app(monkeypatch) -> None:
    expected_app = object()
    monkeypatch.setattr(service, "_firebase", lambda: (expected_app, object()))
    observed: dict[str, object] = {}

    def verify(token: str, app: object) -> dict[str, object]:
        observed["token"] = token
        observed["app"] = app
        return {"uid": "admin-1"}

    monkeypatch.setattr(service.firebase_auth, "verify_id_token", verify)
    result = service._verify_user(
        service.HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-id-token")
    )
    assert result["uid"] == "admin-1"
    assert observed == {"token": "test-id-token", "app": expected_app}


def test_health_does_not_require_firebase_credentials() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["pythonReady"] is True


def test_rag_returns_grounded_fallback_without_gemini(monkeypatch) -> None:
    monkeypatch.setattr(service, "_gemini", lambda: None)
    service.app.dependency_overrides[service.current_user] = lambda: {"uid": "volunteer-1"}
    try:
        response = client.post("/api/python/rag-query", json={"query": "two adult childcare safety rule"})
    finally:
        service.app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["results"]


def test_workbench_requires_designated_admin() -> None:
    service.app.dependency_overrides[service.designated_admin] = lambda: admin_user()
    original_dataset = service._live_dataset
    service._live_dataset = lambda: TEST_DATASET
    try:
        response = client.post(
            "/api/python/run",
            json={"code": "import json\nprint(len(volunteers)); print(len(tasks)); print(len(attendance)); print(json.dumps({'ok': True}))"},
        )
    finally:
        service._live_dataset = original_dataset
        service.app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "1" in response.json()["output"]


def test_workbench_rejects_non_admin() -> None:
    service.app.dependency_overrides[service.designated_admin] = lambda: (_ for _ in ()).throw(
        service.HTTPException(status_code=403, detail="Administrator access denied")
    )
    try:
        response = client.post("/api/python/run", json={"code": "print('not allowed')"})
    finally:
        service.app.dependency_overrides.clear()
    assert response.status_code == 403


def test_admin_ml_and_optimizer_routes_use_live_dataset(monkeypatch) -> None:
    service.app.dependency_overrides[service.designated_admin] = lambda: admin_user()
    monkeypatch.setattr(service, "_live_dataset", lambda: TEST_DATASET)
    try:
        churn_response = client.post("/api/python/churn-analysis", json={})
        cluster_response = client.post("/api/python/clustering", json={})
        forecast_response = client.post("/api/python/attendance-forecast", json={})
        optimizer_response = client.post("/api/python/optimize-tasks", json={})
    finally:
        service.app.dependency_overrides.clear()
    assert churn_response.status_code == 200
    assert cluster_response.status_code == 200
    assert forecast_response.status_code == 200
    assert optimizer_response.status_code == 200
    assert len(churn_response.json()["predictions"]) == 1
    assert cluster_response.json()["clustering"]["clusters"]
    assert forecast_response.json()["forecast"]["forecast"]
    assert optimizer_response.json()["optimization"]["totalTasksOptimized"] == 1


def test_analytics_report_uses_three_live_data_domains(monkeypatch) -> None:
    service.app.dependency_overrides[service.designated_admin] = lambda: admin_user()
    monkeypatch.setattr(service, "_live_dataset", lambda: TEST_DATASET)
    try:
        response = client.post("/api/python/analytics-report", json={"save": False})
    finally:
        service.app.dependency_overrides.clear()
    assert response.status_code == 200
    report = response.json()["report"]
    assert report["counts"] == {"users": 1, "volunteers": 1, "tasks": 1, "attendance": 0}
    assert report["featureRows"][0]["tasksCompleted"] == 0


if __name__ == "__main__":
    raise SystemExit(__import__("pytest").main([__file__, "-q"]))
