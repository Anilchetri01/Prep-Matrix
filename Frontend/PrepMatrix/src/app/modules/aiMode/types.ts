import type { DifficultyLevel } from '../../data/questions';

export type AIInterviewSessionStatus = 'ready' | 'in-progress' | 'completed';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface AIInterviewQuestion {
  id: string;
  text: string;
  focusArea: string;
  expectedTraits: string[];
}

export interface AIResumeInsights {
  skills: string[];
  domain: string;
  summary: string;
  strengths: string[];
  questions: AIInterviewQuestion[];
  generationSource?: 'gemini' | 'cache' | 'fallback';
}

export interface AIAnswerEvaluation {
  score: number;
  feedback: string;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  clarity: number;
  strengths: string[];
  improvements: string[];
  evaluationSource?: 'gemini' | 'fallback';
}

export interface AIInterviewAnswer extends AIAnswerEvaluation {
  questionId: string;
  questionText: string;
  answer: string;
  timeSpent: number;
  timestamp: number;
}

export interface AIInterviewSession {
  id: string;
  userId: string;
  resumeFileName: string;
  resumeFileUrl: string;
  resumeText: string;
  analysis: AIResumeInsights;
  difficulty: DifficultyLevel;
  questionCount: number;
  questions: AIInterviewQuestion[];
  answers: AIInterviewAnswer[];
  currentQuestionIndex: number;
  status: AIInterviewSessionStatus;
  overallScore?: number;
  confidenceScore?: number;
  startedAt?: number;
  endedAt?: number;
  createdAt: number;
}
