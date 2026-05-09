import type { DifficultyLevel } from '../../data/questions';
import type {
  AIAnswerEvaluation,
  AIInterviewQuestion,
  AIResumeInsights,
} from '../types';

const GEMINI_PROXY_URL = '/api/gemini';
// Let the backend proxy finish its retry budget before the browser gives up.
const GEMINI_PROXY_TIMEOUT_MS = 35_000;
const GEMINI_RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);
const MAX_RESUME_TEXT_CHARS = 7_000;
const RESUME_ANALYSIS_CACHE_STORAGE_KEY = 'ai-interview:resume-analysis-cache:v2';
const RESUME_ANALYSIS_CACHE_MAX_ENTRIES = 6;
const RESUME_ANALYSIS_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

const resumeInterviewCache = new Map<string, AIResumeInsights>();
const resumeInterviewInFlight = new Map<string, Promise<AIResumeInsights>>();

const resumeAnalysisSchema = {
  type: 'object',
  properties: {
    skills: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 12,
    },
    domain: { type: 'string' },
    summary: { type: 'string' },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 5,
    },
    questions: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          focusArea: { type: 'string' },
          expectedTraits: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 4,
          },
        },
        required: ['id', 'text', 'focusArea', 'expectedTraits'],
      },
    },
  },
  required: ['skills', 'domain', 'summary', 'strengths', 'questions'],
} as const;

const answerEvaluationSchema = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    feedback: { type: 'string' },
    confidenceScore: { type: 'number' },
    confidenceLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
    },
    clarity: { type: 'number' },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 4,
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 4,
    },
  },
  required: [
    'score',
    'feedback',
    'confidenceScore',
    'confidenceLevel',
    'clarity',
    'strengths',
    'improvements',
  ],
} as const;

type GeminiRequestPayload = {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig: {
    temperature: number;
    responseMimeType: 'application/json';
    responseJsonSchema: Record<string, unknown>;
    maxOutputTokens?: number;
    thinkingConfig?: {
      thinkingBudget: number;
    };
  };
  model?: string;
};

type PersistedResumeAnalysisCacheEntry = {
  analysis?: Partial<AIResumeInsights>;
  cacheKey?: string;
  updatedAt?: number;
};

type PersistedResumeAnalysisCacheStore = {
  entries?: PersistedResumeAnalysisCacheEntry[];
};

const EXPLANATION_SIGNALS = [
  'because',
  'therefore',
  'for example',
  'for instance',
  'so that',
  'which helps',
  'which allows',
  'as a result',
  'improved',
  'reduced',
  'increased',
];

const HEDGING_PATTERN = /\b(maybe|perhaps|probably|possibly|i think|i guess|not sure|kind of|sort of)\b/i;

const SKILL_HINTS: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'React', patterns: [/\breact(?:\.js)?\b/i] },
  { label: 'Next.js', patterns: [/\bnext(?:\.js)?\b/i] },
  { label: 'TypeScript', patterns: [/\btypescript\b/i] },
  { label: 'JavaScript', patterns: [/\bjavascript\b/i] },
  { label: 'Node.js', patterns: [/\bnode(?:\.js)?\b/i] },
  { label: 'Python', patterns: [/\bpython\b/i] },
  { label: 'Java', patterns: [/\bjava\b/i] },
  { label: 'SQL', patterns: [/\bsql\b/i, /\bpostgres(?:ql)?\b/i, /\bmysql\b/i] },
  { label: 'AWS', patterns: [/\baws\b/i, /amazon web services/i] },
  { label: 'Docker', patterns: [/\bdocker\b/i] },
  { label: 'Kubernetes', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { label: 'REST APIs', patterns: [/\brest\b/i, /\bapi\b/i] },
  { label: 'Machine Learning', patterns: [/\bmachine learning\b/i, /\bdeep learning\b/i, /\btensorflow\b/i] },
  { label: 'Data Analysis', patterns: [/\bdata analys/i, /\bpandas\b/i, /\bpower bi\b/i, /\bexcel\b/i] },
  { label: 'UI/UX', patterns: [/\bux\b/i, /\bui\b/i, /\bfigma\b/i, /\bdesign system\b/i] },
  { label: 'Testing', patterns: [/\btesting\b/i, /\bjest\b/i, /\bcypress\b/i, /\bunit test/i] },
  { label: 'Leadership', patterns: [/\bled\b/i, /\bmentored\b/i, /\bmanaged\b/i, /\bowner(ship)?\b/i] },
  { label: 'Communication', patterns: [/\bstakeholder/i, /\bpresented\b/i, /\bcollaborat/i] },
];

