
export interface User {
  id: string;
  name: string;
  email: string;
  periodLength: number;
  cycleLength: number;
  lastPeriodDate: string;
  createdAt: string;
}

export interface Symptom {
  id: string;
  userId: string;
  date: string;
  type: string;
  severity: number;
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  readTime: string;
  imageUrl: string;
}
