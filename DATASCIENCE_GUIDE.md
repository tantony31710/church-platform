# Data Science & AI Engineering Guide

## Quick Start

This guide covers all data science, database, and AI engineering tools available for the church-platform. As a data scientist and AI engineer, you have access to:

1. **Admin Bootstrap** - Fix admin access issues
2. **Data Science Utilities** - Extract, analyze, and export data
3. **AI Engineering** - ML models, predictions, and clustering
4. **Database Schema** - Complete Firestore structure documentation

---

## 1. Admin Access Fix

### Problem
You're an admin but can't access admin features because your user role is still `'volunteer'` in Firestore.

### Solution: Admin Bootstrap Script

#### Setup

1. Get your Firebase service account key:
   ```bash
   # Go to: Firebase Console → Project Settings → Service Accounts
   # Click "Generate New Private Key"
   # Save as: serviceAccountKey.json (in project root)
   # Add to .gitignore (DO NOT commit to git)
   ```

2. Install dependencies:
   ```bash
   pip install firebase-admin
   ```

#### Usage

**Promote yourself to admin:**
```bash
python admin_bootstrap.py --email your-email@example.com --promote
```

**List all users and their roles:**
```bash
python admin_bootstrap.py --list
```

**Demote a user back to volunteer:**
```bash
python admin_bootstrap.py --email user@example.com --demote
```

#### Output Example
```
✅ Promoted 'you@example.com' to admin (UID: abc123xyz)
```

After running this, refresh your browser and you'll see the Admin tab in the navigation.

---

## 2. Data Science Utilities

### Overview
Extract, transform, and analyze church-platform data for insights and ML training.

### Setup

```bash
pip install firebase-admin pandas numpy scipy scikit-learn matplotlib seaborn
```

### Usage

#### CLI Commands

**Export all data to CSV:**
```bash
python data_science_utils.py --export-all
```

**Analyze volunteer engagement:**
```bash
python data_science_utils.py --engagement
```

**Analyze skill demand vs supply:**
```bash
python data_science_utils.py --skills
```

**Analyze task completion rates:**
```bash
python data_science_utils.py --tasks
```

**Analyze attendance trends:**
```bash
python data_science_utils.py --attendance
```

**Generate data quality report:**
```bash
python data_science_utils.py --quality
```

**Export for ML training:**
```bash
python data_science_utils.py --ml-export
```

#### Python API

Use the `DataScienceAnalyzer` class in your own scripts:

```python
from data_science_utils import DataScienceAnalyzer

# Initialize
analyzer = DataScienceAnalyzer()

# Export data
users_df = analyzer.export_users()
tasks_df = analyzer.export_tasks()
attendance_df = analyzer.export_attendance()

# Analyze engagement
engagement = analyzer.volunteer_engagement_analysis()
print(engagement["summary"])
# Output:
# {
#   'total_volunteers': 25,
#   'avg_points': 145.2,
#   'avg_attendance': 8.4,
#   'avg_engagement_score': 52.3
# }

# Skill analysis
skills = analyzer.skill_demand_analysis()
print(skills["critical_gaps"])
# Output: ['AV/Tech', 'Organization']

# Time series
daily = analyzer.attendance_time_series(days=30)
print(daily)
# Output: DataFrame with daily attendance counts

# Task analysis
tasks = analyzer.task_completion_analysis()
print(f"Completion rate: {tasks['completion_rate']}%")

# Data quality
quality = analyzer.data_quality_report()
print(quality)
```

#### Output Files

When using `--ml-export`, creates `ml_data/` directory:
```
ml_data/
├── users.csv                    # All user profiles
├── tasks.csv                    # All tasks
├── attendance.csv               # All attendance records
├── engagement_scores.csv        # Computed engagement metrics
└── metadata.json                # Export metadata and quality report
```

---

## 3. AI Engineering Module

### Overview
Advanced ML models for predictions, clustering, and anomaly detection.

### Setup

```bash
pip install firebase-admin pandas numpy scikit-learn scipy xgboost joblib
```

### Usage

#### CLI Commands

**Predict volunteer churn risk:**
```bash
python ai_engineering.py --churn
```

Output:
```
🚨 Churn Risk Prediction:
{
  "total_volunteers": 25,
  "at_risk_count": 3,
  "at_risk_percentage": 12.0,
  "risk_distribution": {
    "Low": 18,
    "Medium": 4,
    "High": 2,
    "Critical": 1
  },
  "critical_risk": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "total_attendance": 2,
      "days_since_last_attendance": 120,
      "churn_risk_score": 2.0
    }
  ]
}
```

