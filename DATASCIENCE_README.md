# Church Platform - Data Science & AI Engineering Tools

Welcome! This package contains comprehensive data science, database, and AI engineering tools for the church-platform volunteer management system.

## 📋 What's Included

### 1. **Admin Bootstrap** (`admin_bootstrap.py`)
Fix admin access issues and manage user roles.

```bash
python admin_bootstrap.py --email your@email.com --promote
```

### 2. **Data Science Utilities** (`data_science_utils.py`)
Extract, transform, and analyze volunteer data.

```bash
python data_science_utils.py --engagement
python data_science_utils.py --skills
python data_science_utils.py --ml-export
```

### 3. **AI Engineering** (`ai_engineering.py`)
Machine learning models for predictions and insights.

```bash
python ai_engineering.py --churn
python ai_engineering.py --cluster
python ai_engineering.py --recommend
```

### 4. **Database Schema** (`DATABASE_SCHEMA.md`)
Complete Firestore database documentation.

### 5. **Data Science Guide** (`DATASCIENCE_GUIDE.md`)
Comprehensive guide with examples and best practices.

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install -r requirements-datascience.txt
```

### Step 2: Setup Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save as `serviceAccountKey.json` in the project root
5. **Important:** Add to `.gitignore` (never commit this file!)

```bash
echo "serviceAccountKey.json" >> .gitignore
```

### Step 3: Fix Admin Access

If you're an admin but can't access admin features:

```bash
python admin_bootstrap.py --email your@email.com --promote
```

Refresh your browser and you'll see the Admin tab!

### Step 4: Explore Your Data

```bash
# Check data quality
python data_science_utils.py --quality

# Analyze engagement
python data_science_utils.py --engagement

# Predict churn risk
python ai_engineering.py --churn

# Export for ML training
python data_science_utils.py --ml-export
```

---

## 📊 Key Features

### Data Analysis
- **Volunteer Engagement Analysis** - Comprehensive engagement scoring
- **Skill Demand Analysis** - Identify skill gaps and training needs
- **Task Completion Analysis** - Track task completion rates
- **Attendance Trends** - Time-series analysis of attendance patterns
- **Data Quality Reports** - Validate data integrity

### Machine Learning
- **Churn Prediction** - Identify volunteers at risk of leaving
- **Engagement Forecasting** - Predict future engagement levels
- **Volunteer Clustering** - Segment volunteers by behavior
- **Anomaly Detection** - Identify unusual patterns
- **Task Recommendations** - Suggest optimal task assignments

### Data Export
- **CSV Export** - All data exported to CSV for external analysis
- **ML Training Format** - Prepared datasets for scikit-learn, XGBoost, etc.
- **Metadata & Quality Reports** - Comprehensive data documentation

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **DATASCIENCE_GUIDE.md** | Complete guide with examples and workflows |
| **DATABASE_SCHEMA.md** | Firestore schema, collections, and relationships |
| **admin_bootstrap.py** | Fix admin access and manage roles |
| **data_science_utils.py** | Data extraction and analysis |
| **ai_engineering.py** | ML models and predictions |

---

## 💡 Example Workflows

### Workflow 1: Identify At-Risk Volunteers

```python
from ai_engineering import VolunteerAIEngine

engine = VolunteerAIEngine()

# Predict churn risk
churn = engine.predict_churn_risk()
print(f"⚠️  {churn['at_risk_count']} volunteers at risk")

# Get critical cases
for volunteer in churn['critical_risk']:
    print(f"{volunteer['name']}: {volunteer['days_since_last_attendance']} days inactive")
```

### Workflow 2: Analyze Engagement Trends

```python
from data_science_utils import DataScienceAnalyzer

analyzer = DataScienceAnalyzer()

# Get engagement analysis
engagement = analyzer.volunteer_engagement_analysis()

# Top performers
print("🏆 Top Performers:")
for performer in engagement['top_performers']:
    print(f"  {performer['name']}: {performer['engagement_score']:.1f}/100")

# Engagement distribution
print("\n📊 Engagement Distribution:")
print(engagement['by_level'])
```

### Workflow 3: Recommend Task Assignments

```python
from ai_engineering import VolunteerAIEngine

engine = VolunteerAIEngine()

# Get recommendations
recs = engine.recommend_task_assignments(top_n=5)

# For each task, see best candidates
for task in recs['recommendations']:
    print(f"\n📋 {task['task_title']}")
    print(f"   Skill: {task['required_skill']}")
    for candidate in task['candidates']:
        print(f"   - {candidate['name']} ({candidate['points']} points)")
```

### Workflow 4: Export for Advanced ML

```python
from data_science_utils import DataScienceAnalyzer

analyzer = DataScienceAnalyzer()

# Export all data to CSV
analyzer.export_for_ml_training()

