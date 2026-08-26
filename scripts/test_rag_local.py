"""Smoke-test the browser-facing RAG/Gemini endpoint locally.

Required environment variables:
  VITE_FIREBASE_API_KEY, TEST_FIREBASE_EMAIL, TEST_FIREBASE_PASSWORD
Optional:
  API_BASE_URL (default: http://127.0.0.1:3000)
"""

from __future__ import annotations

import argparse
import os
import sys

import requests


def required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description="Test ChurchConnect RAG and optional Gemini locally.")
    parser.add_argument("question", nargs="?", default="What is the volunteer check-in process?")
    args = parser.parse_args()

    api_key = required("VITE_FIREBASE_API_KEY")
    email = required("TEST_FIREBASE_EMAIL")
    password = required("TEST_FIREBASE_PASSWORD")
    base_url = os.environ.get("API_BASE_URL", "http://127.0.0.1:3000").rstrip("/")

    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    auth_response = requests.post(
        auth_url,
        json={"email": email, "password": password, "returnSecureToken": True},
        timeout=15,
    )
    if not auth_response.ok:
        print(f"Firebase sign-in failed ({auth_response.status_code}). Check the test account and password.")
        return 1
    id_token = auth_response.json().get("idToken")
    if not id_token:
        print("Firebase did not return an ID token.")
        return 1

    response = requests.post(
        f"{base_url}/api/ai/ask-rag",
        headers={"Authorization": f"Bearer {id_token}"},
        json={"question": args.question},
        timeout=45,
    )
    print(f"HTTP {response.status_code}")
    try:
        payload = response.json()
    except ValueError:
        print(response.text[:1000])
        return 1
    if not response.ok:
        print(payload.get("error", "RAG request failed."))
        return 1

    print(f"Model: {payload.get('modelUsed', 'unknown')}")
    print(f"Retrieved documents: {len(payload.get('retrievedDocuments', []))}")
    print("\nAnswer:\n" + str(payload.get("answer", "")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
