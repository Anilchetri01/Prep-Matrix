export const ALLOWED_QUESTION_COUNTS = [5, 10, 15, 20] as const;
export type ManualQuestionCount = (typeof ALLOWED_QUESTION_COUNTS)[number];

export const MANUAL_DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type ManualDifficultyLevel = (typeof MANUAL_DIFFICULTY_LEVELS)[number];

export const MAX_QUESTIONS_PER_LEVEL = 20;

export function normalizeQuestionCount(count: number): ManualQuestionCount {
  const fallback = 10;
  return ALLOWED_QUESTION_COUNTS.includes(count as ManualQuestionCount)
    ? (count as ManualQuestionCount)
    : fallback;
}
