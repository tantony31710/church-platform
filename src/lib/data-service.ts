import {
  Task,
  UserProfile,
  AttendanceRecord,
  LeaderboardEntry,
  ActiveSession,
  CommunityAnnouncement,
  AiTaskMatch,
  BenchmarkMetrics,
  Role,
  ChurchOrganizationSettings,
  PythonRagDocument,
  PythonChurnPrediction,
  PythonClusterResult,
  PythonForecastResult,
  PythonOptimizedAssignment,
} from './types';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase/client';

const STORAGE_KEYS = {
  USERS: 'church_connect_users_v3',
  TASKS: 'church_connect_tasks_v3',
  ATTENDANCE: 'church_connect_attendance_v3',
  SESSION: 'church_connect_active_session_v3',
  ANNOUNCEMENT: 'church_connect_announcement_v3',
  BENCHMARKS: 'church_connect_benchmarks_v3',
  CURRENT_USER_ID: 'church_connect_current_user_id_v3',
  ORGANIZATION: 'church_connect_organization_settings_v3',
};

const INITIAL_ORGANIZATION: ChurchOrganizationSettings = {
  churchName: 'Grace Community Church',
  campusName: 'Main Sanctuary & Community Center',
  address: '1200 Fellowship Parkway, Suite 100',
  phone: '(555) 723-4482',
  contactEmail: 'connect@gracechurch.org',
  leadPastorName: 'Pastor David Anderson',
  serviceTimes: 'Sundays at 9:00 AM & 11:00 AM',
  motto: 'Serving Together with Purpose & Grace',
  updatedAt: new Date().toISOString(),
};

// Initial Seed Volunteers - Exactly 1 Admin, all volunteers start with 0 points
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_david_admin',
    name: 'Pastor David Anderson',
    email: 'david.anderson@gracechurch.org',
    role: 'admin',
    skills: ['Leadership', 'Teaching', 'Counseling', 'Administration'],
    points: 0,
    department: 'Pastoral & Ministry Leadership',
    streak: 1,
    joinedDate: '2023-01-15',
    badges: ['Community Pillar', 'Faithful Leader'],
    tasksCompletedCount: 0,
    attendanceCount: 0,
  },
  {
    id: 'user_alex_tech',
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    role: 'volunteer',
    skills: ['AV / Tech', 'Sound Mixing', 'Live Streaming', 'Stage Lighting'],
    points: 0,
    department: 'Media & Production',
    streak: 1,
    joinedDate: '2023-04-10',
    badges: ['Tech Wizard'],
    tasksCompletedCount: 0,
    attendanceCount: 0,
  },
  {
    id: 'user_sarah_hosp',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@outlook.com',
    role: 'volunteer',
    skills: ['Hospitality', 'Welcome Team', 'Event Coordination', 'Food Prep'],
    points: 0,
    department: 'Hospitality & Connections',
    streak: 1,
    joinedDate: '2023-06-01',
    badges: ['Hospitality Hero'],
    tasksCompletedCount: 0,
    attendanceCount: 0,
  },
  {
    id: 'user_marcus_youth',
    name: 'Marcus Chen',
    email: 'marcus.chen@gmail.com',
    role: 'volunteer',
    skills: ['Youth & Childcare', 'Teaching', 'Sports & Games', 'Organization'],
    points: 0,
    department: 'NextGen Youth',
    streak: 1,
    joinedDate: '2023-08-20',
    badges: ['NextGen Champion'],
    tasksCompletedCount: 0,
    attendanceCount: 0,
  },
  {
    id: 'user_grace_music',
    name: 'Grace Taylor',
    email: 'grace.taylor@musicchurch.org',
    role: 'volunteer',
    skills: ['Music & Worship', 'Vocalist', 'Piano & Keys', 'Acoustic Guitar'],
    points: 0,
    department: 'Worship Arts',
    streak: 1,
    joinedDate: '2023-02-14',
    badges: ['Worship Heart'],
    tasksCompletedCount: 0,
    attendanceCount: 0,
  },
  {
    id: 'user_ethan_fac',
    name: 'Ethan Wright',
    email: 'ethan.wright@buildserve.org',
    role: 'volunteer',
    skills: ['Facilities & Setup', 'Maintenance', 'Carpentry', 'Logistics'],
    points: 0,
    department: 'Operations & Facilities',
    streak: 1,
    joinedDate: '2023-09-05',
    badges: ['Hands-on Servant'],
    tasksCompletedCount: 0,
    attendanceCount: 0,
  },
  {
    id: 'user_maria_outreach',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@outreachcenter.org',
    role: 'volunteer',
    skills: ['Admin & Outreach', 'Bilingual (ES/EN)', 'Graphic Design', 'Social Media'],
    points: 0,
    department: 'Community Outreach',
    streak: 1,
    joinedDate: '2023-11-01',
    badges: ['Outreach Champion'],
    tasksCompletedCount: 0,
    attendanceCount: 0,
  },
];

