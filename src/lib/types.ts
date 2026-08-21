export type Role = 'admin' | 'volunteer';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'attendance' | 'service' | 'leadership' | 'special';
  unlockedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  skills: string[];
  points: number;
  avatar?: string;
  department?: string;
  phone?: string;
  streak?: number;
  badges?: string[];
  joinedDate?: string;
  tasksCompletedCount?: number;
  attendanceCount?: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'AV & Tech' | 'Music & Worship' | 'Hospitality' | 'Youth & Childcare' | 'Facilities & Setup' | 'Admin & Outreach' | 'General';
  requiredSkill: string;
  deadline: any; // Timestamp or ISO string
  status: 'open' | 'assigned' | 'completed';
  assignedTo: string | null;
  assignedToName?: string | null;
  pointsValue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  subtasks: SubTask[];
  estimatedTime?: number; // in hours
  actualTime?: number;
  location?: string;
  createdAt?: any;
  dependsOn?: string[];
  recurrence?: string | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  eventId: string;
  eventTitle: string;
  timestamp: any;
  pointsAwarded: number;
  method: 'qr_scan' | 'pin_code' | 'manual_override';
  status: 'present' | 'late' | 'excused';
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  points: number;
  rank: number;
  avatar?: string;
  role?: Role;
  skills?: string[];
  streak?: number;
  tasksCompleted?: number;
  attendanceCount?: number;
  badges?: string[];
}

export interface ActiveSession {
  eventId: string;
  eventTitle: string;
  currentToken: string;
  currentPin: string;
  location: string;
  serviceType: string;
  startTime: string;
  updatedAt: any;
  activeAttendeesCount: number;
}

export interface CommunityAnnouncement {
  id: string;
  message: string;
  priority: 'normal' | 'urgent' | 'announcement';
  author: string;
  updatedAt: any;
  active: boolean;
}

export interface AiTaskMatch {
  taskId: string;
  taskTitle: string;
  volunteerId: string;
  volunteerName: string;
  matchScore: number; // 0 to 100
  matchingSkills: string[];
  reason: string;
}

export interface BenchmarkMetrics {
  id: string;
  modelName: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latencyMs: number;
  timestamp: any;
}
