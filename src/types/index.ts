
export interface Profile {
  id: string;
  name: string;
  email: string;
  cycle_length?: number;
  period_length?: number;
  last_period_date?: string;
  profile_photo?: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  periodLength: number;
  cycleLength: number;
  lastPeriodDate: string;
  createdAt: string;
}

export interface Cycle {
  id: string;
  userId: string;
  startDate: string;
  endDate?: string;
  length: number; // cycle length in days
  periodLength: number; // period length in days
  createdAt: string;
}

export interface Symptom {
  id: string;
  userId: string;
  date: string;
  mood: string;
  symptoms: string[];
  spotting: 'none' | 'light' | 'heavy';
  menstrualFlow: 'light' | 'medium' | 'heavy' | 'none';
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  readTime: string;
  image: string;
  isPublished?: boolean;
  createdAt?: string;
  fullContent?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
}
