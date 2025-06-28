
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
  length: number;
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

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  readTime: string;
  imageUrl?: string;
  isPublished?: boolean;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
}