// Initial Tasks
const INITIAL_TASKS: Task[] = [
  {
    id: 'task_1',
    title: 'Sunday Main Service Live Audio & Broadcast',
    description: 'Manage the 32-channel digital sound board, calibrate wireless microphones for pastors and worship team, and monitor the OBS live broadcast stream.',
    category: 'AV & Tech',
    requiredSkill: 'AV / Tech',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'open',
    assignedTo: null,
    pointsValue: 25,
    priority: 'urgent',
    tags: ['Sound Mixing', 'Live Stream', 'Sanctuary'],
    subtasks: [
      { id: 'st_1', title: 'Power up audio rack and wireless mic transmitters', completed: false },
      { id: 'st_2', title: 'Perform soundcheck with praise band (8:30 AM)', completed: false },
      { id: 'st_3', title: 'Verify YouTube & Facebook stream bitrates', completed: false },
      { id: 'st_4', title: 'Record master audio for podcast archive', completed: false },
    ],
    estimatedTime: 3.5,
    location: 'Main Sanctuary - Tech Booth',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_2',
    title: 'First-Time Visitors Welcome & Info Kiosk',
    description: 'Warmly greet attendees entering through the main foyer, assist first-time families with church information packets, and guide them to kids check-in.',
    category: 'Hospitality',
    requiredSkill: 'Hospitality',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'assigned',
    assignedTo: 'user_sarah_hosp',
    assignedToName: 'Sarah Jenkins',
    pointsValue: 15,
    priority: 'high',
    tags: ['Welcome Team', 'Visitor Care', 'Lobby'],
    subtasks: [
      { id: 'st_2_1', title: 'Set out welcome gift bags and contact cards', completed: true },
      { id: 'st_2_2', title: 'Station at North Foyer entrance doors', completed: true },
      { id: 'st_2_3', title: 'Hand off newcomer forms to pastoral admin', completed: false },
    ],
    estimatedTime: 2,
    location: 'Central Foyer & Welcome Center',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_3',
    title: 'Elementary Sunday School Lesson & Craft Lead',
    description: 'Teach the weekly illustrated Bible story lesson to 3rd-5th graders and coordinate the hands-on craft activity and memory verse challenge.',
    category: 'Youth & Childcare',
    requiredSkill: 'Youth & Childcare',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'open',
    assignedTo: null,
    pointsValue: 20,
    priority: 'high',
    tags: ['Kids Ministry', 'Teaching', 'Classroom 204'],
    subtasks: [
      { id: 'st_3_1', title: 'Review curriculum packet and slide deck', completed: false },
      { id: 'st_3_2', title: 'Pre-cut colored paper and craft supplies', completed: false },
      { id: 'st_3_3', title: 'Lead group discussion and snack time', completed: false },
    ],
    estimatedTime: 2.5,
    location: 'Education Wing - Room 204',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_4',
    title: 'Sanctuary Seating & Hymnal Organization',
    description: 'Ensure rows are neat, refill tithe & offering envelopes, replenish guest pens, and inspect pew bibles before Sunday services.',
    category: 'Facilities & Setup',
    requiredSkill: 'Facilities & Setup',
    deadline: new Date(Date.now() + 86400000 * 1).toISOString(),
    status: 'open',
    assignedTo: null,
    pointsValue: 15,
    priority: 'medium',
    tags: ['Setup', 'Sanctuary', 'Facilities'],
    subtasks: [
      { id: 'st_4_1', title: 'Straighten 24 rows of seating', completed: false },
      { id: 'st_4_2', title: 'Restock guest cards in seat backs', completed: false },
      { id: 'st_4_3', title: 'Clear any lost items to info desk', completed: false },
    ],
    estimatedTime: 1.5,
    location: 'Main Sanctuary',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_5',
    title: 'Worship Team Vocal Rehearsal & Lead Harmonies',
    description: 'Participate in the Thursday night rhythm rehearsal and lead alto/tenor vocal harmony lines for 4 Sunday worship anthems.',
    category: 'Music & Worship',
    requiredSkill: 'Music & Worship',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'assigned',
    assignedTo: 'user_grace_music',
    assignedToName: 'Grace Taylor',
    pointsValue: 30,
    priority: 'high',
    tags: ['Worship Band', 'Vocals', 'Stage'],
    subtasks: [
      { id: 'st_5_1', title: 'Review chord charts in Planning Center', completed: true },
      { id: 'st_5_2', title: 'Thursday evening run-through with band', completed: true },
      { id: 'st_5_3', title: 'Sunday pre-service sound check & prayer', completed: false },
    ],
    estimatedTime: 4,
    location: 'Worship Stage',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_6',
    title: 'Community Food Pantry Grocery Packing',
    description: 'Sort donated non-perishable groceries, assemble 60 family care boxes, and stage pallets for the Saturday morning drive-through distribution.',
    category: 'Admin & Outreach',
    requiredSkill: 'Admin & Outreach',
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'open',
    assignedTo: null,
    pointsValue: 35,
    priority: 'urgent',
    tags: ['Food Drive', 'Outreach', 'Community Care'],
    subtasks: [
      { id: 'st_6_1', title: 'Check expiration dates on canned goods', completed: false },
      { id: 'st_6_2', title: 'Pack 60 dry pantry boxes according to checklist', completed: false },
      { id: 'st_6_3', title: 'Label and organize boxes by dietary tags', completed: false },
    ],
    estimatedTime: 3,
    location: 'Fellowship Hall - Annex',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task_7',
    title: 'Fellowship Sunday Coffee & Pastry Bar',
    description: 'Brew 3 commercial urns of artisan coffee, set out hot water, tea selection, creamers, and arrange fresh morning pastries.',
    category: 'Hospitality',
    requiredSkill: 'Hospitality',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'completed',
    assignedTo: 'user_alex_tech',
    assignedToName: 'Alex Rivera',
    pointsValue: 15,
    priority: 'medium',
    tags: ['Coffee Team', 'Refreshments'],
    subtasks: [
      { id: 'st_7_1', title: 'Brew morning coffee batches', completed: true },
      { id: 'st_7_2', title: 'Replenish cups, stirrers, and sweeteners', completed: true },
      { id: 'st_7_3', title: 'Clean urns and sanitize counters post-fellowship', completed: true },
    ],
    estimatedTime: 2,
    location: 'Cafe Commons',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

// Initial Attendance Records
const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_1',
    userId: 'user_david_admin',
    userName: 'Pastor David Anderson',
    userEmail: 'david.anderson@gracechurch.org',
    eventId: 'service_current_sunday',
    eventTitle: 'Sunday Morning Worship (10:00 AM)',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    pointsAwarded: 15,
    method: 'qr_scan',
    status: 'present',
  },
  {
    id: 'att_2',
    userId: 'user_alex_tech',
    userName: 'Alex Rivera',
    userEmail: 'alex.rivera@gmail.com',
    eventId: 'service_current_sunday',
    eventTitle: 'Sunday Morning Worship (10:00 AM)',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    pointsAwarded: 15,
    method: 'pin_code',
    status: 'present',
  },
  {
    id: 'att_3',
    userId: 'user_grace_music',
    userName: 'Grace Taylor',
    userEmail: 'grace.taylor@musicchurch.org',
    eventId: 'service_current_sunday',
    eventTitle: 'Sunday Morning Worship (10:00 AM)',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    pointsAwarded: 15,
    method: 'qr_scan',
    status: 'present',
  },
  {
    id: 'att_4',
    userId: 'user_sarah_hosp',
    userName: 'Sarah Jenkins',
    userEmail: 'sarah.jenkins@outlook.com',
    eventId: 'service_current_sunday',
    eventTitle: 'Sunday Morning Worship (10:00 AM)',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    pointsAwarded: 15,
    method: 'qr_scan',
    status: 'present',
  },
  {
    id: 'att_5',
    userId: 'user_marcus_youth',
    userName: 'Marcus Chen',
    userEmail: 'marcus.chen@gmail.com',
    eventId: 'service_current_sunday',
    eventTitle: 'Sunday Morning Worship (10:00 AM)',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    pointsAwarded: 15,
    method: 'manual_override',
    status: 'present',
  }
];

