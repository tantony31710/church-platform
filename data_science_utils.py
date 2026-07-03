#!/usr/bin/env python3
"""
Data Science & AI Engineering Utilities for Church Platform

This module provides comprehensive data extraction, transformation, and analysis
tools for the church-platform Firestore database. It's designed for data scientists
and AI engineers to perform advanced analytics, ML model training, and insights.

FEATURES:
  - Real-time data export to pandas DataFrames
  - Statistical analysis and aggregations
  - Time-series analysis for attendance patterns
  - Volunteer engagement scoring
  - Data quality checks and validation
  - Export to CSV/JSON for external ML tools
  - Batch operations for data seeding

SETUP:
    pip install firebase-admin pandas numpy scipy scikit-learn matplotlib seaborn

USAGE:
    from data_science_utils import DataScienceAnalyzer
    
    analyzer = DataScienceAnalyzer()
    
    # Export data
    users_df = analyzer.export_users()
    tasks_df = analyzer.export_tasks()
    attendance_df = analyzer.export_attendance()
    
    # Analyze engagement
    engagement = analyzer.volunteer_engagement_analysis()
    
    # Time-series analysis
    daily_attendance = analyzer.attendance_time_series()
    
    # Export for ML
    analyzer.export_for_ml_training()
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import numpy as np
from collections import defaultdict


class DataScienceAnalyzer:
    """Main class for data science operations on church-platform Firestore."""
    
    def __init__(self, service_account_path: Optional[str] = None):
        """Initialize Firebase connection."""
        if not firebase_admin._apps:
            path = service_account_path or os.environ.get(
                "FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json"
            )
            
            if not os.path.exists(path):
                raise FileNotFoundError(
                    f"Service account key not found: {path}\n"
                    "Get it from: Firebase Console → Project Settings → Service Accounts"
                )
            
            cred = credentials.Certificate(path)
            firebase_admin.initialize_app(cred)
        
        self.db = firestore.client()
    
    # ========== DATA EXPORT ==========
    
    def export_users(self) -> pd.DataFrame:
        """Export all users to DataFrame."""
        docs = self.db.collection("users").stream()
        records = []
        
        for doc in docs:
            data = doc.to_dict()
            data["uid"] = doc.id
            records.append(data)
        
        df = pd.DataFrame(records)
        
        # Ensure consistent types
        if not df.empty:
            df["points"] = pd.to_numeric(df["points"], errors="coerce").fillna(0)
            df["skills"] = df["skills"].apply(lambda x: x if isinstance(x, list) else [])
        
        return df
    
    def export_tasks(self) -> pd.DataFrame:
        """Export all tasks to DataFrame."""
        docs = self.db.collection("tasks").stream()
        records = []
        
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            records.append(data)
        
        df = pd.DataFrame(records)
        
        # Convert Firestore timestamps to datetime
        if not df.empty and "deadline" in df.columns:
            df["deadline"] = pd.to_datetime(df["deadline"].apply(
                lambda x: x.timestamp() if hasattr(x, 'timestamp') else x
            ), unit='s', errors='coerce')
        
        return df
    
    def export_attendance(self) -> pd.DataFrame:
        """Export all attendance records to DataFrame."""
        docs = self.db.collection("attendance").stream()
        records = []
        
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            records.append(data)
        
        df = pd.DataFrame(records)
        
        # Convert timestamps
        if not df.empty and "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"].apply(
                lambda x: x.timestamp() if hasattr(x, 'timestamp') else x
            ), unit='s', errors='coerce')
        
        return df
    
    def export_leaderboard(self) -> pd.DataFrame:
        """Export leaderboard data to DataFrame."""
        docs = self.db.collection("leaderboard").stream()
        records = []
        
        for doc in docs:
            data = doc.to_dict()
            data["uid"] = doc.id
            records.append(data)
        
        return pd.DataFrame(records)
    
    # ========== ENGAGEMENT ANALYSIS ==========
    
    def volunteer_engagement_analysis(self) -> Dict:
        """
        Comprehensive volunteer engagement analysis.
        
        Returns:
            Dict with engagement metrics, scores, and insights
        """
        users_df = self.export_users()
        attendance_df = self.export_attendance()
        
        if users_df.empty or attendance_df.empty:
            return {"error": "Insufficient data for analysis"}
        
        # Count attendance per volunteer
        attendance_counts = attendance_df.groupby("userId").size().reset_index(name="attendance_count")
        
        # Merge with user data
        engagement = users_df.merge(
            attendance_counts,
            left_on="uid",
            right_on="userId",
            how="left"
        )
        engagement["attendance_count"] = engagement["attendance_count"].fillna(0).astype(int)
        
        # Calculate engagement score (0-100)
        max_points = engagement["points"].max() if engagement["points"].max() > 0 else 1
        max_attendance = engagement["attendance_count"].max() if engagement["attendance_count"].max() > 0 else 1
        
        engagement["engagement_score"] = (
            (engagement["points"] / max_points * 50) +
            (engagement["attendance_count"] / max_attendance * 50)
        ).round(2)
        
        # Categorize engagement levels
        engagement["engagement_level"] = pd.cut(
            engagement["engagement_score"],
            bins=[0, 25, 50, 75, 100],
            labels=["Low", "Medium", "High", "Very High"],
            include_lowest=True
        )
        
        return {
            "summary": {
                "total_volunteers": len(engagement),
                "avg_points": float(engagement["points"].mean()),
                "avg_attendance": float(engagement["attendance_count"].mean()),
                "avg_engagement_score": float(engagement["engagement_score"].mean()),
            },
            "by_level": engagement.groupby("engagement_level").size().to_dict(),
            "top_performers": engagement.nlargest(5, "engagement_score")[
                ["name", "email", "points", "attendance_count", "engagement_score"]
            ].to_dict("records"),
            "dataframe": engagement,
        }
    
    def skill_demand_analysis(self) -> Dict:
        """Analyze which skills are most in-demand vs fulfilled."""
        tasks_df = self.export_tasks()
        users_df = self.export_users()
        
        if tasks_df.empty:
            return {"error": "No tasks found"}
        
        # Count skill demand from tasks
        skill_demand = defaultdict(int)
        for skills in tasks_df.get("requiredSkill", []):
            if skills:
                skill_demand[skills] += 1
        
        # Count skill supply from volunteers
        skill_supply = defaultdict(int)
        for user_skills in users_df.get("skills", []):
            if isinstance(user_skills, list):
                for skill in user_skills:
                    skill_supply[skill] += 1
        
        # Calculate gap
        all_skills = set(skill_demand.keys()) | set(skill_supply.keys())
        skill_gap = {}
        
        for skill in all_skills:
            demand = skill_demand.get(skill, 0)
            supply = skill_supply.get(skill, 0)
            skill_gap[skill] = {
                "demand": demand,
                "supply": supply,
                "gap": demand - supply,
                "fulfillment_rate": round(supply / demand * 100, 2) if demand > 0 else 0,
            }
        
        # Sort by gap (highest demand/lowest supply first)
        sorted_skills = sorted(
            skill_gap.items(),
            key=lambda x: x[1]["gap"],
            reverse=True
        )
        
        return {
            "total_unique_skills": len(all_skills),
            "skills": dict(sorted_skills),
            "critical_gaps": [s for s, d in sorted_skills if d["gap"] > 0][:5],
        }
    
    def attendance_time_series(self, days: int = 30) -> pd.DataFrame:
        """
        Generate time-series attendance data for trend analysis.
        
        Args:
            days: Number of days to look back
            
        Returns:
            DataFrame with daily attendance counts
        """
        attendance_df = self.export_attendance()
        
        if attendance_df.empty or "timestamp" not in attendance_df.columns:
            return pd.DataFrame()
        
        # Filter to recent data
        cutoff = datetime.now() - timedelta(days=days)
        attendance_df = attendance_df[attendance_df["timestamp"] >= cutoff]
        
        # Group by date
        attendance_df["date"] = attendance_df["timestamp"].dt.date
        daily_counts = attendance_df.groupby("date").size().reset_index(name="attendance_count")
        daily_counts["date"] = pd.to_datetime(daily_counts["date"])
        
        return daily_counts.sort_values("date")
    
    def task_completion_analysis(self) -> Dict:
        """Analyze task completion rates and patterns."""
        tasks_df = self.export_tasks()
        
        if tasks_df.empty:
            return {"error": "No tasks found"}
        
        status_counts = tasks_df["status"].value_counts().to_dict()
        
        total_tasks = len(tasks_df)
        completion_rate = (status_counts.get("completed", 0) / total_tasks * 100) if total_tasks > 0 else 0
        
        return {
            "total_tasks": total_tasks,
            "status_breakdown": status_counts,
            "completion_rate": round(completion_rate, 2),
            "avg_points_per_task": float(tasks_df["pointsValue"].mean()) if "pointsValue" in tasks_df.columns else 0,
        }
    
    # ========== DATA QUALITY ==========
    
    def data_quality_report(self) -> Dict:
        """Generate a data quality report."""
        users_df = self.export_users()
        tasks_df = self.export_tasks()
        attendance_df = self.export_attendance()
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "users": {
                "total": len(users_df),
                "missing_email": users_df["email"].isna().sum(),
                "missing_role": users_df["role"].isna().sum(),
                "admins": (users_df["role"] == "admin").sum(),
                "volunteers": (users_df["role"] == "volunteer").sum(),
            },
            "tasks": {
                "total": len(tasks_df),
                "open": (tasks_df["status"] == "open").sum() if "status" in tasks_df.columns else 0,
                "assigned": (tasks_df["status"] == "assigned").sum() if "status" in tasks_df.columns else 0,
                "completed": (tasks_df["status"] == "completed").sum() if "status" in tasks_df.columns else 0,
            },
            "attendance": {
                "total_records": len(attendance_df),
                "unique_volunteers": attendance_df["userId"].nunique() if not attendance_df.empty else 0,
            },
        }
        
        return report
    
    # ========== EXPORT FOR ML ==========
    
    def export_for_ml_training(self, output_dir: str = "ml_data") -> Dict:
        """
        Export all data in formats suitable for ML training.
        
        Creates CSV files for use with scikit-learn, TensorFlow, etc.
        """
        os.makedirs(output_dir, exist_ok=True)
        
        files_created = {}
        
        # Export users
        users_df = self.export_users()
        users_path = os.path.join(output_dir, "users.csv")
        users_df.to_csv(users_path, index=False)
        files_created["users"] = users_path
        
        # Export tasks
        tasks_df = self.export_tasks()
        tasks_path = os.path.join(output_dir, "tasks.csv")
        tasks_df.to_csv(tasks_path, index=False)
        files_created["tasks"] = tasks_path
        
        # Export attendance
        attendance_df = self.export_attendance()
        attendance_path = os.path.join(output_dir, "attendance.csv")
        attendance_df.to_csv(attendance_path, index=False)
        files_created["attendance"] = attendance_path
        
        # Export engagement analysis
        engagement = self.volunteer_engagement_analysis()
        if "dataframe" in engagement:
            engagement_path = os.path.join(output_dir, "engagement_scores.csv")
            engagement["dataframe"].to_csv(engagement_path, index=False)
            files_created["engagement"] = engagement_path
        
        # Export metadata
        metadata = {
            "export_timestamp": datetime.now().isoformat(),
            "data_quality": self.data_quality_report(),
            "files": files_created,
        }
        
        metadata_path = os.path.join(output_dir, "metadata.json")
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2, default=str)
        files_created["metadata"] = metadata_path
        
        print(f"\n✅ ML training data exported to '{output_dir}/'")
        for key, path in files_created.items():
            print(f"   - {key}: {path}")
        
        return files_created


# ========== CLI INTERFACE ==========

def main():
    """Command-line interface for data science utilities."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Data Science Utilities for Church Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python data_science_utils.py --export-all
  python data_science_utils.py --engagement
  python data_science_utils.py --skills
  python data_science_utils.py --quality
  python data_science_utils.py --ml-export
        """
    )
    
    parser.add_argument("--export-all", action="store_true", help="Export all data to CSVs")
    parser.add_argument("--engagement", action="store_true", help="Analyze volunteer engagement")
    parser.add_argument("--skills", action="store_true", help="Analyze skill demand/supply")
    parser.add_argument("--tasks", action="store_true", help="Analyze task completion")
    parser.add_argument("--attendance", action="store_true", help="Analyze attendance trends")
    parser.add_argument("--quality", action="store_true", help="Generate data quality report")
    parser.add_argument("--ml-export", action="store_true", help="Export for ML training")
    
    args = parser.parse_args()
    
    try:
        analyzer = DataScienceAnalyzer()
        
        if args.export_all or not any(vars(args).values()):
            print("\n📊 Exporting all data...")
            users = analyzer.export_users()
            tasks = analyzer.export_tasks()
            attendance = analyzer.export_attendance()
            print(f"   Users: {len(users)}")
            print(f"   Tasks: {len(tasks)}")
            print(f"   Attendance records: {len(attendance)}")
        
        if args.engagement:
            print("\n👥 Volunteer Engagement Analysis:")
            result = analyzer.volunteer_engagement_analysis()
            print(json.dumps(result.get("summary"), indent=2))
        
        if args.skills:
            print("\n🎯 Skill Demand Analysis:")
            result = analyzer.skill_demand_analysis()
            print(json.dumps(result, indent=2, default=str))
        
        if args.tasks:
            print("\n✅ Task Completion Analysis:")
            result = analyzer.task_completion_analysis()
            print(json.dumps(result, indent=2))
        
        if args.attendance:
            print("\n📅 Attendance Time Series:")
            result = analyzer.attendance_time_series()
            print(result.to_string())
        
        if args.quality:
            print("\n🔍 Data Quality Report:")
            result = analyzer.data_quality_report()
            print(json.dumps(result, indent=2, default=str))
        
        if args.ml_export:
            analyzer.export_for_ml_training()
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