**Forecast engagement trends:**
```bash
python ai_engineering.py --forecast
```

**Recommend task assignments:**
```bash
python ai_engineering.py --recommend
```

**Cluster volunteers by behavior:**
```bash
python ai_engineering.py --cluster
```

Output:
```
🎯 Volunteer Clustering:
{
  "n_clusters": 3,
  "silhouette_score": 0.652,
  "davies_bouldin_score": 0.845,
  "cluster_profiles": [
    {
      "cluster_id": 0,
      "size": 12,
      "avg_points": 180.5,
      "avg_attendance": 14.2,
      "avg_engagement": 0.78,
      "members": [...]
    },
    ...
  ]
}
```

**Detect anomalies:**
```bash
python ai_engineering.py --anomalies
```

#### Python API

```python
from ai_engineering import VolunteerAIEngine

# Initialize
engine = VolunteerAIEngine()

# Churn prediction
churn = engine.predict_churn_risk(threshold_days=60)
print(f"At-risk volunteers: {churn['at_risk_count']}")
print(churn['critical_risk'])

# Engagement forecasting
forecast = engine.forecast_engagement(periods=12)
for f in forecast['forecasts']:
    print(f"{f['name']}: {f['forecast_avg']:.2f} expected attendance/week")

# Task recommendations
recs = engine.recommend_task_assignments(top_n=5)
for task in recs['recommendations']:
    print(f"Task: {task['task_title']}")
    for candidate in task['candidates']:
        print(f"  - {candidate['name']} ({candidate['points']} points)")

# Clustering
clusters = engine.cluster_volunteers(n_clusters=3)
for profile in clusters['cluster_profiles']:
    print(f"Cluster {profile['cluster_id']}: {profile['size']} volunteers")
    print(f"  Avg engagement: {profile['avg_engagement']:.2f}")

# Anomaly detection
anomalies = engine.detect_anomalies(contamination=0.1)
print(f"Found {anomalies['total_anomalies']} anomalies")
for anomaly in anomalies['anomalies']:
    print(f"  - {anomaly['name']}: {anomaly['points']} points")
```

---

## 4. Database Schema

See `DATABASE_SCHEMA.md` for complete documentation on:

- **Collections:** users, tasks, attendance, leaderboard, events, skills
- **Document structures** and field types
- **Relationships** between collections
- **Security rules** and access control
- **Indexing strategy** for performance
- **Data migration** and seeding

---

## 5. Complete Workflow Example

### Scenario: Identify and re-engage at-risk volunteers

```python
from data_science_utils import DataScienceAnalyzer
from ai_engineering import VolunteerAIEngine

# Step 1: Initialize
analyzer = DataScienceAnalyzer()
engine = VolunteerAIEngine()

# Step 2: Predict churn risk
churn_predictions = engine.predict_churn_risk()
print(f"⚠️  {churn_predictions['at_risk_count']} volunteers at risk of churning")

# Step 3: Get engagement analysis
engagement = analyzer.volunteer_engagement_analysis()
print(f"📊 Average engagement score: {engagement['summary']['avg_engagement_score']}")

# Step 4: Identify critical cases
critical = churn_predictions['critical_risk']
for volunteer in critical:
    print(f"\n🚨 {volunteer['name']} ({volunteer['email']})")
    print(f"   Last attended: {volunteer['days_since_last_attendance']} days ago")
    print(f"   Attendance: {volunteer['total_attendance']} times")
    print(f"   Churn risk: {volunteer['churn_risk_score']:.1%}")

# Step 5: Recommend re-engagement tasks
recommendations = engine.recommend_task_assignments()
for task in recommendations['recommendations']:
    print(f"\n💡 Task: {task['task_title']}")
    print(f"   Skill needed: {task['required_skill']}")
    print(f"   Top candidates:")
    for candidate in task['candidates'][:3]:
        print(f"     - {candidate['name']} ({candidate['points']} points)")

# Step 6: Export for further analysis
analyzer.export_for_ml_training()
print("\n✅ Data exported to ml_data/ for advanced ML workflows")
```

---

## 6. Advanced Use Cases

### Use Case 1: Predict Task Completion Time

