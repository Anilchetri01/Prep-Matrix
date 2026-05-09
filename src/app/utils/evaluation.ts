import { Question } from '../data/questions';
import { InterviewAnswer } from '../types';

export interface EvaluationResult {
  score: number;
  confidenceScore: number;
  relevanceScore: number;
  feedback: string;
  matchedKeywords: string[];
  strengths: string[];
  improvements: string[];
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'do',
  'does',
  'directly',
  'explain',
  'explains',
  'for',
  'from',
  'how',
  'include',
  'includes',
  'i',
  'in',
  'into',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'outline',
  'should',
  'strong',
  'the',
  'their',
  'this',
  'to',
  'what',
  'when',
  'where',
  'why',
  'with',
  'answer',
  'cover',
  'covers',
  'you',
  'your',
]);

const NON_ANSWER_PATTERNS = [
  /^\s*$/,
  /\b(i do not know|i don't know|idk|no idea|not sure|can't say|cannot say)\b/i,
  /\b(random|whatever|anything|nothing)\b/i,
  /^(test|hello|hi|okay|ok|asdf|qwer)\s*$/i,
];

const EXPLANATION_SIGNALS = [
  'because',
  'therefore',
  'allows',
  'helps',
  'used',
  'using',
  'means',
  'ensures',
  'so that',
  'for example',
  'such as',
  'consists',
  'includes',
  'works by',
];

const SYNONYM_MAP: Record<string, string[]> = {
  accessibility: ['a11y', 'screen reader', 'inclusive', 'usable'],
  api: ['endpoint', 'service', 'interface', 'contract'],
  asynchronous: ['async', 'non blocking', 'promise', 'background'],
  authentication: ['auth', 'login', 'identity', 'jwt', 'token'],
  cache: ['caching', 'memoize', 'stored', 'reuse'],
  component: ['module', 'part', 'element', 'unit'],
  database: ['db', 'storage', 'data store', 'repository'],
  debugging: ['troubleshooting', 'diagnostics', 'investigation'],
  optimization: ['improve', 'tune', 'performance', 'efficient'],
  performance: ['speed', 'latency', 'throughput', 'responsive'],
  security: ['protection', 'safe', 'risk', 'vulnerability'],
  scalability: ['scale', 'growth', 'load', 'throughput'],
  testing: ['validation', 'verify', 'quality', 'test'],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string) {
  return normalizeText(text)
    .split(' ')
    .map((token) => token.trim())
    .map(stemToken)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsKeyword(answer: string, keyword: string) {
  const normalizedAnswer = normalizeText(answer);
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) return false;

  const variants = getKeywordVariants(normalizedKeyword);

  return variants.some((variant) => {
    const normalizedVariant = normalizeText(variant);
    if (!normalizedVariant) return false;

    if (normalizedVariant.includes(' ')) {
      return normalizedAnswer.includes(normalizedVariant);
    }

    const keywordPattern = new RegExp(`(^|\\s)${escapeRegExp(stemToken(normalizedVariant))}(?=\\s|$)`, 'i');
    return keywordPattern.test(tokenize(normalizedAnswer).join(' '));
  });
}

function getMatchedKeywords(answer: string, keywords: string[]) {
  return keywords.filter((keyword) => containsKeyword(answer, keyword));
}

function countSignalMatches(answer: string, signals: string[]) {
  const normalizedAnswer = normalizeText(answer);
  return signals.filter((signal) => normalizedAnswer.includes(signal)).length;
}

function getExpectedAnswerCoverage(answer: string, expectedAnswer: string) {
  const answerTokens = unique(tokenize(answer));
  const expectedTokens = unique(tokenize(expectedAnswer));

  if (!expectedTokens.length) return 0;

  const matchedTokens = expectedTokens.filter((token) => answerTokens.includes(token));
  return matchedTokens.length / expectedTokens.length;
}

function stemToken(token: string) {
  if (token.length <= 4) return token;
  return token
    .replace(/(ization|ational)$/i, 'ize')
    .replace(/(fulness|ousness|iveness)$/i, '')
    .replace(/(ingly|edly)$/i, '')
    .replace(/(ing|ed|es|s)$/i, '');
}

function getKeywordVariants(keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  const directSynonyms = SYNONYM_MAP[normalizedKeyword] || [];
  const tokenSynonyms = tokenize(normalizedKeyword).flatMap((token) => SYNONYM_MAP[token] || []);
  return unique([normalizedKeyword, ...directSynonyms, ...tokenSynonyms]);
}

