import { DifficultyLevel, Question } from '../data/questions';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: number;
  avatarColor?: string;
  bio?: string;
  jobTitle?: string;
  lastLoginAt?: number;
  // New profile fields
  username?: string;
  phoneNumber?: string;
  location?: string;
  skills?: string[];
  experienceLevel?: 'fresher' | '1-3 years' | '3-5 years' | '5-10 years' | '10+ years';
  education?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  profilePicture?: string; // base64 or URL
  avatar_url?: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  domainId: string;
  domainName: string;
  difficulty: DifficultyLevel;
  questions?: Question[];
  selectedQuestionIds?: string[];
  requestedQuestionCount?: number;
  startTime: number;
  endTime?: number;
  currentQuestionIndex: number;
  answers: InterviewAnswer[];
  score?: number;
  status: 'in-progress' | 'completed';
}

export interface InterviewAnswer {
  questionId: string;
  questionText: string;
  answer: string;
  timeSpent: number; // seconds
  score: number;
  confidenceScore?: number;
  relevanceScore?: number;
  feedback: string;
  matchedKeywords?: string[];
  strengths?: string[];
  improvements?: string[];
  timestamp: number;
  isIntro?: boolean; // true for "Tell me about yourself" and "What are your strengths?" questions
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userRole: 'admin' | 'user';
  avatarColor?: string;
  totalInterviews: number;
  averageScore: number;
  highestScore: number;
  lastInterviewDate: number;
}

export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalInterviews: number;
  averageScore: number;
  topDomains: { domain: string; count: number }[];
  difficultyCounts: Record<string, number>;
  dailyActivity: Record<string, number>;
}

export interface AdminUser extends User {
  totalInterviews: number;
  averageScore: number;
}

// Resume Analysis Types
export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  file?: File;
  fileUrl?: string;
  domainId: string;
  domainName: string;
  content: string;
  uploadedAt: number;
  analysisResult?: ResumeAnalysis;
}

export interface ResumeAnalysis {
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: ResumeSuggestion[];
  skillsFound: string[];
  skillsNeeded: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'expert';
  analyzedAt: number;
}

export interface ResumeSuggestion {
  category: 'skills' | 'experience' | 'format' | 'content' | 'keywords';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  icon?: string;
}