```python
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from data_science_utils import DataScienceAnalyzer

analyzer = DataScienceAnalyzer()

# Get historical tasks
tasks_df = analyzer.export_tasks()
users_df = analyzer.export_users()

# Feature engineering
tasks_df = tasks_df.merge(users_df[['uid', 'points']], 
                          left_on='assignedTo', right_on='uid', how='left')

# Train model (simplified example)
X = tasks_df[['pointsValue', 'points']].fillna(0)
y = tasks_df['deadline']  # or completion time

# model = RandomForestRegressor()
# model.fit(X, y)
```

### Use Case 2: Segment Volunteers for Targeted Campaigns

```python
from ai_engineering import VolunteerAIEngine

engine = VolunteerAIEngine()

# Cluster volunteers
clusters = engine.cluster_volunteers(n_clusters=4)

# For each cluster, create targeted engagement strategy
for profile in clusters['cluster_profiles']:
    cluster_id = profile['cluster_id']
    avg_engagement = profile['avg_engagement']
    
    if avg_engagement > 0.8:
        strategy = "Leadership opportunities"
    elif avg_engagement > 0.5:
        strategy = "Regular task assignments"
    else:
        strategy = "Re-engagement campaign"
    
    print(f"Cluster {cluster_id}: {strategy}")
```

### Use Case 3: Skill Gap Analysis for Training

```python
from data_science_utils import DataScienceAnalyzer

analyzer = DataScienceAnalyzer()

# Analyze skill gaps
skills = analyzer.skill_demand_analysis()

# Identify training priorities
for skill, data in skills['skills'].items():
    if data['gap'] > 0:
        print(f"Training needed: {skill}")
        print(f"  Demand: {data['demand']} tasks")
        print(f"  Supply: {data['supply']} volunteers")
        print(f"  Gap: {data['gap']} volunteers needed")
```

---

## 7. Troubleshooting

### Issue: "Service account key not found"

**Solution:**
```bash
# 1. Go to Firebase Console → Project Settings → Service Accounts
# 2. Click "Generate New Private Key"
# 3. Save as serviceAccountKey.json in project root
# 4. Add to .gitignore
echo "serviceAccountKey.json" >> .gitignore
```

### Issue: "Permission denied" errors

**Solution:**
- Ensure your Firebase project has Firestore enabled
- Check that your service account has Editor role
- Verify firestore.rules are correctly deployed

### Issue: "No data found"

**Solution:**
- Seed sample data first: `python firestore_data_utils.py`
- Check that data exists in Firebase Console
- Verify your Firestore rules allow reads

### Issue: "ModuleNotFoundError"

**Solution:**
```bash
# Install all dependencies
pip install firebase-admin pandas numpy scipy scikit-learn matplotlib seaborn xgboost joblib
```

---

## 8. Best Practices

### Data Science Workflow

1. **Understand the data** - Run `--quality` to check data integrity
2. **Export for analysis** - Use `--ml-export` to get CSV files
3. **Exploratory analysis** - Use pandas and matplotlib
4. **Feature engineering** - Create meaningful features
5. **Model training** - Use scikit-learn or XGBoost
6. **Validation** - Cross-validate and test on holdout set
7. **Deployment** - Save models and integrate into app

### Security

- **Never commit** `serviceAccountKey.json` to git
- **Use environment variables** for sensitive paths
- **Rotate service account keys** regularly
- **Audit access logs** for sensitive operations

### Performance

- **Batch operations** for large data exports
- **Use indexes** for frequently queried fields
- **Cache results** to avoid repeated queries
- **Monitor Firestore costs** (reads/writes/storage)

---

## 9. File Reference

| File | Purpose |
|------|---------|
| `admin_bootstrap.py` | Fix admin access, manage roles |
| `data_science_utils.py` | Extract, analyze, export data |
| `ai_engineering.py` | ML models, predictions, clustering |
| `firestore_data_utils.py` | Seed sample data |
| `DATABASE_SCHEMA.md` | Complete schema documentation |
| `DATASCIENCE_GUIDE.md` | This file |

---

## 10. Next Steps

1. **Fix admin access:** Run `python admin_bootstrap.py --email your@email.com --promote`
2. **Explore data:** Run `python data_science_utils.py --quality`
3. **Run analyses:** Try `python ai_engineering.py --churn`
4. **Export for ML:** Run `python data_science_utils.py --ml-export`
5. **Build models:** Use the CSV files in `ml_data/` with your favorite ML tools

---

## Support & Questions

For issues or questions:
- Check `DATABASE_SCHEMA.md` for data structure questions
- Review Firestore documentation: https://firebase.google.com/docs/firestore
- Check scikit-learn docs: https://scikit-learn.org/

