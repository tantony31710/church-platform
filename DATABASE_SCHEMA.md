# Church Platform Database Schema

## Overview

The church-platform uses **Firestore** (Google Cloud's NoSQL database) as its primary data store. This document describes the complete schema, including collections, document structures, and relationships.

## Collections

### 1. `users`
Stores volunteer and admin user profiles.

```
users/{uid}
├── id: string (Firebase Auth UID)
├── name: string
├── email: string
├── role: 'admin' | 'volunteer'
├── skills: string[] (e.g., ["AV/Tech", "Organization", "Teaching"])
├── points: number (gamification score)
└── createdAt: Timestamp (optional)
```

**Indexes:**
- `role` (for filtering by role)
- `points` (for leaderboard sorting)
- `email` (for unique lookups)

**Security Rules:**
- Users can read all profiles (needed for leaderboard)
- Users can only update their own profile (except `points` and `role`)
- Only admins can update `role` or delete users

---

### 2. `tasks`
Volunteer task assignments and tracking.

```
tasks/{taskId}
├── id: string (auto-generated)
├── title: string
├── description: string
├── requiredSkill: string (single skill, e.g., "AV/Tech")
├── deadline: Timestamp
├── status: 'open' | 'assigned' | 'completed'
├── assignedTo: string | null (uid of assigned volunteer)
├── pointsValue: number (points awarded on completion)
├── createdAt: Timestamp
├── completedAt: Timestamp (optional)
└── createdBy: string (uid of admin who created task)
```

**Indexes:**
- `status` (for filtering open/assigned/completed)
- `assignedTo` (for user's task list)
- `deadline` (for sorting by due date)

**Security Rules:**
- All signed-in users can read tasks
- Only admins can create/delete tasks
- Volunteers can claim an OPEN task for themselves (self-assignment only)
- Only admins can mark tasks as completed

---

### 3. `attendance`
Attendance records for events and volunteer presence tracking.

```
attendance/{recordId}
├── id: string (auto-generated)
├── userId: string (uid of volunteer)
├── eventId: string (identifier of the event)
├── timestamp: Timestamp (when attendance was recorded)
└── metadata: object (optional, e.g., {"location": "main_hall"})
```

**Indexes:**
- `userId` (for user's attendance history)
- `eventId` (for event attendance list)
- `timestamp` (for time-series analysis)

**Security Rules:**
- Admins can read all attendance records
- Volunteers can only read their own attendance
- Volunteers can only create their own attendance records
- Admins can update/delete any record

---

### 4. `leaderboard`
Denormalized leaderboard data (maintained by Cloud Functions).

```
leaderboard/{userId}
├── id: string (uid of volunteer)
├── name: string
├── points: number
├── rank: number
└── lastUpdated: Timestamp
```

**Notes:**
- This collection is **read-only** from the client
- Updated automatically by Cloud Functions when user points change
- Provides fast leaderboard queries without aggregation

**Security Rules:**
- All signed-in users can read
- No client writes allowed (Cloud Functions only)

---

### 5. `events` (Optional - for future expansion)
Church events and their metadata.

```
events/{eventId}
├── id: string (auto-generated)
├── name: string
├── description: string
├── date: Timestamp
├── location: string
├── type: string (e.g., "service", "meeting", "event")
├── capacity: number
├── attendanceCount: number
└── createdBy: string (uid of admin)
```

---

### 6. `skills` (Optional - reference data)
Master list of available skills for volunteers.

```
skills/{skillId}
├── id: string (auto-generated)
├── name: string (e.g., "AV/Tech", "Organization")
├── description: string
└── category: string (e.g., "technical", "organizational")
```

---

## Data Relationships

### User → Tasks
- A user can have multiple tasks assigned (`tasks.assignedTo == user.uid`)
- A task belongs to one user (or none if unassigned)

### User → Attendance
- A user has many attendance records (`attendance.userId == user.uid`)
- An attendance record belongs to one user

### Task → Skill
- A task requires one skill (`tasks.requiredSkill`)
- A user has multiple skills (`users.skills[]`)
- Matching is done in application logic

### User → Leaderboard
- One-to-one relationship (one leaderboard entry per user)
- Leaderboard is derived from user points

---

## Firestore Security Rules

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['points', 'role'])
        || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isSignedIn();
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (
        isSignedIn() &&
        resource.data.status == 'open' &&
        request.resource.data.assignedTo == request.auth.uid &&
        request.resource.data.status == 'assigned'
      );
    }
    
    // Attendance collection
    match /attendance/{recordId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }
    
    // Leaderboard collection (read-only)
    match /leaderboard/{userId} {
      allow read: if isSignedIn();
      allow write: if false;
    }
  }
}
```

---

## Data Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text | `"John Doe"` |
| `number` | Integer or float | `150`, `3.14` |
| `boolean` | True/false | `true` |
| `Timestamp` | Date and time | `2024-01-15T10:30:00Z` |
| `array` | List of values | `["skill1", "skill2"]` |
| `object` | Nested document | `{location: "main_hall"}` |
| `null` | Empty value | `null` |

---

## Indexing Strategy

### Composite Indexes (for complex queries)

| Collection | Fields | Purpose |
|------------|--------|---------|
| `users` | `role`, `points` | Filter admins by engagement |
| `tasks` | `status`, `deadline` | Find urgent open tasks |
| `attendance` | `userId`, `timestamp` | User attendance history |
| `leaderboard` | `points`, `rank` | Leaderboard sorting |

### Single Field Indexes

Firestore automatically creates single-field indexes for:
- Equality filters (`==`)
- Range queries (`<`, `<=`, `>`, `>=`)
- `in` queries

---

## Data Migration & Seeding

### Seed Sample Data

Use `firestore_data_utils.py`:

```bash
python firestore_data_utils.py
```

This creates:
- Sample tasks
- Sample users
- Sample attendance records

### Export Data for Analysis

```bash
python data_science_utils.py --export-all
```

Exports to CSV for data science workflows.

---

## Performance Considerations

### Read Optimization
- Leaderboard collection is denormalized for fast reads
- Single-field indexes on frequently filtered columns
- Composite indexes for multi-field queries

### Write Optimization
- Cloud Functions update leaderboard asynchronously
- Batch operations for bulk updates
- Avoid deep nesting (max 2-3 levels)

### Scalability
- Firestore scales to millions of documents
- Document size limit: 1 MB
- Collection size: unlimited
- Concurrent writes: up to 25,000/second per collection

---

## Backup & Recovery

### Automatic Backups
- Firestore maintains daily backups (30-day retention)
- Access via Firebase Console → Backups

### Manual Export
```bash
gcloud firestore export gs://your-bucket/backup-$(date +%s)
```

### Import from Backup
```bash
gcloud firestore import gs://your-bucket/backup-timestamp
```

---

## Future Schema Extensions

### Planned Collections

1. **`events`** - Church events and scheduling
2. **`skills`** - Master skill reference data
3. **`notifications`** - User notifications and preferences
4. **`audit_logs`** - Admin action audit trail
5. **`reports`** - Generated reports and exports

### Planned Fields

- User timezone and preferences
- Task priority levels
- Attendance check-in locations (GPS)
- Volunteer certifications and expiry dates

---

## Related Files

- **Security Rules:** `firestore.rules`
- **Indexes Config:** `firestore.indexes.json`
- **Data Utils:** `firestore_data_utils.py`, `data_science_utils.py`
- **AI Tools:** `ai_engineering.py`
- **Admin Tools:** `admin_bootstrap.py`

