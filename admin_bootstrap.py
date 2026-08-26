#!/usr/bin/env python3
"""
Admin Bootstrap Script — Promote a user to admin role

This script uses the Firebase Admin SDK to promote a user to admin.
It bypasses Firestore security rules (which only allow admins to update roles)
and is intended for bootstrapping the first admin or fixing role assignments.

SETUP:
    1. Get your Firebase service account key:
       - Go to Firebase Console → Project Settings → Service Accounts
       - Click "Generate New Private Key" and save it as serviceAccountKey.json
       - Add to .gitignore (DO NOT commit to git)
    
    2. Install dependencies:
       pip install firebase-admin

USAGE:
    # Promote a user by their email
    python admin_bootstrap.py --email user@example.com --promote
    
    # Demote a user back to volunteer
    python admin_bootstrap.py --email user@example.com --demote
    
    # List all users and their roles
    python admin_bootstrap.py --list
"""

import os
import sys
import argparse
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth


def init_firebase():
    """Initialize Admin SDK for the intended Firebase project.

    Prefer an explicit service-account file when supplied. This prevents a
    different local ADC account/project from causing an opaque Firestore 403.
    """
    if firebase_admin._apps:
        return firestore.client()

    configured_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
    service_account_path = configured_path or (
        "serviceAccountKey.json" if os.path.exists("serviceAccountKey.json") else ""
    )
    if service_account_path:
        if not os.path.exists(service_account_path):
            print(f"❌ FIREBASE_SERVICE_ACCOUNT_PATH does not exist: {service_account_path}")
            sys.exit(1)
        try:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print(f"✅ Firebase Admin initialized from {service_account_path}")
            return firestore.client()
        except Exception as e:
            print(f"❌ Firebase service-account initialization failed: {e}")
            print("   Confirm the key belongs to the same Firebase project as the Vercel VITE_FIREBASE_PROJECT_ID.")
            sys.exit(1)

    try:
        firebase_admin.initialize_app()
        print("✅ Firebase Admin initialized from Application Default Credentials")
        return firestore.client()
    except Exception as e:
        print("❌ No usable Firebase Admin credentials were found.")
        print("   Use FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json or run gcloud auth application-default login.")
        print(f"   Details: {e}")
        sys.exit(1)


def find_user_by_email(db, email):
    """Resolve the Firebase Auth user, then load its same-UID profile."""
    try:
        auth_user = firebase_auth.get_user_by_email(email)
    except firebase_auth.UserNotFoundError:
        print(f"❌ Firebase Auth account '{email}' does not exist in this project")
        return None, None

    profile = db.collection("users").document(auth_user.uid).get()
    if not profile.exists:
        print(f"❌ Auth account exists, but users/{auth_user.uid} is missing")
        return None, None
    return auth_user.uid, profile.to_dict() or {}


def designated_admin_email():
    value = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    if not value:
        print("❌ ADMIN_EMAIL must be set before changing admin access")
        return None
    return value


def promote_to_admin(db, email):
    """Promote only the configured administrator email and set its custom claim."""
    designated = designated_admin_email()
    normalized_email = email.strip().lower()
    if not designated or normalized_email != designated:
        print("❌ Refusing promotion: the email must exactly match ADMIN_EMAIL")
        return False

    uid, user_data = find_user_by_email(db, normalized_email)
    
    if not uid:
        print(f"❌ User with email '{email}' not found")
        return False
    
    if user_data.get("role") == "admin":
        print(f"ℹ️  User '{email}' is already the requested admin; reconciling any other admin records.")

    try:
        batch = db.batch()
        for existing in db.collection("users").stream():
            if existing.id != uid and existing.to_dict().get("role") == "admin":
                batch.update(existing.reference, {"role": "volunteer"})
        batch.update(db.collection("users").document(uid), {"role": "admin"})
        batch.commit()

        target_user = firebase_auth.get_user(uid)
        target_claims = dict(target_user.custom_claims or {})
        target_claims["admin"] = True
        firebase_auth.set_custom_user_claims(uid, target_claims)
        for existing in db.collection("users").stream():
            if existing.id != uid and existing.to_dict().get("role") == "volunteer":
                existing_user = firebase_auth.get_user(existing.id)
                claims = dict(existing_user.custom_claims or {})
                if claims.get("admin") is True:
                    claims["admin"] = False
                    firebase_auth.set_custom_user_claims(existing.id, claims)
        print(f"✅ Promoted '{email}' to the single designated admin role (UID: {uid})")
        return True
    except Exception as e:
        print(f"❌ Failed to promote user: {e}")
        return False


