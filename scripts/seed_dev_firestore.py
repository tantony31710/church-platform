"""Seed isolated ChurchConnect development fixtures into Firestore."""
from __future__ import annotations

import argparse
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

PREFIX = "dev_fixture_"
PRODUCTION_PROJECT = "church-platform-36107"
COLLECTIONS = ("users", "tasks", "attendance", "rosters", "roster_members", "knowledge_documents")


def client(project_id: str, key_path: Path | None) -> firestore.Client:
    emulator = os.getenv("FIRESTORE_EMULATOR_HOST", "").strip()
    if project_id == PRODUCTION_PROJECT and not emulator:
        raise RuntimeError("Refusing production project. Use a dev project or the emulator.")
    if emulator:
        from google.auth.credentials import AnonymousCredentials
        firebase_admin.initialize_app(AnonymousCredentials(), options={"projectId": project_id})
    elif key_path and key_path.exists():
        firebase_admin.initialize_app(credentials.Certificate(str(key_path)), options={"projectId": project_id})
    else:
        raise RuntimeError("Pass --service-account outside the emulator.")
    return firestore.client()


def fixture_data() -> dict[str, list[dict[str, Any]]]:
    now = datetime.now(timezone.utc)
    specs = [
        ("001", "Miriam Haddad", "Hospitality", ["Hospitality", "Welcome Desk"], 0, 0, 1, 0),
        ("002", "Youssef Nassar", "AV & Tech", ["Audio", "OBS", "AV"], 15, 1, 4, 3),
        ("003", "Nadine Boutros", "Youth & Childcare", ["Teaching", "Childcare", "Safeguarding"], 60, 4, 9, 8),
        ("004", "Karim Fawzy", "Facilities & Setup", ["Facilities", "Setup", "Logistics"], 30, 2, 6, 5),
        ("005", "Salma Hanna", "Music & Worship", ["Music", "Worship", "Choir"], 105, 7, 12, 11),
        ("006", "Peter Samuel", "Admin & Outreach", ["Outreach", "Administration"], 45, 3, 7, 6),
    ]
    users = []
    for suffix, name, department, skills, points, done, attended, streak in specs:
        users.append({"id": f"{PREFIX}user_{suffix}", "name": name, "email": f"dev-{suffix}@example.invalid", "role": "volunteer", "department": department, "skills": skills, "points": points, "tasksCompletedCount": done, "attendanceCount": attended, "streak": streak, "badges": ["New Member"] if done == 0 else ["First Step"], "joinedDate": (now - timedelta(days=30 + int(suffix) * 30)).isoformat(), "fixture": True, "environment": "development"})
    names = {u["id"]: u["name"] for u in users}
    task_specs = [("001", "Prepare Sunday welcome desk", "Hospitality", "Welcome Desk", "open", None, 4), ("002", "Run Sunday livestream audio", "AV & Tech", "Audio", "assigned", "002", 2), ("003", "Review classroom safety checklist", "Youth & Childcare", "Safeguarding", "completed", "003", -9), ("004", "Set up fellowship hall seating", "Facilities & Setup", "Facilities", "completed", "004", -16), ("005", "Prepare choir rehearsal materials", "Music & Worship", "Music", "completed", "005", -23), ("006", "Update outreach contact board", "Admin & Outreach", "Outreach", "assigned", "006", 6)]
    tasks = []
    for suffix, title, category, skill, state, user_suffix, days in task_specs:
        assigned = f"{PREFIX}user_{user_suffix}" if user_suffix else None
        row = {"id": f"{PREFIX}task_{suffix}", "title": title, "description": f"Development fixture task: {title}.", "category": category, "requiredSkill": skill, "deadline": (now + timedelta(days=days)).isoformat(), "status": state, "assignedTo": assigned, "assignedToName": names.get(assigned or ""), "pointsValue": 15, "priority": "high" if state == "open" else "medium", "tags": [skill.lower(), "development-fixture"], "subtasks": [], "estimatedTime": 2, "createdAt": (now - timedelta(days=7)).isoformat(), "fixture": True, "environment": "development"}
        if state == "completed":
            row.update({"completedBy": assigned, "completedAt": (now - timedelta(days=abs(days))).isoformat()})
        tasks.append(row)
    attendance = []
    for index, user in enumerate(users):
        for occurrence in range(int(user["attendanceCount"])):
            attendance.append({"id": f"{PREFIX}attendance_{index + 1:02d}_{occurrence + 1:02d}", "userId": user["id"], "userName": user["name"], "userEmail": user["email"], "eventId": f"{PREFIX}sunday_service", "eventTitle": "Development Sunday Service", "timestamp": (now - timedelta(days=(occurrence + 1) * 7 + index)).isoformat(), "pointsAwarded": 0, "method": "qr_scan", "status": "present", "fixture": True, "environment": "development"})
    rosters = [{"id": f"{PREFIX}roster_pastoral", "name": "Pastoral Volunteer Roster", "type": "volunteers", "ownerLabel": "Pastor roster", "memberIds": [u["id"] for u in users], "fixture": True, "environment": "development"}, {"id": f"{PREFIX}roster_sunday_school", "name": "Sunday School — Cedar Classroom", "type": "children", "ownerLabel": "Teacher roster", "teacherLabel": "Teacher Miriam", "memberIds": [f"{PREFIX}child_{i:03d}" for i in range(1, 5)], "fixture": True, "environment": "development"}]
    roster_members = [{"id": f"{PREFIX}child_{i:03d}", "rosterId": f"{PREFIX}roster_sunday_school", "displayName": f"Child {chr(64 + i)}", "ageBand": "primary", "guardianLabel": f"Guardian {chr(64 + i)}", "fixture": True, "environment": "development"} for i in range(1, 5)]
    knowledge = [{"id": f"{PREFIX}knowledge_child_safety", "category": "Youth & Childcare", "title": "Development Childcare Check-in Protocol", "content": "Development fixture only: use two-adult supervision, verify authorized pickup, and escalate safeguarding concerns to the Sunday Director.", "tags": ["childcare", "safety"], "active": True, "fixture": True, "environment": "development"}, {"id": f"{PREFIX}knowledge_av", "category": "AV & Tech", "title": "Development AV Handoff Checklist", "content": "Development fixture only: test microphones, confirm OBS scenes, check cable paths, and record the handoff before service.", "tags": ["av", "obs"], "active": True, "fixture": True, "environment": "development"}]
    return {"users": users, "tasks": tasks, "attendance": attendance, "rosters": rosters, "roster_members": roster_members, "knowledge_documents": knowledge}


