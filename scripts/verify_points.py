"""Verify the trusted Firestore point award after a task completes.

Run with a service-account JSON from the same Firebase project:
  $env:FIREBASE_SERVICE_ACCOUNT_PATH = '.\\serviceAccountKey.json'
  python scripts/verify_points.py --task-id TASK_ID --user-id USER_UID
"""

from __future__ import annotations

import argparse
import os
import sys

import firebase_admin
from firebase_admin import credentials, firestore


def init_firestore():
    if firebase_admin._apps:
        return firestore.client()
    key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
    if not os.path.exists(key_path):
        raise FileNotFoundError(f"Service-account file not found: {key_path}")
    firebase_admin.initialize_app(credentials.Certificate(key_path))
    return firestore.client()


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a completed task point award.")
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--expected-points", type=int)
    parser.add_argument("--expected-completed-count", type=int)
    args = parser.parse_args()

    db = init_firestore()
    task = db.collection("tasks").document(args.task_id).get()
    user = db.collection("users").document(args.user_id).get()
    if not task.exists:
        print(f"Task not found: tasks/{args.task_id}")
        return 1
    if not user.exists:
        print(f"User not found: users/{args.user_id}")
        return 1

    task_data = task.to_dict() or {}
    user_data = user.to_dict() or {}
    print(f"Task status: {task_data.get('status')}")
    print(f"Assigned user: {task_data.get('assignedTo')}")
    print(f"Task value: {task_data.get('pointsValue', 0)}")
    print(f"Volunteer points: {user_data.get('points', 0)}")
    print(f"Completed-task count: {user_data.get('tasksCompletedCount', 0)}")

    checks = [
        (task_data.get("status") == "completed", "task status is completed"),
        (task_data.get("assignedTo") == args.user_id, "task belongs to the requested user"),
    ]
    if args.expected_points is not None:
        checks.append((user_data.get("points") == args.expected_points, "points match expected value"))
    if args.expected_completed_count is not None:
        checks.append((user_data.get("tasksCompletedCount") == args.expected_completed_count, "completed count matches expected value"))

    failed = [description for passed, description in checks if not passed]
    if failed:
        print("FAILED: " + "; ".join(failed))
        return 1
    print("PASS: Firestore task completion and volunteer point state are consistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