function getWeightedKeywordScore(answer: string, question: Question) {
  const weightedKeywords = question.weightedKeywords?.length
    ? question.weightedKeywords
    : question.keywords.map((term, index) => ({
        term,
        weight: index < 2 ? 1.5 : 1,
        synonyms: SYNONYM_MAP[normalizeText(term)] || [],
      }));

  const totalWeight = weightedKeywords.reduce((sum, keyword) => sum + keyword.weight, 0);
  const matchedKeywords: string[] = [];
  const matchedWeight = weightedKeywords.reduce((sum, keyword) => {
    const variants = unique([keyword.term, ...(keyword.synonyms || []), ...getKeywordVariants(keyword.term)]);
    const matched = variants.some((variant) => containsKeyword(answer, variant));
    if (!matched) return sum;
    matchedKeywords.push(keyword.term);
    return sum + keyword.weight;
  }, 0);

  return {
    matchedKeywords: unique(matchedKeywords),
    score: totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0,
  };
}

function buildTermVector(tokens: string[]) {
  return tokens.reduce<Record<string, number>>((vector, token) => {
    vector[token] = (vector[token] || 0) + 1;
    return vector;
  }, {});
}

function cosineSimilarity(source: string, target: string) {
  const sourceTokens = tokenize(source);
  const targetTokens = tokenize(target);
  if (!sourceTokens.length || !targetTokens.length) return 0;

  const sourceVector = buildTermVector(sourceTokens);
  const targetVector = buildTermVector(targetTokens);
  const terms = unique([...Object.keys(sourceVector), ...Object.keys(targetVector)]);
  const dot = terms.reduce((sum, term) => sum + (sourceVector[term] || 0) * (targetVector[term] || 0), 0);
  const sourceMagnitude = Math.sqrt(
    Object.values(sourceVector).reduce((sum, value) => sum + value * value, 0),
  );
  const targetMagnitude = Math.sqrt(
    Object.values(targetVector).reduce((sum, value) => sum + value * value, 0),
  );

  if (!sourceMagnitude || !targetMagnitude) return 0;
  return dot / (sourceMagnitude * targetMagnitude);
}

function getConceptCoverage(answer: string, question: Question) {
  const concepts = unique([...(question.concepts || []), ...question.keywords]).filter(Boolean);
  if (!concepts.length) return 0;
  const matchedConcepts = concepts.filter((concept) => containsKeyword(answer, concept));
  return matchedConcepts.length / concepts.length;
}

function getQuestionTermCoverage(answer: string, question: Question) {
  const answerTokens = unique(tokenize(answer));
  const questionTokens = unique(tokenize(question.text));

  if (!questionTokens.length) return 0;

  const matchedTokens = questionTokens.filter((token) => answerTokens.includes(token));
  return matchedTokens.length / questionTokens.length;
}

function evaluateKeywordScore(answer: string, keywords: string[]) {
  if (!keywords.length) return { matchedKeywords: [] as string[], score: 0 };

  const matchedKeywords = getMatchedKeywords(answer, keywords);
  const score = (matchedKeywords.length / keywords.length) * 100;

  return {
    matchedKeywords,
    score,
  };
}

function evaluateLengthScore(answer: string, expectedLength: number) {
  const wordCount = tokenize(answer).length;

  if (wordCount < 3) return 0;

  const targetLength = Math.max(expectedLength, 20);
  const ratio = wordCount / targetLength;

  if (ratio < 0.2) return 10;
  if (ratio < 0.4) return 35;
  if (ratio < 0.65) return 60;
  if (ratio <= 1.6) return 100;
  if (ratio <= 2.1) return 80;
  if (ratio <= 2.8) return 60;
  return 40;
}

function evaluateStructureScore(answer: string) {
  const sentences = answer
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const wordCount = tokenize(answer).length;

  if (wordCount < 3) return 0;

  const hasSentencePunctuation = /[.!?]/.test(answer);
  const signalMatches = countSignalMatches(answer, EXPLANATION_SIGNALS);

  let score = 25;

  if (hasSentencePunctuation) {
    score += 25;
  }

  if (sentences.length >= 2) {
    score += 25;
  } else if (sentences.length === 1) {
    score += 10;
  }

  if (signalMatches >= 2) {
    score += 25;
  } else if (signalMatches === 1) {
    score += 15;
  }

  return clamp(score, 0, 100);
}