// Initial Active Session
const INITIAL_SESSION: ActiveSession = {
  eventId: 'sunday-service-current',
  eventTitle: 'Sunday Morning Worship Celebration',
  currentToken: 'token-' + Math.random().toString(36).substring(2, 9),
  currentPin: '742918',
  location: 'Sanctuary & Campus Wide',
  serviceType: 'Main Sunday Service',
  startTime: '10:00 AM',
  updatedAt: new Date().toISOString(),
  activeAttendeesCount: 5,
};

const INITIAL_ANNOUNCEMENT: CommunityAnnouncement = {
  id: 'ann_1',
  message: '🔔 Welcome to our community platform! All volunteers: Audio tech & Hospitality shifts are now open for this Sunday.',
  priority: 'urgent',
  author: 'Pastor David Anderson',
  updatedAt: new Date().toISOString(),
  active: true,
};

// Event Subscriptions Listener System
type Listener<T> = (data: T) => void;
const listeners: Record<string, Set<Listener<any>>> = {};
let liveSyncActive = false;
let liveSyncUnsubscribers: Array<() => void> = [];

function cacheAndNotify(key: string, storageKey: string, data: unknown) {
  localStorage.setItem(storageKey, JSON.stringify(data));
  notify(key, data);
}

function writeLive(path: string, data: Record<string, unknown>) {
  if (!liveSyncActive) return;
  void setDoc(doc(db, path), data, { merge: true }).catch((error) => {
    console.error(`[Live data] Failed to write ${path}:`, error);
  });
}