def reset(client_ref: firestore.Client) -> int:
    refs = []
    for collection_name in COLLECTIONS:
        refs.extend(doc.reference for doc in client_ref.collection(collection_name).stream() if doc.id.startswith(PREFIX))
    for start in range(0, len(refs), 400):
        batch = client_ref.batch()
        for ref in refs[start : start + 400]:
            batch.delete(ref)
        batch.commit()
    return len(refs)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--service-account", type=Path)
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--yes", action="store_true")
    args = parser.parse_args()
    if args.project_id == PRODUCTION_PROJECT and not os.getenv("FIRESTORE_EMULATOR_HOST"):
        raise SystemExit("Refusing production mock-data target.")
    if args.reset and not args.yes and input("Type SEED-DEV to reset fixture records: ").strip() != "SEED-DEV":
        raise SystemExit("Reset cancelled.")
    db = client(args.project_id, args.service_account)
    if args.reset:
        print(f"Deleted {reset(db)} fixture records")
    for collection_name, records in fixture_data().items():
        for record in records:
            db.collection(collection_name).document(record["id"]).set({k: v for k, v in record.items() if k != "id"}, merge=False)
        print(f"Seeded {len(records)} {collection_name}")
    print(f"Development seed complete for {args.project_id}; production was not modified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


# Fictional development labels only; no Auth users or real minors are created.
# Attendance always awards zero points; task history carries service points.
# Deterministic IDs make repeated development runs idempotent.
# End of file.


