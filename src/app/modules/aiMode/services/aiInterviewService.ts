import { STORAGE_BUCKETS, supabase } from '../../../../lib/supabaseClient';
import {
  assertNoError,
  buildStoragePath,
  extractStoragePathFromPublicUrl,
  getAuthenticatedAuthUser,
  runLoggedOperation,
  toIsoString,
  toTimestamp,
} from '../../../../services/serviceUtils';
import type {
  AIInterviewAnswer,
  AIInterviewQuestion,
  AIInterviewSession,
  AIResumeInsights,
} from '../types';
import { aiInterviewLocalStore } from './aiInterviewLocalStore';

const AI_INTERVIEW_SCHEMA = 'public';
const INTERVIEWS_TABLE = 'interviews';
const QUESTIONS_TABLE = 'questions';
const RESPONSES_TABLE = 'responses';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type InterviewStatusRow = 'ongoing' | 'completed';

type InterviewRow = {
  id: string;
  user_id: string;
  role: string;
  resume_name: string;
  resume_file_url: string | null;
  resume_text: string | null;
  analysis: unknown;
  difficulty: string;
  total_questions: number;
  current_question_index: number;
  status: InterviewStatusRow;
  overall_score: number | null;
  confidence_score: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

type InterviewWriteRow = Omit<InterviewRow, 'created_at' | 'updated_at'>;

type QuestionRow = {
  id: string;
  interview_id: string;
  position: number;
  question_text: string;
  focus_area: string | null;
  tags: unknown;
  created_at: string;
};

type QuestionWriteRow = Omit<QuestionRow, 'created_at'>;

type ResponseRow = {
  id: string;
  interview_id: string;
  question_id: string;
  answer_text: string;
  score: number | null;
  feedback: string | null;
  confidence: number | null;
  confidence_level: string | null;
  clarity: number | null;
  strengths: unknown;
  improvements: unknown;
  time_spent: number | null;
  answered_at: string;
};

type ResponseWriteRow = Omit<ResponseRow, 'id' | 'answered_at'> & {
  id?: string;
  answered_at?: string | null;
};

function getInterviewsTableReference() {
  return supabase.schema(AI_INTERVIEW_SCHEMA).from(INTERVIEWS_TABLE);
}

function getQuestionsTableReference() {
  return supabase.schema(AI_INTERVIEW_SCHEMA).from(QUESTIONS_TABLE);
}

function getResponsesTableReference() {
  return supabase.schema(AI_INTERVIEW_SCHEMA).from(RESPONSES_TABLE);
}

function isUuid(value: string | null | undefined) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function ensureStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') {
    return '';
  }

  const candidate = error as {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
  };

  return [candidate.code, candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isMissingInterviewHistoryTableError(error: unknown) {
  const details = getErrorDetails(error);
  return (
    details.includes('pgrst205') ||
    details.includes('public.interviews') ||
    details.includes('public.questions') ||
    details.includes('public.responses') ||
    details.includes('relation "interviews" does not exist') ||
    details.includes('relation "questions" does not exist') ||
    details.includes('relation "responses" does not exist')
  );
}

function normalizeScore(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeConfidenceLevel(value: string | null | undefined) {
  return value === 'low' || value === 'high' ? value : 'medium';
}

function mapRowStatusToSessionStatus(
  row: Pick<InterviewRow, 'status' | 'started_at' | 'current_question_index'>,
): AIInterviewSession['status'] {
  if (row.status === 'completed') {
    return 'completed';
  }

  if (row.started_at || row.current_question_index > 0) {
    return 'in-progress';
  }

  return 'ready';
}

function mapSessionStatusToRowStatus(status: AIInterviewSession['status']): InterviewStatusRow {
  return status === 'completed' ? 'completed' : 'ongoing';
}

function normalizeQuestionTags(value: unknown) {
  return ensureStringArray(value, []);
}

function normalizeAnalysis(
  value: unknown,
  role: string,
  questions: AIInterviewQuestion[],
): AIResumeInsights {
  const candidate =
    value && typeof value === 'object'
      ? (value as Partial<AIResumeInsights>)
      : {};

  return {
    skills: ensureStringArray(candidate.skills, []),
    domain: String(candidate.domain || role || 'Software Engineering').trim(),
    summary: String(candidate.summary || '').trim(),
    strengths: ensureStringArray(candidate.strengths, []),
    questions,
    generationSource:
      candidate.generationSource === 'cache' ||
      candidate.generationSource === 'fallback' ||
      candidate.generationSource === 'gemini'
        ? candidate.generationSource
        : undefined,
  };
}

function normalizeSessionQuestionIds(session: AIInterviewSession): AIInterviewSession {
  const idMap = new Map<string, string>();

  const ensureQuestionId = (questionId: string | null | undefined) => {
    const sourceId = typeof questionId === 'string' && questionId.trim() ? questionId.trim() : createUuid();
    const existing = idMap.get(sourceId);

    if (existing) {
      return existing;
    }

    const nextId = isUuid(sourceId) ? sourceId : createUuid();
    idMap.set(sourceId, nextId);
    return nextId;
  };

  const mapQuestion = (question: AIInterviewQuestion): AIInterviewQuestion => ({
    ...question,
    id: ensureQuestionId(question.id),
  });

  const nextQuestions = session.questions.map(mapQuestion);
  const nextAnalysisQuestions = session.analysis.questions.map(mapQuestion);
  const nextAnswers = session.answers.map((answer) => ({
    ...answer,
    questionId: idMap.get(answer.questionId) || answer.questionId,
  }));

  return {
    ...session,
    questions: nextQuestions,
    answers: nextAnswers,
    analysis: {
      ...session.analysis,
      questions: nextAnalysisQuestions,
    },
  };
}

function mapQuestionRow(row: QuestionRow): AIInterviewQuestion {
  return {
    id: row.id,
    text: row.question_text,
    focusArea: row.focus_area || 'General discussion',
    expectedTraits: normalizeQuestionTags(row.tags),
  };
}

function mapResponseRow(
  row: ResponseRow,
  questionsById: Map<string, AIInterviewQuestion>,
): AIInterviewAnswer {
  const question = questionsById.get(row.question_id);

  return {
    questionId: row.question_id,
    questionText: question?.text || 'Question unavailable.',
    answer: row.answer_text || '',
    score: normalizeScore(row.score) ?? 0,
    feedback: String(row.feedback || '').trim(),
    confidenceScore: normalizeScore(row.confidence) ?? 0,
    confidenceLevel: normalizeConfidenceLevel(row.confidence_level),
    clarity: normalizeScore(row.clarity) ?? 0,
    strengths: ensureStringArray(row.strengths, []),
    improvements: ensureStringArray(row.improvements, []),
    timeSpent: row.time_spent ?? 0,
    timestamp: toTimestamp(row.answered_at) ?? Date.now(),
  };
}

class AIInterviewService {
  private mapInterviewRowToSession(
    row: InterviewRow,
    questions: AIInterviewQuestion[] = [],
    answers: AIInterviewAnswer[] = [],
  ): AIInterviewSession {
    return {
      id: row.id,
      userId: row.user_id,
      resumeFileName: row.resume_name,
      resumeFileUrl: row.resume_file_url || '',
      resumeText: row.resume_text || '',
      analysis: normalizeAnalysis(row.analysis, row.role, questions),
      difficulty: row.difficulty as AIInterviewSession['difficulty'],
      questionCount: row.total_questions || questions.length || 0,
      questions,
      answers,
      currentQuestionIndex: row.current_question_index || 0,
      status: mapRowStatusToSessionStatus(row),
      overallScore: normalizeScore(row.overall_score),
      confidenceScore: normalizeScore(row.confidence_score),
      startedAt: toTimestamp(row.started_at),
      endedAt: toTimestamp(row.ended_at),
      createdAt: toTimestamp(row.created_at) ?? Date.now(),
    };
  }

  private toInterviewRowPayload(
    session: AIInterviewSession,
    userId = session.userId,
  ): InterviewWriteRow {
    return {
      id: session.id,
      user_id: userId,
      role: session.analysis.domain,
      resume_name: session.resumeFileName,
      resume_file_url: session.resumeFileUrl || null,
      resume_text: session.resumeText || null,
      analysis: session.analysis,
      difficulty: session.difficulty,
      total_questions: session.questionCount || session.questions.length,
      current_question_index: session.currentQuestionIndex,
      status: mapSessionStatusToRowStatus(session.status),
      overall_score: session.overallScore ?? null,
      confidence_score: session.confidenceScore ?? null,
      started_at: toIsoString(session.startedAt),
      ended_at: toIsoString(session.endedAt),
    };
  }

  private buildQuestionRows(session: AIInterviewSession): QuestionWriteRow[] {
    return session.questions.map((question, index) => ({
      id: question.id,
      interview_id: session.id,
      position: index,
      question_text: question.text,
      focus_area: question.focusArea || null,
      tags: question.expectedTraits,
    }));
  }

  private buildResponseRows(session: AIInterviewSession): ResponseWriteRow[] {
    const latestResponsesByQuestionId = new Map<string, AIInterviewAnswer>();

    session.answers.forEach((answer) => {
      latestResponsesByQuestionId.set(answer.questionId, answer);
    });

    return Array.from(latestResponsesByQuestionId.values()).map((answer) => ({
      interview_id: session.id,
      question_id: answer.questionId,
      answer_text: answer.answer,
      score: answer.score,
      feedback: answer.feedback,
      confidence: answer.confidenceScore,
      confidence_level: answer.confidenceLevel,
      clarity: answer.clarity,
      strengths: answer.strengths,
      improvements: answer.improvements,
      time_spent: answer.timeSpent,
      answered_at: toIsoString(answer.timestamp),
    }));
  }

  private buildLocalSession(
    session: Omit<AIInterviewSession, 'resumeFileUrl' | 'createdAt'>,
    userId: string,
    resumeFileName: string,
    resumeFileUrl: string,
  ) {
    return normalizeSessionQuestionIds({
      ...session,
      userId,
      resumeFileName,
      resumeFileUrl,
      createdAt: Date.now(),
    } satisfies AIInterviewSession);
  }

  private logMissingTableFallback(action: string, error: unknown) {
    console.warn('[aiInterviewService] table:fallback', {
      action,
      hint:
        'Apply the resume interview history migration so the interviews, questions, and responses tables exist before using AI history.',
      tables: [
        `${AI_INTERVIEW_SCHEMA}.${INTERVIEWS_TABLE}`,
        `${AI_INTERVIEW_SCHEMA}.${QUESTIONS_TABLE}`,
        `${AI_INTERVIEW_SCHEMA}.${RESPONSES_TABLE}`,
      ],
      error,
    });
  }

  private async persistSessionGraph(session: AIInterviewSession, userId: string) {
    const normalizedSession = normalizeSessionQuestionIds({
      ...session,
      userId,
    });

    const { error: interviewError } = await getInterviewsTableReference().upsert(
      this.toInterviewRowPayload(normalizedSession, userId),
      { onConflict: 'id' },
    );

    assertNoError(interviewError, 'Unable to save the interview record.');

    const questionRows = this.buildQuestionRows(normalizedSession);
    if (questionRows.length > 0) {
      const { error: questionError } = await getQuestionsTableReference().upsert(questionRows, {
        onConflict: 'id',
      });

      assertNoError(questionError, 'Unable to save the interview questions.');
    }

    const responseRows = this.buildResponseRows(normalizedSession);
    if (responseRows.length > 0) {
      const { error: responseError } = await getResponsesTableReference().upsert(responseRows, {
        onConflict: 'interview_id,question_id',
      });

      assertNoError(responseError, 'Unable to save the interview responses.');
    }

    return normalizedSession;
  }

  private async deletePersistedInterviewGraph(sessionId: string, userId: string) {
    await getInterviewsTableReference().delete().eq('id', sessionId).eq('user_id', userId);
  }

  private async syncLocalFallbackSessions(userId: string) {
    const pendingSessions = aiInterviewLocalStore.listSessions(userId);

    if (!pendingSessions.length) {
      return;
    }

    console.log('[aiInterviewService] syncLocalFallbackSessions:start', {
      count: pendingSessions.length,
      userId,
    });

    for (const session of pendingSessions) {
      await this.persistSessionGraph(session, userId);
    }

    aiInterviewLocalStore.clearSessions(userId);
    console.log('[aiInterviewService] syncLocalFallbackSessions:success', {
      count: pendingSessions.length,
      userId,
    });
  }

  private async deleteStoredResume(publicUrl: string | null | undefined, strict = true) {
    const storagePath = extractStoragePathFromPublicUrl(publicUrl, STORAGE_BUCKETS.resumes);
    if (!storagePath) {
      return;
    }

    const { error } = await supabase.storage.from(STORAGE_BUCKETS.resumes).remove([storagePath]);

    if (!error) {
      return;
    }

    if (strict) {
      assertNoError(error, 'Unable to delete the AI interview resume.');
      return;
    }

    console.warn('[aiInterviewService] deleteStoredResume:warning', {
      error,
      storagePath,
    });
  }

  private async countResumeReferences(args: {
    excludeSessionId?: string;
    publicUrl: string | null | undefined;
    userId: string;
  }) {
    const resumeFileUrl = String(args.publicUrl || '').trim();
    if (!resumeFileUrl) {
      return 0;
    }

    const localReferenceCount = aiInterviewLocalStore
      .listSessions(args.userId)
      .filter(
        (session) =>
          session.resumeFileUrl === resumeFileUrl &&
          (!args.excludeSessionId || session.id !== args.excludeSessionId),
      ).length;

    const query = getInterviewsTableReference()
      .select('id', { count: 'exact', head: true })
      .eq('user_id', args.userId)
      .eq('resume_file_url', resumeFileUrl);

    if (args.excludeSessionId) {
      query.neq('id', args.excludeSessionId);
    }

    const { count, error } = await query;

    if (error) {
      if (isMissingInterviewHistoryTableError(error)) {
        this.logMissingTableFallback('countResumeReferences', error);
        return localReferenceCount;
      }

      assertNoError(error, 'Unable to verify linked resume usage.');
    }

    return (count ?? 0) + localReferenceCount;
  }

  async createSession(args: {
    file: File;
    session: Omit<AIInterviewSession, 'resumeFileUrl' | 'createdAt'>;
  }) {
    return runLoggedOperation(
      'aiInterviewService',
      'createSession',
      {
        difficulty: args.session.difficulty,
        id: args.session.id,
        questionCount: args.session.questionCount,
        resumeFile: args.file,
        tables: [
          `${AI_INTERVIEW_SCHEMA}.${INTERVIEWS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${QUESTIONS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${RESPONSES_TABLE}`,
        ],
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();
        const storagePath = buildStoragePath(authUser.id, args.file.name);

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.resumes)
          .upload(storagePath, args.file, {
            cacheControl: '3600',
            contentType: args.file.type || 'application/pdf',
            upsert: false,
          });

        assertNoError(uploadError, 'Unable to upload the resume for AI Mode.');

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKETS.resumes).getPublicUrl(storagePath);

        const draftSession = this.buildLocalSession(
          args.session,
          authUser.id,
          args.file.name,
          publicUrl,
        );

        try {
          const savedSession = await this.persistSessionGraph(draftSession, authUser.id);
          aiInterviewLocalStore.deleteSession(authUser.id, savedSession.id);
          return savedSession;
        } catch (error) {
          if (isMissingInterviewHistoryTableError(error)) {
            this.logMissingTableFallback('createSession', error);
            return aiInterviewLocalStore.saveSession(draftSession);
          }

          await this.deletePersistedInterviewGraph(draftSession.id, authUser.id);
          await this.deleteStoredResume(publicUrl, false);
          throw error;
        }
      },
    );
  }

  async createRetakeSession(args: {
    analysis: AIResumeInsights;
    sourceSession: Pick<
      AIInterviewSession,
      | 'difficulty'
      | 'questionCount'
      | 'resumeFileName'
      | 'resumeFileUrl'
      | 'resumeText'
      | 'userId'
    >;
  }) {
    return runLoggedOperation(
      'aiInterviewService',
      'createRetakeSession',
      {
        difficulty: args.sourceSession.difficulty,
        questionCount: args.sourceSession.questionCount,
        resumeFileName: args.sourceSession.resumeFileName,
        tables: [
          `${AI_INTERVIEW_SCHEMA}.${INTERVIEWS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${QUESTIONS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${RESPONSES_TABLE}`,
        ],
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();
        const draftSession = normalizeSessionQuestionIds({
          analysis: args.analysis,
          answers: [],
          confidenceScore: undefined,
          createdAt: Date.now(),
          currentQuestionIndex: 0,
          difficulty: args.sourceSession.difficulty,
          endedAt: undefined,
          id: createUuid(),
          overallScore: undefined,
          questionCount: args.sourceSession.questionCount,
          questions: args.analysis.questions,
          resumeFileName: args.sourceSession.resumeFileName,
          resumeFileUrl: args.sourceSession.resumeFileUrl,
          resumeText: args.sourceSession.resumeText,
          startedAt: undefined,
          status: 'ready',
          userId: authUser.id,
        } satisfies AIInterviewSession);

        try {
          const savedSession = await this.persistSessionGraph(draftSession, authUser.id);
          aiInterviewLocalStore.deleteSession(authUser.id, savedSession.id);
          return savedSession;
        } catch (error) {
          if (isMissingInterviewHistoryTableError(error)) {
            this.logMissingTableFallback('createRetakeSession', error);
            return aiInterviewLocalStore.saveSession(draftSession);
          }

          await this.deletePersistedInterviewGraph(draftSession.id, authUser.id);
          throw error;
        }
      },
    );
  }

  async saveSession(session: AIInterviewSession) {
    return runLoggedOperation(
      'aiInterviewService',
      'saveSession',
      {
        answerCount: session.answers.length,
        currentQuestionIndex: session.currentQuestionIndex,
        id: session.id,
        status: session.status,
        tables: [
          `${AI_INTERVIEW_SCHEMA}.${INTERVIEWS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${QUESTIONS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${RESPONSES_TABLE}`,
        ],
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        try {
          const savedSession = await this.persistSessionGraph(session, authUser.id);
          aiInterviewLocalStore.deleteSession(authUser.id, savedSession.id);
          return savedSession;
        } catch (error) {
          if (isMissingInterviewHistoryTableError(error)) {
            this.logMissingTableFallback('saveSession', error);
            return aiInterviewLocalStore.saveSession({
              ...session,
              userId: authUser.id,
            });
          }

          throw error;
        }
      },
    );
  }

  async listSessions() {
    return runLoggedOperation(
      'aiInterviewService',
      'listSessions',
      {
        tables: [
          `${AI_INTERVIEW_SCHEMA}.${INTERVIEWS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${QUESTIONS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${RESPONSES_TABLE}`,
        ],
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        try {
          await this.syncLocalFallbackSessions(authUser.id);
        } catch (error) {
          if (isMissingInterviewHistoryTableError(error)) {
            this.logMissingTableFallback('syncLocalFallbackSessions', error);
            return aiInterviewLocalStore.listSessions(authUser.id);
          }

          throw error;
        }

        const { data, error } = await getInterviewsTableReference()
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (error) {
          if (isMissingInterviewHistoryTableError(error)) {
            this.logMissingTableFallback('listSessions', error);
            return aiInterviewLocalStore.listSessions(authUser.id);
          }

          assertNoError(error, 'Unable to load your AI interview sessions.');
        }

        return ((data as InterviewRow[] | null) || []).map((row) =>
          this.mapInterviewRowToSession(row),
        );
      },
    );
  }

  async getSession(id: string) {
    return runLoggedOperation(
      'aiInterviewService',
      'getSession',
      {
        id,
        tables: [
          `${AI_INTERVIEW_SCHEMA}.${INTERVIEWS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${QUESTIONS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${RESPONSES_TABLE}`,
        ],
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();
        const localSession = aiInterviewLocalStore.getSession(authUser.id, id);

        const [interviewResult, questionsResult, responsesResult] = await Promise.all([
          getInterviewsTableReference()
            .select('*')
            .eq('id', id)
            .eq('user_id', authUser.id)
            .maybeSingle<InterviewRow>(),
          getQuestionsTableReference()
            .select('*')
            .eq('interview_id', id)
            .order('position', { ascending: true }),
          getResponsesTableReference()
            .select('*')
            .eq('interview_id', id)
            .order('answered_at', { ascending: true }),
        ]);

        if (interviewResult.error || questionsResult.error || responsesResult.error) {
          const firstError = interviewResult.error || questionsResult.error || responsesResult.error;

          if (isMissingInterviewHistoryTableError(firstError)) {
            this.logMissingTableFallback('getSession', firstError);

            if (localSession) {
              return localSession;
            }
          }

          assertNoError(firstError, 'Unable to load the interview details.');
        }

        if (!interviewResult.data) {
          if (localSession) {
            return localSession;
          }

          throw new Error('Interview session not found.');
        }

        const questions = ((questionsResult.data as QuestionRow[] | null) || []).map(mapQuestionRow);
        const questionsById = new Map(questions.map((question) => [question.id, question]));
        const responses = ((responsesResult.data as ResponseRow[] | null) || []).map((row) =>
          mapResponseRow(row, questionsById),
        );

        return this.mapInterviewRowToSession(interviewResult.data, questions, responses);
      },
    );
  }

  async deleteSession(id: string) {
    return runLoggedOperation(
      'aiInterviewService',
      'deleteSession',
      {
        id,
        tables: [
          `${AI_INTERVIEW_SCHEMA}.${INTERVIEWS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${QUESTIONS_TABLE}`,
          `${AI_INTERVIEW_SCHEMA}.${RESPONSES_TABLE}`,
        ],
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { data, error } = await getInterviewsTableReference()
          .select('resume_file_url')
          .eq('id', id)
          .eq('user_id', authUser.id)
          .maybeSingle<{ resume_file_url: string | null }>();

        if (error) {
          if (isMissingInterviewHistoryTableError(error)) {
            this.logMissingTableFallback('deleteSession', error);
            const localSession = aiInterviewLocalStore.getSession(authUser.id, id);
            aiInterviewLocalStore.deleteSession(authUser.id, id);
            await this.deleteStoredResume(localSession?.resumeFileUrl, false);
            return { success: true };
          }

          assertNoError(error, 'Unable to load the AI interview for deletion.');
        }

        const { error: deleteError } = await getInterviewsTableReference()
          .delete()
          .eq('id', id)
          .eq('user_id', authUser.id);

        assertNoError(deleteError, 'Unable to delete the AI interview session.');
        aiInterviewLocalStore.deleteSession(authUser.id, id);
        const remainingReferences = await this.countResumeReferences({
          excludeSessionId: id,
          publicUrl: data?.resume_file_url,
          userId: authUser.id,
        });

        if (remainingReferences === 0) {
          await this.deleteStoredResume(data?.resume_file_url, true);
        }

        return { success: true };
      },
    );
  }
}

export const aiInterviewService = new AIInterviewService();