const DOMAIN_HINTS: Array<{
  domain: string;
  fallbackSkills: string[];
  patterns: RegExp[];
}> = [
  {
    domain: 'Frontend Engineering',
    fallbackSkills: ['React', 'TypeScript', 'JavaScript'],
    patterns: [/\bfrontend\b/i, /\breact\b/i, /\bnext(?:\.js)?\b/i, /\bcss\b/i, /\bui\b/i],
  },
  {
    domain: 'Backend Engineering',
    fallbackSkills: ['Node.js', 'SQL', 'REST APIs'],
    patterns: [/\bbackend\b/i, /\bnode(?:\.js)?\b/i, /\bapi\b/i, /\bsql\b/i, /\bmicroservice/i],
  },
  {
    domain: 'Full Stack Engineering',
    fallbackSkills: ['React', 'Node.js', 'SQL'],
    patterns: [/\bfull[- ]stack\b/i, /\bfrontend\b/i, /\bbackend\b/i, /\breact\b/i, /\bnode(?:\.js)?\b/i],
  },
  {
    domain: 'Data Science',
    fallbackSkills: ['Python', 'Machine Learning', 'Data Analysis'],
    patterns: [/\bdata science\b/i, /\bmachine learning\b/i, /\bpython\b/i, /\bmodel\b/i, /\banalytics\b/i],
  },
  {
    domain: 'DevOps Engineering',
    fallbackSkills: ['AWS', 'Docker', 'Kubernetes'],
    patterns: [/\bdevops\b/i, /\baws\b/i, /\bdocker\b/i, /\bkubernetes\b/i, /\bcicd\b/i],
  },
  {
    domain: 'Product Management',
    fallbackSkills: ['Leadership', 'Communication', 'Product Strategy'],
    patterns: [/\bproduct manager\b/i, /\broadmap\b/i, /\buser research\b/i, /\bgo-to-market\b/i, /\bstakeholder\b/i],
  },
  {
    domain: 'UX Design',
    fallbackSkills: ['UI/UX', 'Communication', 'Problem solving'],
    patterns: [/\bux\b/i, /\bui\b/i, /\bfigma\b/i, /\bwireframe\b/i, /\bprototype\b/i],
  },
  {
    domain: 'Software Engineering',
    fallbackSkills: ['Problem solving', 'Communication', 'Ownership'],
    patterns: [/\bsoftware\b/i, /\bengineer\b/i, /\bdeveloper\b/i],
  },
];

class GeminiProxyError extends Error {
  status?: number;
  responseBody?: string;
  responseJson?: unknown;
  requestPayload: GeminiRequestPayload;
  retryable: boolean;
  timedOut: boolean;
  networkError: boolean;

  constructor(
    message: string,
    options: {
      requestPayload: GeminiRequestPayload;
      networkError?: boolean;
      responseBody?: string;
      responseJson?: unknown;
      retryable?: boolean;
      status?: number;
      timedOut?: boolean;
    },
  ) {
    super(message);
    this.name = 'GeminiProxyError';
    this.status = options.status;
    this.responseBody = options.responseBody;
    this.responseJson = options.responseJson;
    this.requestPayload = options.requestPayload;
    this.retryable = Boolean(options.retryable);
    this.timedOut = Boolean(options.timedOut);
    this.networkError = Boolean(options.networkError);
  }
}