# Now use with your favorite ML tools:
# - scikit-learn for classification/clustering
# - XGBoost for gradient boosting
# - TensorFlow for deep learning
# - Pandas for data manipulation
```

---

## 🔍 CLI Commands Reference

### Admin Bootstrap

```bash
# Promote user to admin
python admin_bootstrap.py --email user@example.com --promote

# Demote user to volunteer
python admin_bootstrap.py --email user@example.com --demote

# List all users and roles
python admin_bootstrap.py --list
```

### Data Science Utilities

```bash
# Export all data to CSV
python data_science_utils.py --export-all

# Analyze volunteer engagement
python data_science_utils.py --engagement

# Analyze skill demand vs supply
python data_science_utils.py --skills

# Analyze task completion
python data_science_utils.py --tasks

# Analyze attendance trends
python data_science_utils.py --attendance

# Generate data quality report
python data_science_utils.py --quality

# Export for ML training
python data_science_utils.py --ml-export
```

### AI Engineering

```bash
# Predict churn risk
python ai_engineering.py --churn

# Forecast engagement
python ai_engineering.py --forecast

# Recommend task assignments
python ai_engineering.py --recommend

# Cluster volunteers
python ai_engineering.py --cluster

# Detect anomalies
python ai_engineering.py --anomalies
```

---

## 📁 Output Files

### ML Export Directory (`ml_data/`)

```
ml_data/
├── users.csv                    # User profiles
├── tasks.csv                    # Task data
├── attendance.csv               # Attendance records
├── engagement_scores.csv        # Computed engagement metrics
└── metadata.json                # Export metadata and quality report
```

### Model Directory (`ai_models/`)

```
ai_models/
├── scaler_*.pkl                 # Feature scalers
├── encoder_*.pkl                # Label encoders
└── model_*.pkl                  # Trained models
```

---

## 🔐 Security

### Important Security Notes

1. **Never commit `serviceAccountKey.json`** - Add to `.gitignore`
2. **Rotate service account keys** regularly
3. **Use environment variables** for sensitive paths
4. **Audit access logs** for sensitive operations
5. **Restrict Firebase project access** to authorized users

### Environment Variables

```bash
# Set custom service account path
export FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json

# Then run scripts
python data_science_utils.py --quality
```

---

## 🐛 Troubleshooting

### Issue: "Service account key not found"

**Solution:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in project root
4. Add to `.gitignore`

### Issue: "Permission denied" errors

**Solution:**
- Ensure service account has Editor role in Firebase
- Check that Firestore is enabled in your project
- Verify firestore.rules are correctly deployed

### Issue: "No data found"

**Solution:**
- Seed sample data: `python firestore_data_utils.py`
- Check Firebase Console for data
- Verify Firestore rules allow reads

### Issue: "ModuleNotFoundError"

**Solution:**
```bash
pip install -r requirements-datascience.txt
```

---

## 📚 Learning Resources

- **Firestore Documentation:** https://firebase.google.com/docs/firestore
- **scikit-learn Guide:** https://scikit-learn.org/
- **Pandas Documentation:** https://pandas.pydata.org/
- **Firebase Admin SDK:** https://firebase.google.com/docs/database/admin/start

---

## 🤝 Contributing

To add new analyses or models:

1. Add functions to `data_science_utils.py` or `ai_engineering.py`
2. Update `DATASCIENCE_GUIDE.md` with examples
3. Add CLI commands if applicable
4. Test with sample data

---

## 📞 Support

For issues or questions:
- Check `DATASCIENCE_GUIDE.md` for detailed examples
- Review `DATABASE_SCHEMA.md` for data structure questions
- Check script docstrings for function documentation
- Review error messages carefully

---

## 📝 File Summary

| File | Size | Purpose |
|------|------|---------|
| `admin_bootstrap.py` | ~3 KB | Admin role management |
| `data_science_utils.py` | ~15 KB | Data extraction & analysis |
| `ai_engineering.py` | ~18 KB | ML models & predictions |
| `DATABASE_SCHEMA.md` | ~12 KB | Schema documentation |
| `DATASCIENCE_GUIDE.md` | ~20 KB | Complete guide |
| `requirements-datascience.txt` | ~1 KB | Dependencies |

---

## 🎯 Next Steps

1. ✅ Install dependencies: `pip install -r requirements-datascience.txt`
2. ✅ Setup Firebase service account
3. ✅ Fix admin access: `python admin_bootstrap.py --email your@email.com --promote`
4. ✅ Explore data: `python data_science_utils.py --quality`
5. ✅ Run analyses: `python ai_engineering.py --churn`
6. ✅ Export for ML: `python data_science_utils.py --ml-export`

---

**Ready to dive in? Start with the [DATASCIENCE_GUIDE.md](DATASCIENCE_GUIDE.md) for comprehensive examples!**

