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
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  eventId: string;
  timestamp: Timestamp;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank: number;
}