function updateLive(path: string, data: Record<string, unknown>) {
  if (!liveSyncActive) return;
  void updateDoc(doc(db, path), data).catch((error) => {
    console.error(`[Live data] Failed to update ${path}:`, error);
  });
}

function notify(key: string, data: any) {
  if (listeners[key]) {
    listeners[key].forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(`Error in listener for ${key}:`, e);
      }
    });
  }
}

export const DataService = {
  // FIRESTORE LIVE SYNC
  startLiveSync(currentUserId: string, isAdmin = false) {
    this.stopLiveSync();
    liveSyncActive = true;

    // Never show the bundled demo seed after a real Firebase session starts.
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    cacheAndNotify('users', STORAGE_KEYS.USERS, []);
    cacheAndNotify('tasks', STORAGE_KEYS.TASKS, []);
    cacheAndNotify('attendance', STORAGE_KEYS.ATTENDANCE, []);
    notify('leaderboard', []);

    const subscribeCollection = <T extends { id: string }>(
      key: string,
      source: ReturnType<typeof collection> | ReturnType<typeof query>,
      storageKey: string,
      mapper: (value: Record<string, any>, id: string) => T,
    ) => {
      const unsubscribe = onSnapshot(
        source,
        (snapshot) => {
          const values = snapshot.docs.map((item) => mapper(item.data() as Record<string, any>, item.id));
          cacheAndNotify(key, storageKey, values);
          if (key === 'users') notify('leaderboard', this.getLeaderboard());
        },
        (error) => console.error('[Live data] collection subscription failed:', error),
      );
      liveSyncUnsubscribers.push(unsubscribe);
    };

    subscribeCollection<UserProfile>('users', collection(db, 'users'), STORAGE_KEYS.USERS, (value, id) => ({
      id,
      name: value.name || 'Volunteer',
      email: value.email || '',
      role: value.role === 'admin' ? 'admin' : 'volunteer',
      skills: Array.isArray(value.skills) ? value.skills : [],
      points: Number(value.points || 0),
      avatar: value.avatar,
      department: value.department,
      phone: value.phone,
      streak: Number(value.streak || 0),
      badges: Array.isArray(value.badges) ? value.badges : [],
      joinedDate: value.joinedDate,
      tasksCompletedCount: Number(value.tasksCompletedCount || 0),
      attendanceCount: Number(value.attendanceCount || 0),
    }));
    subscribeCollection<Task>('tasks', collection(db, 'tasks'), STORAGE_KEYS.TASKS, (value, id) => ({
      ...value,
      id,
      status: value.status || 'open',
      assignedTo: value.assignedTo || null,
      subtasks: Array.isArray(value.subtasks) ? value.subtasks : [],
      tags: Array.isArray(value.tags) ? value.tags : [],
    } as Task));
    const attendanceSource = isAdmin
      ? collection(db, 'attendance')
      : query(collection(db, 'attendance'), where('userId', '==', currentUserId));
    subscribeCollection<AttendanceRecord>('attendance', attendanceSource, STORAGE_KEYS.ATTENDANCE, (value, id) => ({
      ...value,
      id,
    } as AttendanceRecord));

    const orgUnsubscribe = onSnapshot(doc(db, 'settings', 'organization'), (snapshot) => {
      if (snapshot.exists()) cacheAndNotify('organization', STORAGE_KEYS.ORGANIZATION, snapshot.data());
    }, (error) => console.error('[Live data] organization subscription failed:', error));
    const announcementUnsubscribe = onSnapshot(doc(db, 'settings', 'announcement'), (snapshot) => {
      if (snapshot.exists()) cacheAndNotify('announcement', STORAGE_KEYS.ANNOUNCEMENT, snapshot.data());
    }, (error) => console.error('[Live data] announcement subscription failed:', error));
    const sessionUnsubscribe = onSnapshot(doc(db, 'settings', 'session'), (snapshot) => {
      if (snapshot.exists()) cacheAndNotify('session', STORAGE_KEYS.SESSION, snapshot.data());
    }, (error) => console.error('[Live data] session subscription failed:', error));
    liveSyncUnsubscribers.push(orgUnsubscribe, announcementUnsubscribe, sessionUnsubscribe);
  },

  stopLiveSync() {
    liveSyncUnsubscribers.forEach((unsubscribe) => unsubscribe());
    liveSyncUnsubscribers = [];
    liveSyncActive = false;
  },

  // Subscribers
  subscribe<T>(key: string, callback: Listener<T>): () => void {
    if (!listeners[key]) {
      listeners[key] = new Set();
    }
    listeners[key].add(callback);
    return () => {
      listeners[key]?.delete(callback);
    };
  },

  // ORGANIZATION SETTINGS
  getOrganizationSettings(): ChurchOrganizationSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(INITIAL_ORGANIZATION));
      return INITIAL_ORGANIZATION;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ORGANIZATION;
    }
  },

  updateOrganizationSettings(updates: Partial<ChurchOrganizationSettings>): ChurchOrganizationSettings {
    const current = this.getOrganizationSettings();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(updated));
    notify('organization', updated);
    writeLive('settings/organization', updated as unknown as Record<string, unknown>);
    return updated;
  },

  // USERS
  getUsers(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: UserProfile[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notify('users', users);
    notify('leaderboard', this.getLeaderboard());
  },

  getUserById(id: string): UserProfile | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  getCurrentUser(): UserProfile {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user_alex_tech';
    const user = this.getUserById(currentId);
    if (user) return user;
    return this.getUsers()[1] || INITIAL_USERS[1];
  },

  setCurrentUser(id: string): UserProfile | null {
    const user = this.getUserById(id);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
      notify('currentUser', user);
    }
    return user;
  },

  // Strict Single-Admin Enforcement: Only ONE admin allowed in the system
  updateUserRole(userId: string, role: Role): UserProfile | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    if (role === 'admin') {
      // Demote all other users to volunteers so exactly ONE admin exists
      users.forEach((u) => {
        if (u.id !== userId) {
          u.role = 'volunteer';
        }
      });
      users[index].role = 'admin';
    } else {
      // If demoting current admin, ensure Pastor David or first available remains admin
      users[index].role = 'volunteer';
      const hasAdmin = users.some((u) => u.role === 'admin');
      if (!hasAdmin && users.length > 0) {
        users[0].role = 'admin';
      }
    }

    this.saveUsers(users);
    return users[index];
  },

  awardPoints(userId: string, points: number, reason?: string): UserProfile | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;
    users[index].points = Math.max(0, (users[index].points || 0) + points);
    
    // Dynamically calculate and unlock badges
    const earnedBadges = new Set(users[index].badges || []);
    if (users[index].points >= 15) earnedBadges.add('First Step');
    if (users[index].points >= 50) earnedBadges.add('Faithful Servant');
    if (users[index].points >= 100) earnedBadges.add('Master Organizer');
    if (users[index].points >= 200) earnedBadges.add('Century Club');
    if (users[index].points >= 300) earnedBadges.add('Community Pillar');
    users[index].badges = Array.from(earnedBadges);

    this.saveUsers(users);
    return users[index];
  },

  // TASKS
  getTasks(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    notify('tasks', tasks);
  },

  createTask(
    taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'subtasks' | 'assignedTo'> & {
      assignedTo?: string | null;
      subtasks?: string[];
    }
  ): Task {
    const tasks = this.getTasks();
    const subtaskObjects = (taskData.subtasks || []).map((title, idx) => ({
      id: `st_${Date.now()}_${idx}`,
      title,
      completed: false,
    }));

    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      status: 'open',
      assignedTo: taskData.assignedTo || null,
      subtasks: subtaskObjects,
      createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);
    this.saveTasks(tasks);
    writeLive(`tasks/${newTask.id}`, newTask as unknown as Record<string, unknown>);
    return newTask;
  },

  registerUser(profileData: Omit<UserProfile, 'id'>): UserProfile {
    const users = this.getUsers();
    const newUser: UserProfile = {
      ...profileData,
      id: `user_${Date.now()}`,
      points: profileData.points || 0,
      streak: 1,
      joinedDate: new Date().toISOString(),
      tasksCompletedCount: 0,
      attendanceCount: 0,
      badges: ['New Member'],
    };
    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser.id);
    return newUser;
  },

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...updates };
    this.saveTasks(tasks);
    updateLive(`tasks/${id}`, updates as Record<string, unknown>);
    return tasks[index];
  },

  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length !== tasks.length) {
      this.saveTasks(filtered);
      if (liveSyncActive) void deleteDoc(doc(db, `tasks/${id}`)).catch((error) => console.error('[Live data] Failed to delete task:', error));
      return true;
    }
    return false;
  },

  volunteerForTask(taskId: string, user: UserProfile): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;
    tasks[index].status = 'assigned';
    tasks[index].assignedTo = user.id;
    tasks[index].assignedToName = user.name;
    this.saveTasks(tasks);
    updateLive(`tasks/${taskId}`, { status: 'assigned', assignedTo: user.id, assignedToName: user.name });
    return tasks[index];
  },

  unassignTask(taskId: string): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;
    tasks[index].status = 'open';
    tasks[index].assignedTo = null;
    tasks[index].assignedToName = null;
    this.saveTasks(tasks);
    updateLive(`tasks/${taskId}`, { status: 'open', assignedTo: null, assignedToName: null });
    return tasks[index];
  },

  toggleSubtask(taskId: string, subtaskId: string): Task | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;
    const task = tasks[taskIndex];
    task.subtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    this.saveTasks(tasks);
    updateLive(`tasks/${taskId}`, { subtasks: task.subtasks });
    return task;
  },

  completeTask(taskId: string, completedByUserId?: string): { task: Task; pointsAwarded: number; volunteer: UserProfile | null } | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;
    const task = tasks[index];
    task.status = 'completed';
    task.subtasks = task.subtasks.map((st) => ({ ...st, completed: true }));
    
    // Assign volunteer if completedByUserId passed
    if (!task.assignedTo && completedByUserId) {
      task.assignedTo = completedByUserId;
      const u = this.getUserById(completedByUserId);
      if (u) task.assignedToName = u.name;
    }
    this.saveTasks(tasks);
    updateLive(`tasks/${taskId}`, task as unknown as Record<string, unknown>);

    let updatedVolunteer: UserProfile | null = null;
    const targetUserId = task.assignedTo || completedByUserId;
    if (targetUserId && !liveSyncActive) {
      const users = this.getUsers();
      const uIndex = users.findIndex((u) => u.id === targetUserId);
      if (uIndex !== -1) {
        users[uIndex].points = (users[uIndex].points || 0) + task.pointsValue;
        users[uIndex].tasksCompletedCount = (users[uIndex].tasksCompletedCount || 0) + 1;
        
        // Dynamically calculate and unlock badges
        const earnedBadges = new Set(users[uIndex].badges || []);
        earnedBadges.add('First Step');
        if (users[uIndex].tasksCompletedCount >= 3) earnedBadges.add('Faithful Servant');
        if (users[uIndex].points >= 50) earnedBadges.add('Master Organizer');
        if (users[uIndex].points >= 100) earnedBadges.add('Century Club');
        if (users[uIndex].points >= 250) earnedBadges.add('Community Pillar');
        users[uIndex].badges = Array.from(earnedBadges);

        this.saveUsers(users);
        updatedVolunteer = users[uIndex];
        notify('currentUser', users[uIndex]);
      }
    }

    return {
      task,
      pointsAwarded: task.pointsValue,
      volunteer: updatedVolunteer,
    };
  },

  // ATTENDANCE
  getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
      return INITIAL_ATTENDANCE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ATTENDANCE;
    }
  },

  saveAttendance(records: AttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    notify('attendance', records);
  },

  getActiveSession(): ActiveSession {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(INITIAL_SESSION));
      return INITIAL_SESSION;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SESSION;
    }
  },

  rotateActiveSessionToken(): ActiveSession {
    const current = this.getActiveSession();
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    const newToken = 'token-' + Math.random().toString(36).substring(2, 12);
    const updated: ActiveSession = {
      ...current,
      currentToken: newToken,
      currentPin: newPin,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updated));
    notify('session', updated);
    writeLive('settings/session', updated as unknown as Record<string, unknown>);
    return updated;
  },

  checkInVolunteer(
    user: UserProfile,
    method: 'qr_scan' | 'pin_code' | 'manual_override' = 'qr_scan'
  ): { record: AttendanceRecord; alreadyCheckedIn: boolean; pointsAwarded: number } {
    const attendance = this.getAttendance();
    const session = this.getActiveSession();

    // Check if checked in today for this event
    const todayStr = new Date().toDateString();
    const existing = attendance.find(
      (a) => a.userId === user.id && new Date(a.timestamp).toDateString() === todayStr
    );

    if (existing) {
      return { record: existing, alreadyCheckedIn: true, pointsAwarded: 0 };
    }

    const points = 0; // Points are earned only after verified task completion
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      eventId: session.eventId,
      eventTitle: session.eventTitle,
      timestamp: new Date().toISOString(),
      pointsAwarded: points,
      method,
      status: 'present',
    };

    attendance.unshift(newRecord);
    this.saveAttendance(attendance);

    // Attendance is recorded live, but does not award service points.
    if (liveSyncActive) {
      void setDoc(doc(db, `attendance/${newRecord.id}`), newRecord as unknown as Record<string, unknown>)
        .catch((error) => console.error('[Live data] Failed to record attendance:', error));
    }

    // Update session attendee count
    session.activeAttendeesCount = (session.activeAttendeesCount || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    notify('session', session);

    return { record: newRecord, alreadyCheckedIn: false, pointsAwarded: points };
  },

  // LEADERBOARD
  getLeaderboard(): LeaderboardEntry[] {
    const users = this.getUsers();
    const sorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
    return sorted.map((u, i) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      points: u.points,
      rank: i + 1,
      role: u.role,
      skills: u.skills,
      streak: u.streak || 0,
      tasksCompleted: u.tasksCompletedCount || 0,
      attendanceCount: u.attendanceCount || 0,
      badges: u.badges || [],
    }));
  },

  // ANNOUNCEMENTS
  getAnnouncement(): CommunityAnnouncement {
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT, JSON.stringify(INITIAL_ANNOUNCEMENT));
      return INITIAL_ANNOUNCEMENT;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ANNOUNCEMENT;
    }
  },

  saveAnnouncement(message: string, priority: 'normal' | 'urgent' | 'announcement' = 'urgent', author: string = 'Church Leadership'): CommunityAnnouncement {
    const announcement: CommunityAnnouncement = {
      id: `ann_${Date.now()}`,
      message,
      priority,
      author,
      updatedAt: new Date().toISOString(),
      active: !!message.trim(),
    };
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT, JSON.stringify(announcement));
    notify('announcement', announcement);
    writeLive('settings/announcement', announcement as unknown as Record<string, unknown>);
    return announcement;
  },

  // AI SMART MATCHMAKING
  getAiMatches(): AiTaskMatch[] {
    const tasks = this.getTasks().filter((t) => t.status === 'open');
    const users = this.getUsers().filter((u) => u.role === 'volunteer');
    const matches: AiTaskMatch[] = [];

    tasks.forEach((task) => {
      users.forEach((user) => {
        const matchingSkills = user.skills.filter(
          (s) =>
            s.toLowerCase().includes(task.requiredSkill.toLowerCase()) ||
            task.requiredSkill.toLowerCase().includes(s.toLowerCase()) ||
            task.tags.some((t) => t.toLowerCase().includes(s.toLowerCase()))
        );

        let score = 30; // base potential
        if (matchingSkills.length > 0) {
          score += matchingSkills.length * 35;
        }
        if (user.streak && user.streak > 5) score += 10;
        if (task.priority === 'urgent' && user.points > 200) score += 10;
        score = Math.min(98, score);

        if (score >= 65) {
          matches.push({
            taskId: task.id,
            taskTitle: task.title,
            volunteerId: user.id,
            volunteerName: user.name,
            matchScore: score,
            matchingSkills,
            reason:
              matchingSkills.length > 0
                ? `Strong skill overlap in ${matchingSkills.join(', ')} with high reliability streak (${user.streak} weeks).`
                : 'Available high-capacity volunteer with flexible department engagement.',
          });
        }
      });
    });

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  },

  // Production analytics use live Firestore records.

  // ==========================================
  // PYTHON AI & DATA SCIENCE BACKEND CALLS
  // ==========================================

  async fetchPythonRagSearch(query: string, top_k: number = 3): Promise<PythonRagDocument[]> {
    const res = await fetch('/api/python/rag-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k }),
    });
    if (!res.ok) throw new Error(`Python RAG request failed (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data.results)) throw new Error('Python RAG returned an invalid response');
    return data.results;
  },

  async fetchPythonChurnAnalysis(): Promise<PythonChurnPrediction[]> {
    const volunteers = this.getUsers().filter((u) => u.role === 'volunteer');
    const res = await fetch('/api/python/churn-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteers }),
    });
    if (!res.ok) throw new Error(`Python churn request failed (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data.predictions)) throw new Error('Python churn returned an invalid response');
    return data.predictions;
  },

  async fetchPythonClustering(): Promise<{ clusters: PythonClusterResult[]; silhouetteScore: number }> {
    const volunteers = this.getUsers().filter((u) => u.role === 'volunteer');
    const res = await fetch('/api/python/clustering', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteers }),
    });
    if (!res.ok) throw new Error(`Python clustering request failed (${res.status})`);
    const data = await res.json();
    if (!data.clustering?.clusters) throw new Error('Python clustering returned an invalid response');
    return data.clustering;
  },

  async fetchPythonAttendanceForecast(): Promise<PythonForecastResult | null> {
    const attendance = this.getAttendance();
    const res = await fetch('/api/python/attendance-forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance }),
    });
    if (!res.ok) throw new Error(`Python forecast request failed (${res.status})`);
    const data = await res.json();
    if (!data.forecast) throw new Error('Python forecast returned an invalid response');
    return data.forecast;
  },

  async fetchPythonTaskOptimization(): Promise<{ optimizedAssignments: PythonOptimizedAssignment[]; totalTasksOptimized: number; averageCompatibility: number }> {
    const openTasks = this.getTasks().filter((t) => t.status === 'open');
    const volunteers = this.getUsers().filter((u) => u.role === 'volunteer');
    const res = await fetch('/api/python/optimize-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: openTasks, volunteers }),
    });
    if (!res.ok) throw new Error(`Python task optimization request failed (${res.status})`);
    const data = await res.json();
    if (!data.optimization?.optimizedAssignments) throw new Error('Python optimizer returned an invalid response');
    return data.optimization;
  },

  async runPythonDataScript(code: string): Promise<{ success: boolean; output?: string; error?: string }> {
    const res = await fetch('/api/python/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, volunteers: this.getUsers(), tasks: this.getTasks(), attendance: this.getAttendance() }),
    });
    if (!res.ok) throw new Error(`Python workbench request failed (${res.status})`);
    return res.json();
  },

  async askGeminiRagAssistant(question: string, userContext: any): Promise<{ answer: string; retrievedDocuments: PythonRagDocument[]; modelUsed: string }> {
    const res = await fetch('/api/ai/ask-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userContext }),
    });
    if (!res.ok) throw new Error(`AI RAG request failed (${res.status})`);
    const data = await res.json();
    if (!data.answer) throw new Error('AI RAG returned an invalid response');
    return data;
  },

};
