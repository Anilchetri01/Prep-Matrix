import type { AIInterviewAnswer, AIInterviewQuestion, AIInterviewSession } from '../types';

export interface InterviewAreaAnalytics {
  area: string;
  averageConfidence: number | null;
  averageScore: number | null;
  answeredCount: number;
}

export interface InterviewProgressPoint {
  answered: boolean;
  confidence: number | null;
  label: string;
  score: number | null;
}

export interface InterviewSessionAnalytics {
  answeredCount: number;
  averageConfidence: number | null;
  completionRate: number;
  overallScore: number | null;
  progress: InterviewProgressPoint[];
  strongAreas: InterviewAreaAnalytics[];
  totalQuestions: number;
  weakAreas: InterviewAreaAnalytics[];
}

type AreaAccumulator = {
  confidenceTotal: number;
  questionIds: Set<string>;
  scoreTotal: number;
};

function toRoundedAverage(total: number, count: number) {
  if (!count) {
    return null;
  }

  return Math.round(total / count);
}

function normalizeAreaLabel(value: string | null | undefined) {
  const trimmedValue = String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!trimmedValue) {
    return '';
  }

  return trimmedValue
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

function getQuestionAreas(question: AIInterviewQuestion) {
  const tags = Array.isArray(question.expectedTraits) ? question.expectedTraits : [];
  const labels = new Set<string>();

  const push = (value: string | null | undefined) => {
    const normalized = normalizeAreaLabel(value);
    if (normalized) {
      labels.add(normalized);
    }
  };

  push(question.focusArea);
  tags.forEach(push);

  if (!labels.size) {
    labels.add('General');
  }

  return Array.from(labels);
}

function getLatestAnswersByQuestion(session: AIInterviewSession) {
  const latestAnswers = new Map<string, AIInterviewAnswer>();

  session.answers.forEach((answer) => {
    latestAnswers.set(answer.questionId, answer);
  });

  return latestAnswers;
}

function buildAreaAnalytics(
  questions: AIInterviewQuestion[],
  latestAnswers: Map<string, AIInterviewAnswer>,
) {
  const accumulators = new Map<string, AreaAccumulator>();

  questions.forEach((question) => {
    const answer = latestAnswers.get(question.id);
    if (!answer) {
      return;
    }

    getQuestionAreas(question).forEach((area) => {
      const current =
        accumulators.get(area) || {
          confidenceTotal: 0,
          questionIds: new Set<string>(),
          scoreTotal: 0,
        };

      current.scoreTotal += answer.score;
      current.confidenceTotal += answer.confidenceScore;
      current.questionIds.add(question.id);
      accumulators.set(area, current);
    });
  });

  const areas = Array.from(accumulators.entries())
    .map(([area, accumulator]) => {
      const answeredCount = accumulator.questionIds.size;

      return {
        area,
        averageConfidence: toRoundedAverage(accumulator.confidenceTotal, answeredCount),
        averageScore: toRoundedAverage(accumulator.scoreTotal, answeredCount),
        answeredCount,
      } satisfies InterviewAreaAnalytics;
    })
    .sort((left, right) => {
      const rightScore = right.averageScore ?? -1;
      const leftScore = left.averageScore ?? -1;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.answeredCount - left.answeredCount;
    });

  const strongAreas = areas.filter((area) => (area.averageScore ?? 0) >= 75).slice(0, 3);
  const weakAreas = [...areas]
    .filter((area) => (area.averageScore ?? 100) < 60)
    .sort((left, right) => (left.averageScore ?? 100) - (right.averageScore ?? 100))
    .slice(0, 3);

  return {
    strongAreas: strongAreas.length ? strongAreas : areas.slice(0, Math.min(3, areas.length)),
    weakAreas:
      weakAreas.length || areas.length <= 1
        ? weakAreas
        : [...areas]
            .reverse()
            .slice(0, Math.min(3, areas.length - 1))
            .sort((left, right) => (left.averageScore ?? 100) - (right.averageScore ?? 100)),
  };
}

export function buildInterviewAnalytics(session: AIInterviewSession): InterviewSessionAnalytics {
  const latestAnswers = getLatestAnswersByQuestion(session);
  const answeredResponses = Array.from(latestAnswers.values());
  const answeredCount = answeredResponses.length;
  const totalQuestions = Math.max(session.questionCount, session.questions.length, 1);
  const overallScore =
    typeof session.overallScore === 'number'
      ? session.overallScore
      : toRoundedAverage(
          answeredResponses.reduce((total, answer) => total + answer.score, 0),
          answeredCount,
        );
  const averageConfidence =
    typeof session.confidenceScore === 'number'
      ? session.confidenceScore
      : toRoundedAverage(
          answeredResponses.reduce((total, answer) => total + answer.confidenceScore, 0),
          answeredCount,
        );
  const progress = session.questions.map((question, index) => {
    const answer = latestAnswers.get(question.id);

    return {
      answered: Boolean(answer),
      confidence: answer?.confidenceScore ?? null,
      label: `Q${index + 1}`,
      score: answer?.score ?? null,
    } satisfies InterviewProgressPoint;
  });
  const areaAnalytics = buildAreaAnalytics(session.questions, latestAnswers);

  return {
    answeredCount,
    averageConfidence,
    completionRate: Math.round((answeredCount / totalQuestions) * 100),
    overallScore,
    progress,
    strongAreas: areaAnalytics.strongAreas,
    totalQuestions,
    weakAreas: areaAnalytics.weakAreas,
  };
}
