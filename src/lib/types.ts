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

export interface ChurchOrganizationSettings {
  churchName: string;
  campusName: string;
  address: string;
  phone: string;
  contactEmail: string;
  leadPastorName: string;
  serviceTimes: string;
  motto: string;
  updatedAt: string;
}

export interface PythonRagDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
  matched_terms?: string[];
}

export interface PythonChurnPrediction {
  volunteerId: string;
  name: string;
  email: string;
  department: string;
  points: number;
  streak: number;
  tasksCompleted: number;
  churnProbability: number;
  riskTier: 'High Risk' | 'Moderate Risk' | 'Healthy & Engaged';
  riskFactors: string[];
  retentionAction: string;
}

export interface PythonClusterResult {
  clusterName: string;
  color: string;
  count: number;
  members: Array<{
    id: string;
    name: string;
    department: string;
    points: number;
    x: number;
    y: number;
    z: number;
  }>;
}

export interface PythonForecastResult {
  historicalAverage: number;
  momentum: string;
  forecast: Array<{
    week: string;
    date: string;
    projectedVolunteers: number;
    lowerBound: number;
    upperBound: number;
    seasonalTrend: string;
  }>;
}

export interface PythonOptimizedAssignment {
  taskId: string;
  taskTitle: string;
  category: string;
  pointsValue: number;
  matchedVolunteerId: string;
  matchedVolunteerName: string;
  compatibilityScore: number;
  reason: string;
}