function normalizeResumeText(resumeText: string) {
  return resumeText.replace(/\s+/g, ' ').trim().slice(0, MAX_RESUME_TEXT_CHARS);
}

function buildResumeRequestKey(
  resumeText: string,
  difficulty: DifficultyLevel,
  questionCount: number,
) {
  return JSON.stringify({
    difficulty,
    questionCount,
    resumeText: normalizeResumeText(resumeText),
  });
}

function clampScore(value: unknown) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function ensureStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stripJsonFences(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractGeminiText(payload: any) {
  const textFromCandidates = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part?.text || '')
    .join('')
    .trim();

  if (textFromCandidates) {
    return textFromCandidates;
  }

  throw new Error('Gemini returned an empty response.');
}

function buildGeminiPayload(
  prompt: string,
  schema: Record<string, unknown>,
  temperature: number,
  options: {
    maxOutputTokens?: number;
  } = {},
): GeminiRequestPayload {
  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      maxOutputTokens: options.maxOutputTokens,
      // Resume analysis and answer scoring are structured extraction tasks,
      // so disabling thinking reduces latency and timeout risk on Gemini 2.5 Flash.
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };
}

function validateGeminiRequestPayload(payload: GeminiRequestPayload) {
  const hasPrompt = Array.isArray(payload.contents)
    ? payload.contents.some((content) =>
        Array.isArray(content.parts)
          ? content.parts.some((part) => typeof part?.text === 'string' && part.text.trim())
          : false,
      )
    : false;

  if (!hasPrompt) {
    throw new GeminiProxyError('Gemini request payload is missing prompt text.', {
      requestPayload: payload,
    });
  }

  if (!payload.generationConfig || typeof payload.generationConfig !== 'object') {
    throw new GeminiProxyError('Gemini request payload is missing generation configuration.', {
      requestPayload: payload,
    });
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = GEMINI_PROXY_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('The Gemini request timed out.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function safeJsonParse<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function readResponsePayload(response: Response) {
  const rawText = await response.text().catch(() => '');
  return {
    parsedBody: rawText ? safeJsonParse<any>(rawText) : null,
    rawText,
  };
}

function logGeminiClientError(context: string, error: unknown, extra: Record<string, unknown> = {}) {
  if (error instanceof GeminiProxyError) {
    console.error(`[geminiClient] ${context}`, {
      ...extra,
      message: error.message,
      networkError: error.networkError,
      requestPayload: error.requestPayload,
      responseBody: error.responseBody,
      responseJson: error.responseJson,
      retryable: error.retryable,
      status: error.status,
      timedOut: error.timedOut,
    });
    return;
  }

  console.error(`[geminiClient] ${context}`, {
    ...extra,
    error,
  });
}

function isRetryableStatus(status: number | undefined) {
  return typeof status === 'number' && GEMINI_RETRYABLE_STATUS_CODES.has(status);
}

async function invokeProxy(payload: GeminiRequestPayload) {
  validateGeminiRequestPayload(payload);

  let response: Response;

  try {
    response = await fetchWithTimeout(GEMINI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    const timedOut = error?.message === 'The Gemini request timed out.';
    const proxyError = new GeminiProxyError(
      timedOut
        ? 'The Gemini proxy timed out while contacting Gemini.'
        : 'Unable to reach the Gemini proxy right now.',
      {
        requestPayload: payload,
        networkError: !timedOut,
        retryable: true,
        timedOut,
      },
    );

    logGeminiClientError('invokeProxy:transport_error', proxyError);
    throw proxyError;
  }

  const { parsedBody, rawText } = await readResponsePayload(response);

  if (!response.ok) {
    const message =
      parsedBody?.error?.message ||
      parsedBody?.message ||
      `Gemini proxy request failed with status ${response.status}.`;
    const proxyError = new GeminiProxyError(message, {
      requestPayload: payload,
      responseBody: rawText,
      responseJson: parsedBody,
      retryable: isRetryableStatus(response.status),
      status: response.status,
    });

    logGeminiClientError('invokeProxy:proxy_error', proxyError);
    throw proxyError;
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    const proxyError = new GeminiProxyError('Gemini proxy returned an invalid JSON response.', {
      requestPayload: payload,
      responseBody: rawText,
      responseJson: parsedBody,
    });

    logGeminiClientError('invokeProxy:invalid_json', proxyError);
    throw proxyError;
  }

  return parsedBody;
}

async function callGeminiJson<T>(
  prompt: string,
  schema: Record<string, unknown>,
  temperature = 0.4,
  options: {
    maxOutputTokens?: number;
  } = {},
) {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error('Gemini prompt is empty.');
  }

  const payload = buildGeminiPayload(trimmedPrompt, schema, temperature, options);
  const result = await invokeProxy(payload);
  const responseText = stripJsonFences(extractGeminiText(result));

  const parsed = safeJsonParse<T>(responseText);
  if (parsed) {
    return parsed;
  }

  const proxyError = new GeminiProxyError('Gemini returned malformed JSON content.', {
    requestPayload: payload,
    responseBody: responseText,
    responseJson: result,
  });

  logGeminiClientError('callGeminiJson:malformed_content', proxyError);
  throw proxyError;
}

function buildResumeAnalysisPrompt(
  resumeText: string,
  difficulty: DifficultyLevel,
  questionCount: number,
) {
  return `
You are a senior technical interviewer creating a personalized interview plan from a candidate resume.

Return JSON only.

Tasks:
1. Infer the candidate's primary hiring domain from the resume.
2. Extract the strongest technical and professional skills.
3. Summarize the candidate profile in 2 concise sentences.
4. List 2 to 5 standout strengths from the resume.
5. Generate exactly ${questionCount} interview questions tailored to the resume.

Question rules:
- Match ${difficulty} difficulty.
- Mix resume-specific behavioral and technical questions.
- Keep questions realistic and interview-ready.
- Avoid markdown, numbering, or duplicate themes.
- Each question must include a short focusArea and 1 to 4 expectedTraits.

Resume text:
"""
${resumeText}
"""
  `.trim();
}

function buildAnswerEvaluationPrompt(args: {
  domain: string;
  skills: string[];
  difficulty: DifficultyLevel;
  question: AIInterviewQuestion;
  answer: string;
  timeSpent: number;
}) {
  return `
You are an expert hiring panel evaluating a candidate's answer.

Return JSON only.

Score rubric:
- score: 0 to 100 based on relevance, technical depth, structure, and completeness.
- confidenceScore: 0 to 100 based on certainty, decisiveness, clarity, and communication strength in the answer text.
- confidenceLevel: low, medium, or high.
- clarity: 0 to 100 based on how understandable and organized the answer is.
- feedback: 2 concise sentences max.
- strengths: 1 to 4 short bullets.
- improvements: 1 to 4 short bullets.

Interview context:
- Domain: ${args.domain}
- Difficulty: ${args.difficulty}
- Candidate skills: ${args.skills.join(', ') || 'Not provided'}
- Focus area: ${args.question.focusArea}
- Expected traits: ${args.question.expectedTraits.join(', ')}
- Time spent: ${args.timeSpent} seconds

Question:
${args.question.text}

Candidate answer:
${args.answer}
  `.trim();
}

function buildFallbackQuestions(
  skills: string[],
  domain: string,
  questionCount: number,
  difficulty: DifficultyLevel,
): AIInterviewQuestion[] {
  const focusAreas = skills.length > 0 ? skills : [domain, 'problem solving', 'communication'];
  const difficultyContext =
    difficulty === 'advanced'
      ? 'for a senior-level discussion'
      : difficulty === 'intermediate'
      ? 'for a mid-level interview'
      : 'for an entry-level conversation';
  const templates = [
    'Walk me through a project where you used %s and explain the impact you created %s.',
    'What is the toughest challenge you faced in %s, and how did you solve it %s?',
    'How would you explain your approach to %s to a hiring manager evaluating your fit %s?',
    'Which decision in your past work best shows your judgment around %s %s?',
    'If you joined in a %s role tomorrow, what would be your first 30-day plan %s?',
  ];

  return Array.from({ length: questionCount }, (_, index) => {
    const focusArea = focusAreas[index % focusAreas.length];
    const template = templates[index % templates.length];

    return {
      id: `fallback-${index + 1}`,
      text: template.replace('%s', focusArea).replace('%s', difficultyContext),
      focusArea,
      expectedTraits: ['ownership', 'clarity', 'practical thinking'],
    };
  });
}

function normalizeQuestions(
  questions: unknown,
  skills: string[],
  domain: string,
  questionCount: number,
  difficulty: DifficultyLevel,
) {
  const rawQuestions = Array.isArray(questions) ? questions : [];
  const normalized = rawQuestions
    .map((question, index) => {
      const candidate = (question || {}) as Partial<AIInterviewQuestion>;
      const text = String(candidate.text || '').trim();

      if (!text) {
        return null;
      }

      return {
        id: String(candidate.id || `resume-q-${index + 1}`),
        text,
        focusArea: String(
          candidate.focusArea || skills[index % Math.max(skills.length, 1)] || domain,
        ).trim(),
        expectedTraits: ensureStringArray(candidate.expectedTraits, [
          'clarity',
          'technical depth',
          'ownership',
        ]).slice(0, 4),
      } satisfies AIInterviewQuestion;
    })
    .filter(Boolean) as AIInterviewQuestion[];

  if (normalized.length >= questionCount) {
    return normalized.slice(0, questionCount);
  }

  const fallbacks = buildFallbackQuestions(skills, domain, questionCount, difficulty);
  return [...normalized, ...fallbacks].slice(0, questionCount);
}

function countPatternMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce(
    (count, pattern) => (pattern.test(text) ? count + 1 : count),
    0,
  );
}

function inferFallbackDomain(resumeText: string) {
  let bestDomain = DOMAIN_HINTS[DOMAIN_HINTS.length - 1];
  let bestScore = 0;

  for (const hint of DOMAIN_HINTS) {
    const score = countPatternMatches(resumeText, hint.patterns);
    if (score > bestScore) {
      bestScore = score;
      bestDomain = hint;
    }
  }

  return bestDomain;
}

function inferFallbackSkills(resumeText: string, domainHint: (typeof DOMAIN_HINTS)[number]) {
  const matchedSkills = uniqueStrings(
    SKILL_HINTS.filter((hint) => hint.patterns.some((pattern) => pattern.test(resumeText))).map(
      (hint) => hint.label,
    ),
  );

  if (matchedSkills.length > 0) {
    return matchedSkills.slice(0, 12);
  }

  return domainHint.fallbackSkills.slice(0, 12);
}

function buildFallbackSummary(
  domain: string,
  skills: string[],
  difficulty: DifficultyLevel,
) {
  const primarySkillSummary = skills.slice(0, 3).join(', ') || 'transferable strengths';
  return `This resume points to ${domain} experience with emphasis on ${primarySkillSummary}. Gemini was unavailable, so this interview was prepared with resume-aware fallback questions tuned for ${difficulty} difficulty.`;
}

function buildFallbackStrengths(domain: string, skills: string[], difficulty: DifficultyLevel) {
  return uniqueStrings([
    skills[0] ? `Hands-on experience detected in ${skills[0]}.` : '',
    skills[1] ? `Breadth across ${skills.slice(0, 2).join(' and ')}.` : '',
    `Resume signal is strong enough to explore ${domain.toLowerCase()} scenarios.`,
    `Questions were kept at a ${difficulty} level so the practice session can continue smoothly.`,
    'Fallback interview generation keeps the user flow unblocked when Gemini is unstable.',
  ]).slice(0, 5);
}

function buildFallbackResumeInsights(
  resumeText: string,
  difficulty: DifficultyLevel,
  questionCount: number,
): AIResumeInsights {
  const domainHint = inferFallbackDomain(resumeText);
  const skills = inferFallbackSkills(resumeText, domainHint);
  const domain = domainHint.domain;

  return {
    skills,
    domain,
    summary: buildFallbackSummary(domain, skills, difficulty),
    strengths: buildFallbackStrengths(domain, skills, difficulty),
    questions: buildFallbackQuestions(skills, domain, questionCount, difficulty),
    generationSource: 'fallback',
  };
}

function readResumeAnalysisCacheEntries() {
  if (typeof window === 'undefined') {
    return [] as PersistedResumeAnalysisCacheEntry[];
  }

  try {
    const rawValue = window.localStorage.getItem(RESUME_ANALYSIS_CACHE_STORAGE_KEY);
    if (!rawValue) {
      return [] as PersistedResumeAnalysisCacheEntry[];
    }

    const parsed = safeJsonParse<PersistedResumeAnalysisCacheStore>(rawValue);
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];

    return entries.filter(
      (entry) =>
        entry &&
        typeof entry.cacheKey === 'string' &&
        typeof entry.updatedAt === 'number' &&
        Date.now() - entry.updatedAt < RESUME_ANALYSIS_CACHE_TTL_MS,
    );
  } catch (error) {
    console.warn('[geminiClient] resume_cache:read_failed', error);
    return [] as PersistedResumeAnalysisCacheEntry[];
  }
}