function evaluateRelevanceScore(
  answer: string,
  question: Question,
  matchedKeywords: string[],
  expectedAnswerCoverage: number,
) {
  const keywordCoverage = question.keywords.length
    ? matchedKeywords.length / question.keywords.length
    : 0;
  const questionTermCoverage = getQuestionTermCoverage(answer, question);
  const answerTokenCount = unique(tokenize(answer)).length;

  if (answerTokenCount < 3) return 0;

  if (keywordCoverage === 0 && expectedAnswerCoverage < 0.1 && questionTermCoverage < 0.1) {
    return answerTokenCount > 8 ? 5 : 0;
  }

  const keywordDensity =
    answerTokenCount > 0 ? matchedKeywords.length / answerTokenCount : 0;

  const conceptCoverage = getConceptCoverage(answer, question);
  const semanticSimilarity = Math.max(
    cosineSimilarity(answer, question.expectedAnswer),
    cosineSimilarity(answer, question.text),
  );

  let score =
    keywordCoverage * 55 +
    expectedAnswerCoverage * 15 +
    questionTermCoverage * 10 +
    conceptCoverage * 10 +
    semanticSimilarity * 10;

  if (keywordDensity < 0.08 && answerTokenCount > 12) {
    score -= 15;
  }

  return clamp(score, 0, 100);
}

function evaluateTechnicalDepthScore(
  answer: string,
  question: Question,
  matchedKeywords: string[],
  expectedAnswerCoverage: number,
) {
  const technicalKeywordMatches = matchedKeywords.filter((keyword) => {
    const keywordTokens = tokenize(keyword);
    return keywordTokens.length > 1 || keyword.length >= 5;
  }).length;
  const keywordDepth = question.keywords.length
    ? technicalKeywordMatches / question.keywords.length
    : 0;
  const explanationSignals = countSignalMatches(answer, EXPLANATION_SIGNALS);

  let score = expectedAnswerCoverage * 60;

  if (keywordDepth > 0) {
    score += clamp(keywordDepth * 30, 0, 30);
  }

  if (explanationSignals >= 2) {
    score += 10;
  } else if (explanationSignals === 1) {
    score += 5;
  }

  return clamp(score, 0, 100);
}

function evaluateConfidenceScore(
  keywordScore: number,
  relevanceScore: number,
  structureScore: number,
  technicalDepthScore: number,
) {
  return Math.round(
    clamp(
      keywordScore * 0.25 +
        relevanceScore * 0.35 +
        structureScore * 0.15 +
        technicalDepthScore * 0.25,
      0,
      100,
    ),
  );
}

function isKeywordStuffedAnswer(answer: string, matchedKeywords: string[]) {
  const tokens = tokenize(answer);
  const explanationSignals = countSignalMatches(answer, EXPLANATION_SIGNALS);
  const matchedTokenCount = unique(
    matchedKeywords.flatMap((keyword) => tokenize(keyword)),
  ).length;

  if (tokens.length < 3 || !matchedKeywords.length) {
    return false;
  }

  const punctuationSentences = answer
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;
  const mostlyKeywords = matchedTokenCount >= Math.max(tokens.length - 2, 1);

  return mostlyKeywords && explanationSignals === 0 && punctuationSentences <= 1;
}

function isLowQualityAnswer(
  answer: string,
  matchedKeywords: string[],
  expectedAnswerCoverage: number,
) {
  if (NON_ANSWER_PATTERNS.some((pattern) => pattern.test(answer))) {
    return true;
  }

  const tokens = tokenize(answer);
  if (tokens.length < 2) {
    return true;
  }

  const uniqueRatio = unique(tokens).length / tokens.length;
  if (tokens.length >= 6 && uniqueRatio < 0.45) {
    return true;
  }

  return matchedKeywords.length === 0 && expectedAnswerCoverage < 0.08 && tokens.length < 8;
}

function generateFeedback(score: number, matchedKeywords: string[], question: Question) {
  if (score >= 85) {
    return `Excellent answer with strong understanding of ${question.text.toLowerCase().replace(/\?$/, '')}.`;
  }

  if (score >= 65) {
    return matchedKeywords.length > 0
      ? 'Good answer, but you missed some important concepts that would make it stronger.'
      : 'Good structure, but the answer needs more domain-specific detail.';
  }

  if (score >= 40) {
    return 'Partial understanding. The answer is somewhat relevant but missing key points and technical depth.';
  }

  return 'Poor answer. It lacks the main concepts needed to answer the question correctly.';
}