def demote_to_volunteer(db, email):
    """Demote a non-designated user and remove its custom admin claim."""
    designated = designated_admin_email()
    normalized_email = email.strip().lower()
    if designated and normalized_email == designated:
        print("❌ Refusing demotion: ADMIN_EMAIL must remain the sole administrator")
        return False

    uid, user_data = find_user_by_email(db, normalized_email)
    
    if not uid:
        print(f"❌ User with email '{email}' not found")
        return False
    
    if user_data.get("role") == "volunteer":
        print(f"ℹ️  User '{email}' is already a volunteer")
        return True
    
    try:
        db.collection("users").document(uid).update({"role": "volunteer"})
        existing_user = firebase_auth.get_user(uid)
        claims = dict(existing_user.custom_claims or {})
        if claims.get("admin") is True:
            claims["admin"] = False
            firebase_auth.set_custom_user_claims(uid, claims)
        print(f"✅ Demoted '{email}' to volunteer (UID: {uid})")
        return True
    except Exception as e:
        print(f"❌ Failed to demote user: {e}")
        return False


def list_all_users(db):
    """List all users with their roles."""
    users = db.collection("users").stream()
    users_list = []
    
    for user in users:
        data = user.to_dict()
        users_list.append({
            "uid": user.id,
            "name": data.get("name", "N/A"),
            "email": data.get("email", "N/A"),
            "role": data.get("role", "volunteer"),
            "points": data.get("points", 0),
        })
    
    if not users_list:
        print("ℹ️  No users found")
        return
    
    # Sort by role (admins first) then by name
    users_list.sort(key=lambda x: (x["role"] != "admin", x["name"]))
    
    print("\n📋 All Users:")
    print("-" * 80)
    print(f"{'Name':<20} {'Email':<30} {'Role':<12} {'Points':<8}")
    print("-" * 80)
    
    for user in users_list:
        role_badge = "👑 ADMIN" if user["role"] == "admin" else "👤 Volunteer"
        print(f"{user['name']:<20} {user['email']:<30} {role_badge:<12} {user['points']:<8}")
    
    print("-" * 80)
    admin_count = sum(1 for u in users_list if u["role"] == "admin")
    print(f"\nTotal: {len(users_list)} users ({admin_count} admins)")


def main():
    parser = argparse.ArgumentParser(
        description="Manage admin roles in the church-platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python admin_bootstrap.py --email user@example.com --promote
  python admin_bootstrap.py --email user@example.com --demote
  python admin_bootstrap.py --list
        """
    )
    
    parser.add_argument("--email", help="User email address")
    parser.add_argument("--promote", action="store_true", help="Promote user to admin")
    parser.add_argument("--demote", action="store_true", help="Demote user to volunteer")
    parser.add_argument("--list", action="store_true", help="List all users and roles")
    
    args = parser.parse_args()
    
    db = init_firebase()
    
    if args.list:
        list_all_users(db)
    elif args.promote:
        if not args.email:
            print("❌ --email is required with --promote")
            sys.exit(1)
        if not promote_to_admin(db, args.email):
            sys.exit(1)
    elif args.demote:
        if not args.email:
            print("❌ --email is required with --demote")
            sys.exit(1)
        if not demote_to_volunteer(db, args.email):
            sys.exit(1)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
