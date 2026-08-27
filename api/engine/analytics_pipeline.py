"""Operational analytics pipeline for ChurchConnect datasets.

The module is intentionally separate from the HTTP engine. Analysts can run it
against a JSON export, engineers can use the typed functions in scheduled jobs,
and the results are deterministic and auditable rather than generated samples.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


@dataclass(frozen=True)
class QualityIssue:
    severity: str
    record_type: str
    record_id: str
    message: str


def _records(payload: dict[str, Any], key: str) -> list[dict[str, Any]]:
    value = payload.get(key, [])
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def validate_dataset(payload: dict[str, Any]) -> list[QualityIssue]:
    """Return deterministic data-quality issues without mutating input data."""
    issues: list[QualityIssue] = []
    seen_ids: set[tuple[str, str]] = set()
    for record_type in ("users", "tasks", "attendance"):
        for index, record in enumerate(_records(payload, record_type)):
            record_id = str(record.get("id") or f"row-{index + 1}")
            identity = (record_type, record_id)
            if identity in seen_ids:
                issues.append(QualityIssue("error", record_type, record_id, "Duplicate record id."))
            seen_ids.add(identity)

            if not record.get("id"):
                issues.append(QualityIssue("error", record_type, record_id, "Missing id."))
            if record_type == "users":
                if record.get("role") not in {"admin", "volunteer"}:
                    issues.append(QualityIssue("error", record_type, record_id, "Role must be admin or volunteer."))
                if float(record.get("points", 0) or 0) < 0:
                    issues.append(QualityIssue("error", record_type, record_id, "Points cannot be negative."))
            if record_type == "tasks":
                if float(record.get("pointsValue", 0) or 0) < 0:
                    issues.append(QualityIssue("error", record_type, record_id, "Task pointsValue cannot be negative."))
                if record.get("status") not in {"open", "assigned", "completed"}:
                    issues.append(QualityIssue("warning", record_type, record_id, "Unexpected task status."))
            if record_type == "attendance" and not record.get("userId"):
                issues.append(QualityIssue("error", record_type, record_id, "Attendance record is missing userId."))
    return issues


def build_feature_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Build one auditable feature row per volunteer for ML and analyst use."""
    users = [u for u in _records(payload, "users") if u.get("role") == "volunteer"]
    tasks = _records(payload, "tasks")
    attendance = _records(payload, "attendance")
    rows: list[dict[str, Any]] = []
    for user in users:
        user_id = user.get("id")
        completed_tasks = [t for t in tasks if t.get("assignedTo") == user_id and t.get("status") == "completed"]
        user_attendance = [a for a in attendance if a.get("userId") == user_id]
        rows.append({
            "userId": user_id,
            "department": user.get("department") or "General Ministry",
            "points": float(user.get("points", 0) or 0),
            "tasksCompleted": len(completed_tasks),
            "attendanceCount": len(user_attendance),
            "streak": int(user.get("streak", 0) or 0),
            "skillCount": len(user.get("skills", []) or []),
            "engagementScore": round(
                min(100.0, len(completed_tasks) * 8 + len(user_attendance) * 5 + int(user.get("streak", 0) or 0) * 3),
                2,
            ),
        })
    return rows


def summarize_dataset(payload: dict[str, Any]) -> dict[str, Any]:
    users = _records(payload, "users")
    tasks = _records(payload, "tasks")
    attendance = _records(payload, "attendance")
    volunteers = [u for u in users if u.get("role") == "volunteer"]
    skill_demand = Counter(str(t.get("requiredSkill") or "Unspecified") for t in tasks if t.get("status") != "completed")
    skill_supply = Counter(
        skill
        for user in volunteers
        for skill in (user.get("skills", []) if isinstance(user.get("skills", []), list) else [])
    )
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "counts": {"users": len(users), "volunteers": len(volunteers), "tasks": len(tasks), "attendance": len(attendance)},
        "points": {
            "total": sum(float(u.get("points", 0) or 0) for u in users),
            "averageVolunteer": round(sum(float(u.get("points", 0) or 0) for u in volunteers) / (len(volunteers) or 1), 2),
        },
        "skillDemand": skill_demand.most_common(),
        "skillSupply": skill_supply.most_common(),
        "featureRows": build_feature_rows(payload),
        "quality": [asdict(issue) for issue in validate_dataset(payload)],
    }


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError("Dataset JSON must be an object with users, tasks, and attendance arrays.")
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description="Run auditable ChurchConnect analytics on a JSON export.")
    parser.add_argument("dataset", type=Path, help="JSON file containing users, tasks, and attendance arrays")
    parser.add_argument("--output", type=Path, help="Optional path for the JSON report")
    args = parser.parse_args()
    report = summarize_dataset(load_json(args.dataset))
    serialized = json.dumps(report, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(serialized + "\n", encoding="utf-8")
    else:
        print(serialized)


if __name__ == "__main__":
    main()