function readPersistedResumeInterview(
  cacheKey: string,
  questionCount: number,
  difficulty: DifficultyLevel,
): AIResumeInsights | null {
  const cacheEntry = readResumeAnalysisCacheEntries().find((entry) => entry.cacheKey === cacheKey);
  if (!cacheEntry?.analysis) {
    return null;
  }

  const skills = ensureStringArray(cacheEntry.analysis.skills, [
    'Communication',
    'Problem solving',
  ]).slice(0, 12);
  const domain = String(cacheEntry.analysis.domain || 'Software Engineering').trim();
  const summary = String(cacheEntry.analysis.summary || 'Resume analyzed successfully.').trim();
  const strengths = ensureStringArray(cacheEntry.analysis.strengths, [
    'Relevant experience identified.',
  ]).slice(0, 5);

  return {
    skills,
    domain,
    summary,
    strengths,
    questions: normalizeQuestions(
      cacheEntry.analysis.questions,
      skills,
      domain,
      questionCount,
      difficulty,
    ),
    generationSource: 'cache',
  };
}

function persistResumeInterview(cacheKey: string, analysis: AIResumeInsights) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const nextEntries = [
      {
        analysis,
        cacheKey,
        updatedAt: Date.now(),
      },
      ...readResumeAnalysisCacheEntries().filter((entry) => entry.cacheKey !== cacheKey),
    ].slice(0, RESUME_ANALYSIS_CACHE_MAX_ENTRIES);

    window.localStorage.setItem(
      RESUME_ANALYSIS_CACHE_STORAGE_KEY,
      JSON.stringify({
        entries: nextEntries,
      } satisfies PersistedResumeAnalysisCacheStore),
    );
  } catch (error) {
    console.warn('[geminiClient] resume_cache:write_failed', error);
  }
}

