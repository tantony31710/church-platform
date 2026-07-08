import { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'volunteer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  skills: string[];
  points: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  requiredSkill: string;
  deadline: Timestamp;
  status: 'open' | 'assigned' | 'completed';
  assignedTo: string | null;
  pointsValue: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  subtasks?: {id: string, title: string, completed: boolean}[];
  attachments?: string[];
  estimatedTime?: number;
  actualTime?: number;
  dependsOn?: string[];
  recurrence?: string | null;
  customFields?: Record<string, any>;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  eventId: string;
  timestamp: Timestamp;
}

export interface LeaderboardEntry {
  id: string; // userId
  name: string;
  points: number;
  rank: number;
}

export interface DataLineage {
  id: string;
  source: string;
  timestamp: Timestamp;
  status: 'success' | 'failure';
  details?: string;
}
