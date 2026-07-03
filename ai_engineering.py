#!/usr/bin/env python3
"""
AI Engineering Module for Church Platform

Advanced machine learning, predictive analytics, and AI-powered insights
for volunteer management and engagement optimization.

FEATURES:
  - Volunteer churn prediction (who might stop volunteering)
  - Engagement forecasting (predict future engagement levels)
  - Skill-task matching (recommend optimal task assignments)
  - Anomaly detection (identify unusual patterns)
  - Clustering analysis (segment volunteers by behavior)
  - Feature engineering for ML pipelines
  - Model training and evaluation utilities

SETUP:
    pip install firebase-admin pandas numpy scikit-learn scipy xgboost joblib

USAGE:
    from ai_engineering import VolunteerAIEngine
    
    engine = VolunteerAIEngine()
    
    # Predict churn risk
    churn_predictions = engine.predict_churn_risk()
    
    # Recommend task assignments
    recommendations = engine.recommend_task_assignments()
    
    # Cluster volunteers
    clusters = engine.cluster_volunteers()
    
    # Detect anomalies
    anomalies = engine.detect_anomalies()
"""

import os
import sys
import json
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    silhouette_score, davies_bouldin_score
)
import firebase_admin
from firebase_admin import credentials, firestore
from data_science_utils import DataScienceAnalyzer