function countLowercaseMatches(answer: string, candidates: string[]) {
  return candidates.filter((candidate) => answer.includes(candidate.toLowerCase())).length;
}

function inferConfidenceLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 75) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function buildFallbackAnswerFeedback(
  score: number,
  domain: string,
  skillMatches: number,
  traitMatches: number,
) {
  if (score >= 80) {
    return `Strong answer with clear ${domain.toLowerCase()} relevance. You connected your explanation to the prompt with useful detail.`;
  }

  if (score >= 60) {
    return skillMatches > 0 || traitMatches > 0
      ? 'Good answer overall, but it would be even stronger with one more concrete example or measurable outcome.'
      : 'The answer is understandable, but it needs more domain-specific detail and clearer examples.';
  }

  if (score >= 40) {
    return 'The answer has some useful pieces, but it needs better structure and more direct evidence from your experience.';
  }

  return 'The answer is too brief to score strongly. Add a clearer explanation, specific actions, and an outcome.';
}

function buildFallbackAnswerEvaluation(args: {
  domain: string;
  skills: string[];
  difficulty: DifficultyLevel;
  question: AIInterviewQuestion;
  answer: string;
  timeSpent: number;
}): AIAnswerEvaluation {
  const trimmedAnswer = args.answer.trim();
  const lowerAnswer = trimmedAnswer.toLowerCase();
  const words = trimmedAnswer.split(/\s+/).filter(Boolean);
  const sentenceCount = trimmedAnswer
    .split(/[.!?]+/)
    .map((segment) => segment.trim())
    .filter(Boolean).length;
  const explanationHits = countLowercaseMatches(lowerAnswer, EXPLANATION_SIGNALS);
  const skillHits = args.skills.filter((skill) => lowerAnswer.includes(skill.toLowerCase())).slice(0, 4);
  const traitHits = args.question.expectedTraits.filter((trait) =>
    lowerAnswer.includes(trait.toLowerCase()),
  ).slice(0, 4);
  const hedged = HEDGING_PATTERN.test(lowerAnswer);

  let score = 18;
  score += Math.min(words.length, 180) * 0.28;
  score += skillHits.length * 8;
  score += traitHits.length * 7;
  score += explanationHits * 4;
  score += sentenceCount >= 2 ? 6 : 0;
  score += args.timeSpent >= 20 ? 4 : 0;
  score -= words.length < 20 ? 12 : 0;
  score -= hedged ? 8 : 0;
  score = clampScore(score);

  let confidenceScore = 20;
  confidenceScore += Math.min(words.length, 140) * 0.25;
  confidenceScore += explanationHits * 5;
  confidenceScore += sentenceCount >= 2 ? 8 : 0;
  confidenceScore -= hedged ? 10 : 0;
  confidenceScore = clampScore(confidenceScore);

  let clarity = 25;
  clarity += Math.min(words.length, 120) * 0.2;
  clarity += sentenceCount * 8;
  clarity += explanationHits * 3;
  clarity = clampScore(clarity);

  const strengths = uniqueStrings([
    skillHits.length > 0 ? `References relevant experience in ${skillHits.join(', ')}.` : '',
    traitHits.length > 0 ? `Touches expected traits such as ${traitHits.join(', ')}.` : '',
    words.length >= 45 ? 'Provides enough detail to show thought process.' : '',
    sentenceCount >= 2 ? 'Uses a readable structure instead of a fragment-only answer.' : '',
  ]).slice(0, 4);

  const improvements = uniqueStrings([
    skillHits.length === 0
      ? `Connect the answer more directly to ${args.domain.toLowerCase()} work or tooling.`
      : '',
    traitHits.length === 0
      ? `Address the focus area more directly: ${args.question.focusArea}.`
      : '',
    words.length < 35 ? 'Add a concrete example, decision, or measurable result.' : '',
    hedged ? 'Use more confident language when describing your actions and outcomes.' : '',
  ]).slice(0, 4);

  return {
    score,
    feedback: buildFallbackAnswerFeedback(
      score,
      args.domain,
      skillHits.length,
      traitHits.length,
    ),
    confidenceScore,
    confidenceLevel: inferConfidenceLevel(confidenceScore),
    clarity,
    strengths: strengths.length > 0 ? strengths : ['Relevant answer'],
    improvements: improvements.length > 0 ? improvements : ['Add more specific detail'],
    evaluationSource: 'fallback',
  };
}

