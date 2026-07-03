"""
Volunteer Management System — Firestore data utility (Python)

Uses the Firebase Admin SDK, which is the correct tool for touching
Firestore from a Python script or backend job. This is different from
the JS client SDK used in the Next.js app: Admin SDK auth is a service
account key file, not a logged-in user, and it bypasses security rules
entirely — so this script should only ever run somewhere trusted
(your machine, a CI job, a scheduled Cloud Function), never in a
browser or client app.

Install:
    pip install firebase-admin pandas

Setup:
    1. Firebase Console -> Project Settings -> Service Accounts
       -> "Generate new private key". Save the JSON file locally
       (do NOT commit it to git — add it to .gitignore).
    2. Set the path below or via an environment variable.
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd

# ---- Setup ----------------------------------------------------------
SERVICE_ACCOUNT_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json"
)

cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()


# ---- 1. Seed sample tasks --------------------------------------------
def seed_sample_tasks():
    """
    Pushes a handful of sample tasks into the 'tasks' collection.
    Useful for local testing before real volunteer coordinators start
    entering data through the UI.
    """
    sample_tasks = [
        {
            "title": "Sunday school setup",
            "description": "Arrange chairs and materials for the 9am class.",
            "requiredSkill": "Organization",
            "deadline": firestore.SERVER_TIMESTAMP,
            "status": "open",
            "assignedTo": None,
        },
        {
            "title": "Sound booth support",
            "description": "Run the mic and speakers during the service.",
            "requiredSkill": "AV / Tech",
            "deadline": firestore.SERVER_TIMESTAMP,
            "status": "open",
            "assignedTo": None,
        },
    ]

    tasks_ref = db.collection("tasks")
    for task in sample_tasks:
        # add() auto-generates a document ID, matching what the
        # Firestore JS SDK does when you don't pass an explicit ID.
        doc_ref = tasks_ref.add(task)
        print(f"Seeded task: {task['title']} -> {doc_ref[1].id}")


# ---- 2. Export tasks to a DataFrame -----------------------------------
def export_tasks_to_dataframe() -> pd.DataFrame:
    """
    Pulls every document in 'tasks' into a pandas DataFrame.
    This is the bridge between your Firestore data and any analysis
    you want to run — e.g. "which skills are most requested but least
    fulfilled" or "average time-to-assignment per task".
    """
    docs = db.collection("tasks").stream()

    records = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        records.append(data)

    df = pd.DataFrame(records)

    # This is your "print the JSON to see the shape" moment, Python
    # version — always inspect a fresh DataFrame before doing anything
    # with it.
    print(df.head())
    print(df.dtypes)

    return df


# ---- 3. Basic volunteer engagement summary -----------------------------
def volunteer_points_summary() -> pd.DataFrame:
    """
    Joins 'users' and 'attendance' to see who's showing up most.
    A natural first data-science exercise: are the highest-point
    volunteers also the most frequent attendees, or are points
    accumulating some other way (e.g. task completions)?
    """
    users_docs = db.collection("users").stream()
    users_df = pd.DataFrame([{**d.to_dict(), "id": d.id} for d in users_docs])

    attendance_docs = db.collection("attendance").stream()
    attendance_df = pd.DataFrame([d.to_dict() for d in attendance_docs])

    if attendance_df.empty or users_df.empty:
        print("Not enough data yet to summarize — seed some records first.")
        return pd.DataFrame()

    attendance_counts = (
        attendance_df.groupby("userId").size().rename("attendance_count")
    )

    summary = users_df.set_index("id").join(attendance_counts, how="left")
    summary["attendance_count"] = summary["attendance_count"].fillna(0).astype(int)

    return summary[["name", "points", "attendance_count"]].sort_values(
        "points", ascending=False
    )


if __name__ == "__main__":
    # Uncomment the step you want to run.
    # seed_sample_tasks()
    tasks_df = export_tasks_to_dataframe()
    # summary_df = volunteer_points_summary()
    # print(summary_df)
