import type { DifficultyLevel, Domain, Question } from './questions';
import { MANUAL_DIFFICULTY_LEVELS, MAX_QUESTIONS_PER_LEVEL } from './manualInterview.config';

interface DuplicateDetectionResult {
  duplicateQuestionIds: string[];
  duplicateQuestionTexts: string[];
  nearDuplicateQuestionTexts: string[];
}

export interface DomainValidationResult {
  domainId: string;
  domainName: string;
  valid: boolean;
  counts: Record<DifficultyLevel, number>;
  issues: string[];
  warnings: string[];
  duplicateQuestionIds: string[];
  duplicateQuestionTexts: string[];
  nearDuplicateQuestionTexts: string[];
}

export interface ManualQuestionBankValidationResult {
  valid: boolean;
  totalDomains: number;
  totalQuestions: number;
  domains: DomainValidationResult[];
  issues: string[];
  warnings: string[];
}

function normalizeQuestionText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForNearDuplicateCheck(text: string) {
  return normalizeQuestionText(text)
    .replace(/\b(what|why|how|would|you|explain|describe|design|advanced|approach|when|working|with|using|work|role|important|especially|focus|terms|beginner|friendly|scenario|main|trade offs|projects|production|environments)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return Array.from(duplicates);
}

function tokenSet(value: string) {
  return new Set(value.split(' ').filter((token) => token.length > 2));
}

function jaccardSimilarity(left: Set<string>, right: Set<string>) {
  const intersection = Array.from(left).filter((token) => right.has(token)).length;
  const union = new Set([...Array.from(left), ...Array.from(right)]).size;
  return union === 0 ? 0 : intersection / union;
}

function getQuestionConceptTokens(question: Question) {
  return tokenSet(
    [...(question.keywords || []), ...(question.concepts || [])]
      .map(normalizeQuestionText)
      .join(' '),
  );
}

function getPrimaryQuestionConcept(question: Question) {
  return normalizeQuestionText(question.keywords?.[0] || question.concepts?.[0] || question.text);
}

function findNearDuplicateQuestions(questions: Question[]) {
  const matches: string[] = [];

  for (let leftIndex = 0; leftIndex < questions.length; leftIndex += 1) {
    const leftQuestion = questions[leftIndex];
    const normalizedLeft = normalizeForNearDuplicateCheck(leftQuestion.text);
    const leftTokens = tokenSet(normalizedLeft);
    const leftConceptTokens = getQuestionConceptTokens(leftQuestion);
    const leftPrimaryConcept = getPrimaryQuestionConcept(leftQuestion);

    for (let rightIndex = leftIndex + 1; rightIndex < questions.length; rightIndex += 1) {
      const rightQuestion = questions[rightIndex];
      const normalizedRight = normalizeForNearDuplicateCheck(rightQuestion.text);
      const rightTokens = tokenSet(normalizedRight);
      const rightConceptTokens = getQuestionConceptTokens(rightQuestion);
      const rightPrimaryConcept = getPrimaryQuestionConcept(rightQuestion);
      const textSimilarity = jaccardSimilarity(leftTokens, rightTokens);
      const conceptSimilarity = jaccardSimilarity(leftConceptTokens, rightConceptTokens);

      if (
        normalizedLeft &&
        normalizedRight &&
        normalizedLeft !== normalizedRight &&
        leftPrimaryConcept === rightPrimaryConcept &&
        textSimilarity >= 0.92 &&
        conceptSimilarity >= 0.75
      ) {
        matches.push(`${leftQuestion.text} :: ${rightQuestion.text}`);
      }
    }
  }

  return matches;
}

function validateQuestion(question: Question | undefined, index: number, level: DifficultyLevel) {
  const issues: string[] = [];

  if (!question) {
    return [`${level} question ${index + 1} is missing.`];
  }

  if (!question.id?.trim()) issues.push(`${level} question ${index + 1} is missing an id.`);
  if (!question.text?.trim()) issues.push(`${level} question ${index + 1} is missing text.`);
  if (!Array.isArray(question.keywords) || question.keywords.length < 3) {
    issues.push(`${level} question ${question.id || index + 1} should have at least 3 keywords.`);
  }
  if (!Array.isArray(question.concepts) || question.concepts.length < 3) {
    issues.push(`${level} question ${question.id || index + 1} should have at least 3 expected concepts.`);
  }
  if (!Array.isArray(question.weightedKeywords) || question.weightedKeywords.length < 3) {
    issues.push(`${level} question ${question.id || index + 1} should have weighted keyword metadata.`);
  }
  if (!question.expectedAnswer?.trim()) {
    issues.push(`${level} question ${question.id || index + 1} is missing an expected answer.`);
  }
  if (!Number.isFinite(question.expectedLength) || question.expectedLength <= 0) {
    issues.push(`${level} question ${question.id || index + 1} has an invalid expected length.`);
  }

  return issues;
}

export function validateDifficultyLevels(domain: Domain): {
  counts: Record<DifficultyLevel, number>;
  issues: string[];
} {
  const counts = {} as Record<DifficultyLevel, number>;
  const issues: string[] = [];

  MANUAL_DIFFICULTY_LEVELS.forEach((level) => {
    const questions = Array.isArray(domain.questions?.[level]) ? domain.questions[level] : [];
    counts[level] = questions.length;

    if (questions.length !== MAX_QUESTIONS_PER_LEVEL) {
      issues.push(
        `${level} must contain exactly ${MAX_QUESTIONS_PER_LEVEL} questions, found ${questions.length}.`,
      );
    }
  });

  return { counts, issues };
}

export function detectDuplicateQuestions(domain: Domain): DuplicateDetectionResult {
  const allQuestionIds: string[] = [];
  const allQuestionTexts: string[] = [];
  const nearDuplicateQuestionTexts: string[] = [];

  MANUAL_DIFFICULTY_LEVELS.forEach((level) => {
    const questions = Array.isArray(domain.questions?.[level]) ? domain.questions[level] : [];
    const levelTexts = questions.map((question) => normalizeQuestionText(question.text));

    allQuestionIds.push(...questions.map((question) => question.id));
    allQuestionTexts.push(...levelTexts);
    nearDuplicateQuestionTexts.push(...findNearDuplicateQuestions(questions));
  });

  return {
    duplicateQuestionIds: findDuplicates(allQuestionIds),
    duplicateQuestionTexts: findDuplicates(allQuestionTexts).filter(Boolean),
    nearDuplicateQuestionTexts,
  };
}

export function validateDomain(domain: Domain): DomainValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const difficultyValidation = validateDifficultyLevels(domain);
  const duplicateDetection = detectDuplicateQuestions(domain);

  MANUAL_DIFFICULTY_LEVELS.forEach((level) => {
    const questions = Array.isArray(domain.questions?.[level]) ? domain.questions[level] : [];

    questions.forEach((question, index) => {
      issues.push(...validateQuestion(question, index, level));
    });
  });

  issues.push(...difficultyValidation.issues);

  if (duplicateDetection.duplicateQuestionIds.length > 0) {
    issues.push(`Duplicate question ids: ${duplicateDetection.duplicateQuestionIds.join(', ')}.`);
  }

  if (duplicateDetection.duplicateQuestionTexts.length > 0) {
    issues.push(`Duplicate question text found ${duplicateDetection.duplicateQuestionTexts.length} time(s).`);
  }

  if (duplicateDetection.nearDuplicateQuestionTexts.length > 0) {
    warnings.push(`Near-duplicate question text found ${duplicateDetection.nearDuplicateQuestionTexts.length} time(s).`);
  }

  return {
    domainId: domain.id,
    domainName: domain.name,
    valid: issues.length === 0,
    counts: difficultyValidation.counts,
    issues,
    warnings,
    duplicateQuestionIds: duplicateDetection.duplicateQuestionIds,
    duplicateQuestionTexts: duplicateDetection.duplicateQuestionTexts,
    nearDuplicateQuestionTexts: duplicateDetection.nearDuplicateQuestionTexts,
  };
}

export function validateQuestionBank(domains: Domain[]): ManualQuestionBankValidationResult {
  const domainResults = domains.map(validateDomain);
  const issues = domainResults.flatMap((domain) =>
    domain.issues.map((issue) => `${domain.domainName}: ${issue}`),
  );
  const warnings = domainResults.flatMap((domain) =>
    domain.warnings.map((warning) => `${domain.domainName}: ${warning}`),
  );
  const totalQuestions = domainResults.reduce(
    (sum, domain) =>
      sum +
      MANUAL_DIFFICULTY_LEVELS.reduce((levelSum, level) => levelSum + domain.counts[level], 0),
    0,
  );

  return {
    valid: issues.length === 0,
    totalDomains: domains.length,
    totalQuestions,
    domains: domainResults,
    issues,
    warnings,
  };
}

export const validateManualDomain = validateDomain;
export const validateManualQuestionBank = validateQuestionBank;