export async function generateResumeInterview(
  resumeText: string,
  difficulty: DifficultyLevel,
  questionCount: number,
): Promise<AIResumeInsights> {
  const trimmedResumeText = normalizeResumeText(resumeText);

  if (!trimmedResumeText) {
    throw new Error('Resume text is empty. Please upload a valid resume before preparing the interview.');
  }

  const safeQuestionCount = Number.isFinite(questionCount) && questionCount > 0 ? questionCount : 5;
  const cacheKey = buildResumeRequestKey(trimmedResumeText, difficulty, safeQuestionCount);

  if (resumeInterviewCache.has(cacheKey)) {
    return resumeInterviewCache.get(cacheKey)!;
  }

  if (resumeInterviewInFlight.has(cacheKey)) {
    return resumeInterviewInFlight.get(cacheKey)!;
  }

  const requestPromise = (async () => {
    try {
      const raw = await callGeminiJson<any>(
        buildResumeAnalysisPrompt(trimmedResumeText, difficulty, safeQuestionCount),
        resumeAnalysisSchema,
        0.35,
        {
          maxOutputTokens: 2048,
        },
      );

      const skills = ensureStringArray(raw?.skills, ['Communication', 'Problem solving']).slice(
        0,
        12,
      );
      const domain = String(raw?.domain || 'General Software Engineering').trim();
      const summary = String(raw?.summary || 'Resume analyzed successfully.').trim();
      const strengths = ensureStringArray(raw?.strengths, [
        'Relevant experience identified.',
      ]).slice(0, 5);

      const analysis = {
        skills,
        domain,
        summary,
        strengths,
        questions: normalizeQuestions(raw?.questions, skills, domain, safeQuestionCount, difficulty),
        generationSource: 'gemini',
      } satisfies AIResumeInsights;

      resumeInterviewCache.set(cacheKey, analysis);
      persistResumeInterview(cacheKey, analysis);
      return analysis;
    } catch (error) {
      logGeminiClientError('generateResumeInterview:error', error, {
        difficulty,
        questionCount: safeQuestionCount,
        resumeLength: trimmedResumeText.length,
      });

      const cachedAnalysis = resumeInterviewCache.get(cacheKey);
      if (cachedAnalysis) {
        console.warn('[geminiClient] generateResumeInterview:using_cached_result');
        return cachedAnalysis;
      }

      const persistedAnalysis = readPersistedResumeInterview(cacheKey, safeQuestionCount, difficulty);
      if (persistedAnalysis) {
        resumeInterviewCache.set(cacheKey, persistedAnalysis);
        console.warn('[geminiClient] generateResumeInterview:using_persisted_cache');
        return persistedAnalysis;
      }

      console.warn('[geminiClient] generateResumeInterview:using_fallback_questions');
      return buildFallbackResumeInsights(trimmedResumeText, difficulty, safeQuestionCount);
    } finally {
      resumeInterviewInFlight.delete(cacheKey);
    }
  })();

  resumeInterviewInFlight.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function evaluateInterviewAnswer(args: {
  domain: string;
  skills: string[];
  difficulty: DifficultyLevel;
  question: AIInterviewQuestion;
  answer: string;
  timeSpent: number;
}): Promise<AIAnswerEvaluation> {
  if (!args.answer.trim()) {
    throw new Error('Interview answer is empty.');
  }

  try {
    const raw = await callGeminiJson<any>(
      buildAnswerEvaluationPrompt(args),
      answerEvaluationSchema,
      0.2,
      {
        maxOutputTokens: 768,
      },
    );

    return {
      score: clampScore(raw?.score),
      feedback: String(raw?.feedback || 'A useful answer, but it could be more specific.').trim(),
      confidenceScore: clampScore(raw?.confidenceScore),
      confidenceLevel:
        raw?.confidenceLevel === 'low' || raw?.confidenceLevel === 'high'
          ? raw.confidenceLevel
          : 'medium',
      clarity: clampScore(raw?.clarity),
      strengths: ensureStringArray(raw?.strengths, ['Relevant answer']).slice(0, 4),
      improvements: ensureStringArray(raw?.improvements, ['Add more detail']).slice(0, 4),
      evaluationSource: 'gemini',
    };
  } catch (error) {
    logGeminiClientError('evaluateInterviewAnswer:error', error, {
      difficulty: args.difficulty,
      domain: args.domain,
      questionId: args.question.id,
      timeSpent: args.timeSpent,
    });
    return buildFallbackAnswerEvaluation(args);
  }
}