export function evaluateAnswer(
  question: Question,
  answer: string,
  _timeSpent: number,
): EvaluationResult {
  const trimmedAnswer = answer.trim();
  const { matchedKeywords, score: rawKeywordScore } = getWeightedKeywordScore(
    trimmedAnswer,
    question,
  );
  const expectedAnswerCoverage = getExpectedAnswerCoverage(
    trimmedAnswer,
    question.expectedAnswer,
  );

  if (isLowQualityAnswer(trimmedAnswer, matchedKeywords, expectedAnswerCoverage)) {
    return {
      score: trimmedAnswer ? 8 : 0,
      confidenceScore: trimmedAnswer ? 10 : 0,
      relevanceScore: 0,
      feedback: 'Poor answer. It is too short, unclear, or unrelated to the question.',
      matchedKeywords,
      strengths: [],
      improvements: [
        'Answer the specific question directly.',
        `Cover key concepts such as ${question.keywords.slice(0, 3).join(', ')}.`,
      ],
    };
  }

  const keywordScore = rawKeywordScore;
  const relevanceScore = evaluateRelevanceScore(
    trimmedAnswer,
    question,
    matchedKeywords,
    expectedAnswerCoverage,
  );
  const lengthScore = evaluateLengthScore(trimmedAnswer, question.expectedLength);
  const structureScore = evaluateStructureScore(trimmedAnswer);
  const technicalDepthScore = evaluateTechnicalDepthScore(
    trimmedAnswer,
    question,
    matchedKeywords,
    expectedAnswerCoverage,
  );
  const keywordStuffed = isKeywordStuffedAnswer(trimmedAnswer, matchedKeywords);
  const semanticSimilarityScore = Math.max(
    cosineSimilarity(trimmedAnswer, question.expectedAnswer),
    cosineSimilarity(trimmedAnswer, question.text),
  ) * 100;

  let totalScore = Math.round(
    keywordScore * 0.35 +
      relevanceScore * 0.25 +
      lengthScore * 0.1 +
      structureScore * 0.1 +
      technicalDepthScore * 0.1 +
      semanticSimilarityScore * 0.1,
  );

  const confidenceScore = evaluateConfidenceScore(
    keywordScore,
    relevanceScore,
    structureScore,
    technicalDepthScore,
  );

  if (matchedKeywords.length === 0 && expectedAnswerCoverage < 0.1) {
    totalScore = Math.min(totalScore, 20);
  }

  if (keywordStuffed) {
    totalScore = Math.min(totalScore, 45);
  }

  if (matchedKeywords.length > 0 && expectedAnswerCoverage < 0.12 && structureScore < 45) {
    totalScore = Math.min(totalScore, 55);
  }

  totalScore = clamp(totalScore, 0, 100);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (matchedKeywords.length >= Math.ceil(question.keywords.length / 2)) {
    strengths.push('Covers many of the expected technical concepts.');
  } else {
    improvements.push(
      `Include more key concepts such as ${question.keywords.slice(0, 4).join(', ')}.`,
    );
  }

  if (relevanceScore >= 70) {
    strengths.push('The answer stays focused on what the question is asking.');
  } else {
    improvements.push('Keep the answer more tightly aligned with the question prompt.');
  }

  if (structureScore >= 70) {
    strengths.push('The explanation is structured and easy to follow.');
  } else {
    improvements.push('Use complete sentences and explain how or why, not just short phrases.');
  }

  if (technicalDepthScore >= 65) {
    strengths.push('Shows solid technical depth and explanation.');
  } else {
    improvements.push('Add more technical detail, reasoning, or an example.');
  }

  if (keywordStuffed) {
    improvements.push('Explain the relationship between the concepts instead of listing keywords only.');
  }

  return {
    score: totalScore,
    confidenceScore,
    relevanceScore: Math.round(relevanceScore),
    feedback: generateFeedback(totalScore, matchedKeywords, question),
    matchedKeywords,
    strengths,
    improvements,
  };
}

export function calculateOverallScore(answers: InterviewAnswer[]): number {
  if (answers.length === 0) return 0;
  const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
  return Math.round(totalScore / answers.length);
}

export function getPerformanceRating(score: number): {
  rating: string;
  color: string;
  message: string;
} {
  if (score >= 90) {
    return {
      rating: 'Outstanding',
      color: 'text-emerald-600',
      message: "You're at the top of your game! Excellent performance across all areas.",
    };
  } else if (score >= 75) {
    return {
      rating: 'Strong',
      color: 'text-green-600',
      message: 'Great work! You demonstrated solid knowledge and skills.',
    };
  } else if (score >= 60) {
    return {
      rating: 'Good',
      color: 'text-blue-600',
      message: 'Nice effort! Keep building on your strengths.',
    };
  } else if (score >= 45) {
    return {
      rating: 'Developing',
      color: 'text-yellow-600',
      message: "You're making progress. Focus on the improvement areas.",
    };
  } else {
    return {
      rating: 'Needs Improvement',
      color: 'text-orange-600',
      message: "Keep learning and practicing. You'll get there!",
    };
  }
}