class VolunteerAIEngine:
    """AI/ML engine for volunteer management and engagement optimization."""
    
    def __init__(self, service_account_path: Optional[str] = None):
        """Initialize the AI engine."""
        self.analyzer = DataScienceAnalyzer(service_account_path)
        self.models = {}
        self.scalers = {}
        self.encoders = {}
    
    # ========== FEATURE ENGINEERING ==========
    
    def _engineer_features(self, users_df: pd.DataFrame, 
                          attendance_df: pd.DataFrame,
                          tasks_df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer features for ML models.
        
        Creates derived features like:
        - Days since last attendance
        - Attendance frequency (per week/month)
        - Task completion rate
        - Skill diversity
        - Engagement trend
        """
        features = users_df[["uid", "name", "email", "role", "points"]].copy()
        
        # Attendance features
        if not attendance_df.empty:
            attendance_df["date"] = pd.to_datetime(attendance_df["timestamp"]).dt.date
            
            # Count attendance by user
            attendance_counts = attendance_df.groupby("userId").size().reset_index(name="total_attendance")
            features = features.merge(attendance_counts, left_on="uid", right_on="userId", how="left")
            features["total_attendance"] = features["total_attendance"].fillna(0)
            
            # Days since last attendance
            last_attendance = attendance_df.groupby("userId")["timestamp"].max().reset_index()
            last_attendance.columns = ["userId", "last_attendance"]
            features = features.merge(last_attendance, left_on="uid", right_on="userId", how="left")
            
            now = datetime.now()
            features["days_since_last_attendance"] = features["last_attendance"].apply(
                lambda x: (now - x.replace(tzinfo=None)).days if pd.notna(x) else 999
            )
            
            # Attendance frequency (per 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_attendance = attendance_df[
                pd.to_datetime(attendance_df["timestamp"]) >= thirty_days_ago
            ].groupby("userId").size().reset_index(name="attendance_last_30d")
            features = features.merge(attendance_counts, left_on="uid", right_on="userId", how="left")
            features["attendance_last_30d"] = features.get("attendance_last_30d", 0).fillna(0)
        else:
            features["total_attendance"] = 0
            features["days_since_last_attendance"] = 999
            features["attendance_last_30d"] = 0
        
        # Skill features
        features["num_skills"] = users_df.get("skills", pd.Series()).apply(
            lambda x: len(x) if isinstance(x, list) else 0
        )
        
        # Points-based features
        features["points_per_attendance"] = np.where(
            features["total_attendance"] > 0,
            features["points"] / features["total_attendance"],
            0
        )
        
        # Engagement score (normalized 0-1)
        max_points = features["points"].max() if features["points"].max() > 0 else 1
        max_attendance = features["total_attendance"].max() if features["total_attendance"].max() > 0 else 1
        
        features["engagement_score"] = (
            (features["points"] / max_points * 0.5) +
            (features["total_attendance"] / max_attendance * 0.5)
        )
        
        # Tenure features (based on first attendance or account creation)
        # For now, use points as proxy for tenure
        features["tenure_proxy"] = pd.cut(features["points"], bins=5, labels=False, duplicates='drop').fillna(0)
        
        return features
    
    # ========== CHURN PREDICTION ==========
    
    def predict_churn_risk(self, threshold_days: int = 60) -> Dict:
        """
        Predict which volunteers are at risk of churning (stopping volunteering).
        
        Uses attendance patterns and engagement metrics to identify at-risk volunteers.
        
        Args:
            threshold_days: Consider inactive if no attendance in N days
            
        Returns:
            Dict with churn predictions and risk scores
        """
        users_df = self.analyzer.export_users()
        attendance_df = self.analyzer.export_attendance()
        
        if users_df.empty:
            return {"error": "No user data"}
        
        features = self._engineer_features(users_df, attendance_df, pd.DataFrame())
        
        # Simple heuristic model: high risk if inactive for threshold_days
        features["churn_risk"] = features["days_since_last_attendance"] >= threshold_days
        features["churn_risk_score"] = np.clip(
            features["days_since_last_attendance"] / threshold_days,
            0, 1
        )
        
        # Categorize risk
        def risk_category(score):
            if score < 0.3:
                return "Low"
            elif score < 0.6:
                return "Medium"
            elif score < 0.9:
                return "High"
            else:
                return "Critical"
        
        features["risk_category"] = features["churn_risk_score"].apply(risk_category)
        
        # Get at-risk volunteers
        at_risk = features[features["churn_risk"]].sort_values("churn_risk_score", ascending=False)
        
        return {
            "total_volunteers": len(features),
            "at_risk_count": len(at_risk),
            "at_risk_percentage": round(len(at_risk) / len(features) * 100, 2),
            "risk_distribution": features["risk_category"].value_counts().to_dict(),
            "critical_risk": at_risk[at_risk["risk_category"] == "Critical"][
                ["name", "email", "total_attendance", "days_since_last_attendance", "churn_risk_score"]
            ].head(10).to_dict("records"),
            "high_risk": at_risk[at_risk["risk_category"] == "High"][
                ["name", "email", "total_attendance", "days_since_last_attendance", "churn_risk_score"]
            ].head(10).to_dict("records"),
            "features_df": features,
        }
    
    # ========== ENGAGEMENT FORECASTING ==========
    
    def forecast_engagement(self, periods: int = 12) -> Dict:
        """
        Forecast future engagement levels for each volunteer.
        
        Uses historical engagement trends to predict future activity.
        
        Args:
            periods: Number of periods (weeks) to forecast
            
        Returns:
            Dict with engagement forecasts
        """
        users_df = self.analyzer.export_users()
        attendance_df = self.analyzer.export_attendance()
        
        if attendance_df.empty:
            return {"error": "Insufficient attendance data"}
        
        # Group attendance by user and week
        attendance_df["date"] = pd.to_datetime(attendance_df["timestamp"]).dt.date
        attendance_df["week"] = pd.to_datetime(attendance_df["date"]).dt.isocalendar().week
        attendance_df["year"] = pd.to_datetime(attendance_df["date"]).dt.isocalendar().year
        
        weekly_counts = attendance_df.groupby(["userId", "year", "week"]).size().reset_index(name="count")
        
        forecasts = []
        
        for user_id in users_df["uid"].unique():
            user_data = weekly_counts[weekly_counts["userId"] == user_id]
            
            if len(user_data) < 2:
                continue
            
            # Simple trend: average of last 4 weeks
            recent_avg = user_data.tail(4)["count"].mean()
            
            # Forecast: assume trend continues
            forecast_values = [recent_avg] * periods
            
            user_info = users_df[users_df["uid"] == user_id].iloc[0]
            
            forecasts.append({
                "uid": user_id,
                "name": user_info["name"],
                "current_engagement": recent_avg,
                "forecast": forecast_values,
                "forecast_avg": np.mean(forecast_values),
                "trend": "stable" if abs(forecast_values[0] - recent_avg) < 0.5 else "declining",
            })
        
        return {
            "forecast_periods": periods,
            "forecasts": forecasts,
            "declining_volunteers": [f for f in forecasts if f["trend"] == "declining"],
        }
    
    # ========== SKILL-TASK MATCHING ==========
    
    def recommend_task_assignments(self, top_n: int = 5) -> Dict:
        """
        Recommend optimal task assignments based on skill matching
        and volunteer availability/engagement.
        
        Args:
            top_n: Number of recommendations per task
            
        Returns:
            Dict with task-to-volunteer recommendations
        """
        users_df = self.analyzer.export_users()
        tasks_df = self.analyzer.export_tasks()
        
        if tasks_df.empty or users_df.empty:
            return {"error": "Insufficient data"}
        
        # Filter to open tasks
        open_tasks = tasks_df[tasks_df["status"] == "open"]
        
        recommendations = []
        
        for _, task in open_tasks.iterrows():
            required_skill = task.get("requiredSkill", "")
            
            # Find volunteers with matching skills
            matching_volunteers = users_df[
                users_df["skills"].apply(
                    lambda x: required_skill in x if isinstance(x, list) else False
                )
            ]
            
            # If no exact match, get all active volunteers
            if matching_volunteers.empty:
                matching_volunteers = users_df[users_df["role"] == "volunteer"]
            
            # Score by engagement
            matching_volunteers = matching_volunteers.copy()
            matching_volunteers["score"] = matching_volunteers["points"]
            
            # Get top candidates
            candidates = matching_volunteers.nlargest(top_n, "score")
            
            recommendations.append({
                "task_id": task.get("id"),
                "task_title": task.get("title"),
                "required_skill": required_skill,
                "candidates": candidates[["name", "email", "points", "skills"]].to_dict("records"),
            })
        
        return {
            "open_tasks": len(open_tasks),
            "recommendations": recommendations,
        }
    
    # ========== CLUSTERING & SEGMENTATION ==========
    
    def cluster_volunteers(self, n_clusters: int = 3) -> Dict:
        """
        Segment volunteers into clusters based on behavior patterns.
        
        Clusters might represent: "Highly Engaged", "Moderate", "At-Risk", etc.
        
        Args:
            n_clusters: Number of clusters to create
            
        Returns:
            Dict with cluster assignments and characteristics
        """
        users_df = self.analyzer.export_users()
        attendance_df = self.analyzer.export_attendance()
        tasks_df = self.analyzer.export_tasks()
        
        if users_df.empty:
            return {"error": "No user data"}
        
        features = self._engineer_features(users_df, attendance_df, tasks_df)
        
        # Select features for clustering
        feature_cols = ["points", "total_attendance", "num_skills", "engagement_score"]
        X = features[feature_cols].fillna(0)
        
        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Fit KMeans
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)
        
        features["cluster"] = clusters
        
        # Evaluate clustering
        silhouette = silhouette_score(X_scaled, clusters)
        davies_bouldin = davies_bouldin_score(X_scaled, clusters)
        
        # Characterize clusters
        cluster_profiles = []
        for cluster_id in range(n_clusters):
            cluster_data = features[features["cluster"] == cluster_id]
            
            profile = {
                "cluster_id": cluster_id,
                "size": len(cluster_data),
                "avg_points": float(cluster_data["points"].mean()),
                "avg_attendance": float(cluster_data["total_attendance"].mean()),
                "avg_engagement": float(cluster_data["engagement_score"].mean()),
                "members": cluster_data[["name", "email", "points", "total_attendance"]].head(5).to_dict("records"),
            }
            cluster_profiles.append(profile)
        
        return {
            "n_clusters": n_clusters,
            "silhouette_score": round(silhouette, 3),
            "davies_bouldin_score": round(davies_bouldin, 3),
            "cluster_profiles": cluster_profiles,
            "features_df": features,
        }
    
    # ========== ANOMALY DETECTION ==========
    
    def detect_anomalies(self, contamination: float = 0.1) -> Dict:
        """
        Detect unusual patterns in volunteer behavior.
        
        Identifies outliers that might indicate:
        - Unusual point accumulation (possible fraud)
        - Sudden engagement changes
        - Isolated behavior patterns
        
        Args:
            contamination: Expected proportion of anomalies (0-1)
            
        Returns:
            Dict with detected anomalies
        """
        users_df = self.analyzer.export_users()
        attendance_df = self.analyzer.export_attendance()
        tasks_df = self.analyzer.export_tasks()
        
        if users_df.empty:
            return {"error": "No user data"}
        
        features = self._engineer_features(users_df, attendance_df, tasks_df)
        
        # Select features
        feature_cols = ["points", "total_attendance", "points_per_attendance", "engagement_score"]
        X = features[feature_cols].fillna(0)
        
        # Detect anomalies using Isolation Forest
        iso_forest = IsolationForest(contamination=contamination, random_state=42)
        anomaly_labels = iso_forest.fit_predict(X)
        
        features["is_anomaly"] = anomaly_labels == -1
        anomalies = features[features["is_anomaly"]].sort_values("points", ascending=False)
        
        return {
            "total_anomalies": len(anomalies),
            "anomaly_percentage": round(len(anomalies) / len(features) * 100, 2),
            "anomalies": anomalies[["name", "email", "points", "total_attendance", "points_per_attendance"]].to_dict("records"),
        }
    
    # ========== MODEL PERSISTENCE ==========
    
    def save_models(self, output_dir: str = "ai_models") -> Dict:
        """Save trained models to disk."""
        os.makedirs(output_dir, exist_ok=True)
        
        saved_files = {}
        
        # Save scalers and encoders
        for name, scaler in self.scalers.items():
            path = os.path.join(output_dir, f"scaler_{name}.pkl")
            with open(path, "wb") as f:
                pickle.dump(scaler, f)
            saved_files[f"scaler_{name}"] = path
        
        for name, encoder in self.encoders.items():
            path = os.path.join(output_dir, f"encoder_{name}.pkl")
            with open(path, "wb") as f:
                pickle.dump(encoder, f)
            saved_files[f"encoder_{name}"] = path
        
        for name, model in self.models.items():
            path = os.path.join(output_dir, f"model_{name}.pkl")
            with open(path, "wb") as f:
                pickle.dump(model, f)
            saved_files[f"model_{name}"] = path
        
        return saved_files


# ========== CLI INTERFACE ==========

def main():
    """Command-line interface for AI engineering utilities."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="AI Engineering Utilities for Church Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ai_engineering.py --churn
  python ai_engineering.py --forecast
  python ai_engineering.py --recommend
  python ai_engineering.py --cluster
  python ai_engineering.py --anomalies
        """
    )
    
    parser.add_argument("--churn", action="store_true", help="Predict churn risk")
    parser.add_argument("--forecast", action="store_true", help="Forecast engagement")
    parser.add_argument("--recommend", action="store_true", help="Recommend task assignments")
    parser.add_argument("--cluster", action="store_true", help="Cluster volunteers")
    parser.add_argument("--anomalies", action="store_true", help="Detect anomalies")
    
    args = parser.parse_args()
    
    try:
        engine = VolunteerAIEngine()
        
        if args.churn or not any(vars(args).values()):
            print("\n🚨 Churn Risk Prediction:")
            result = engine.predict_churn_risk()
            print(json.dumps({k: v for k, v in result.items() if k != "features_df"}, indent=2, default=str))
        
        if args.forecast:
            print("\n📈 Engagement Forecasting:")
            result = engine.forecast_engagement()
            print(json.dumps({k: v for k, v in result.items()}, indent=2, default=str))
        
        if args.recommend:
            print("\n💡 Task Assignment Recommendations:")
            result = engine.recommend_task_assignments()
            print(json.dumps(result, indent=2, default=str))
        
        if args.cluster:
            print("\n🎯 Volunteer Clustering:")
            result = engine.cluster_volunteers()
            print(json.dumps({k: v for k, v in result.items() if k != "features_df"}, indent=2, default=str))
        
        if args.anomalies:
            print("\n⚠️  Anomaly Detection:")
            result = engine.detect_anomalies()
            print(json.dumps(result, indent=2, default=str))
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
