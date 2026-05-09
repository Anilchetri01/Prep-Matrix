export interface Question {
  id: string;
  text: string;
  keywords: string[];
  weightedKeywords?: Array<{
    term: string;
    weight: number;
    synonyms?: string[];
  }>;
  concepts?: string[];
  expectedAnswer: string;
  expectedLength: number;
}

export interface Domain {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  questions: {
    beginner: Question[];
    intermediate: Question[];
    advanced: Question[];
  };
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
export {
  ALLOWED_QUESTION_COUNTS,
  MANUAL_DIFFICULTY_LEVELS,
  MAX_QUESTIONS_PER_LEVEL,
  normalizeQuestionCount,
} from './manualInterview.config';
export { DOMAIN_CATEGORIES } from './domains.config';
export type { ManualDifficultyLevel, ManualQuestionCount } from './manualInterview.config';

// Import domain configurations and question banks
import { DOMAIN_CATEGORIES, DOMAIN_CONFIGS } from './domains.config';
import { MAX_QUESTIONS_PER_LEVEL, normalizeQuestionCount } from './manualInterview.config';
import { validateManualQuestionBank } from './manualInterview.validation';
import { getQuestionsForDomain } from './questionBank';

// Build DOMAINS array from configuration and question banks
export const DOMAINS: Domain[] = DOMAIN_CONFIGS.map(config => ({
  id: config.id,
  name: config.name,
  icon: config.icon,
  category: config.category,
  description: config.description,
  questions: {
    beginner: getQuestionsForDomain(config.id, 'beginner'),
    intermediate: getQuestionsForDomain(config.id, 'intermediate'),
    advanced: getQuestionsForDomain(config.id, 'advanced'),
  },
}));

export const MANUAL_QUESTION_BANK_VALIDATION = validateManualQuestionBank(DOMAINS);

if (import.meta.env.DEV && !MANUAL_QUESTION_BANK_VALIDATION.valid) {
  console.warn(
    '[ManualInterview] Question bank validation failed',
    MANUAL_QUESTION_BANK_VALIDATION.issues,
  );
}

function getQuestionUniqueKey(question: Question) {
  return `${question.id}:${question.text.trim().toLowerCase()}`;
}

function uniqueQuestions(questions: Question[]) {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const key = getQuestionUniqueKey(question);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = uniqueQuestions(questions);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// Helper function to get a random sample of unique questions for one manual session.
export function getRandomQuestions(
  domainId: string,
  difficulty: DifficultyLevel,
  count: number
): Question[] {
  const domain = DOMAINS.find(d => d.id === domainId);
  if (!domain) return [];
  
  const questions = domain.questions[difficulty];
  if (!questions || questions.length === 0) return [];

  const safeCount = Math.min(normalizeQuestionCount(count), MAX_QUESTIONS_PER_LEVEL);
  return shuffleQuestions(questions).slice(0, Math.min(safeCount, questions.length));
}

export function createManualInterviewQuestions(
  domainId: string,
  difficulty: DifficultyLevel,
  requestedCount: number,
): Question[] {
  return getRandomQuestions(domainId, difficulty, requestedCount);
}

// Helper to get domain by ID
export function getDomainById(id: string): Domain | undefined {
  return DOMAINS.find(d => d.id === id);
}
