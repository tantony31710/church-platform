"""Read-only consistency check for a Firebase administrator account."""

from __future__ import annotations

import os
import sys

import firebase_admin
from firebase_admin import auth, credentials, firestore


def main() -> int:
    email = os.environ.get("CHECK_ADMIN_EMAIL", "").strip().lower()
    if not email:
        print("FAIL: CHECK_ADMIN_EMAIL is not set.")
        return 1

    key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
    if not os.path.exists(key_path):
        print(f"FAIL: service-account file not found: {key_path}")
        return 1

    firebase_admin.initialize_app(credentials.Certificate(key_path))
    db = firestore.client()

    try:
        auth_user = auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        print(f"FAIL: Firebase Auth user not found: {email}")
        return 1

    profile_snapshot = db.collection("users").document(auth_user.uid).get()
    profile = profile_snapshot.to_dict() or {}
    claims = auth_user.custom_claims or {}

    checks = {
        "email matches": (auth_user.email or "").strip().lower() == email,
        "email verified": bool(auth_user.email_verified),
        "admin claim": claims.get("admin") is True,
        "Firestore profile exists": profile_snapshot.exists,
        "Firestore role": profile.get("role") == "admin",
    }

    print(f"Email: {auth_user.email}")
    print(f"Auth UID: {auth_user.uid}")
    print(f"Email verified: {auth_user.email_verified}")
    print(f"Custom admin claim: {claims.get('admin', False)}")
    print(f"Firestore path: users/{auth_user.uid}")
    print(f"Firestore role: {profile.get('role', '<missing>')}")
    print("\nChecks:")
    for name, passed in checks.items():
        print(f"  {'PASS' if passed else 'FAIL'}: {name}")

    if all(checks.values()):
        print("\nPASS: Auth claim and Firestore admin role are consistent.")
        return 0
    print("\nFAIL: Admin identity is not ready for the protected UI.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
