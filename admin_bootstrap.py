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
    """Initialize Firebase Admin SDK using ADC or Service Account Key."""
    try:
        # Try initializing with Application Default Credentials (ADC) first
        # This works if the user has run 'gcloud auth application-default login'
        firebase_admin.initialize_app()
        return firestore.client()
    except ValueError:
        # firebase_admin.initialize_app() raises ValueError if app already exists
        return firestore.client()
    except Exception:
        # Fallback to service account key file
        service_account_path = os.environ.get(
            "FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json"
        )
        
        if not os.path.exists(service_account_path):
            print(f"❌ Error: No ADC found and {service_account_path} not found")
            print("\nTo fix this, run:")
            print("  gcloud auth application-default login")
            sys.exit(1)
        
        try:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            return firestore.client()
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            sys.exit(1)


def find_user_by_email(db, email):
    """Find a user document by email."""
    users = db.collection("users").where("email", "==", email).stream()
    for user in users:
        return user.id, user.to_dict()
    return None, None


def promote_to_admin(db, email):
    """Promote a user to admin role."""
    uid, user_data = find_user_by_email(db, email)
    
    if not uid:
        print(f"❌ User with email '{email}' not found")
        return False
    
    if user_data.get("role") == "admin":
        print(f"ℹ️  User '{email}' is already an admin")
        return True
    
    try:
        db.collection("users").document(uid).update({"role": "admin"})
        print(f"✅ Promoted '{email}' to admin (UID: {uid})")
        return True
    except Exception as e:
        print(f"❌ Failed to promote user: {e}")
        return False


def demote_to_volunteer(db, email):
    """Demote a user back to volunteer role."""
    uid, user_data = find_user_by_email(db, email)
    
    if not uid:
        print(f"❌ User with email '{email}' not found")
        return False
    
    if user_data.get("role") == "volunteer":
        print(f"ℹ️  User '{email}' is already a volunteer")
        return True
    
    try:
        db.collection("users").document(uid).update({"role": "volunteer"})
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
        promote_to_admin(db, args.email)
    elif args.demote:
        if not args.email:
            print("❌ --email is required with --demote")
            sys.exit(1)
        demote_to_volunteer(db, args.email)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
