import type { AdminStats, InterviewAnswer, InterviewSession } from '../app/types';
import { supabase } from '../lib/supabaseClient';
import {
  assertNoError,
  getAuthenticatedAuthUser,
  runLoggedOperation,
  ServiceError,
  toIsoString,
} from './serviceUtils';
import { aiInterviewStatsService } from './aiInterviewStatsService';

type InterviewSessionRow = {
  id: string;
  user_id: string;
  role: string;
  domain_id: string | null;
  difficulty: string | null;
  questions: unknown;
  answers: unknown;
  current_question_index: number;
  status: 'in-progress' | 'completed';
  score: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

type AdminStatsRpcPayload = Partial<AdminStats> & {
  average_score?: number;
  daily_activity?: Record<string, number>;
  difficulty_counts?: Record<string, number>;
  includesAiInterviews?: boolean;
  includes_ai_interviews?: boolean;
  top_domains?: { domain: string; count: number }[];
  total_interviews?: number;
  total_users?: number;
};

function mergeCountRecords(
  base: Record<string, number>,
  extra: Record<string, number>,
) {
  const merged = { ...base };

  Object.entries(extra).forEach(([key, count]) => {
    merged[key] = (merged[key] || 0) + count;
  });

  return merged;
}

function mergeDomainCounts(
  base: { domain: string; count: number }[],
  extra: { domain: string; count: number }[],
) {
  const counts: Record<string, number> = {};

  [...base, ...extra].forEach(({ domain, count }) => {
    counts[domain] = (counts[domain] || 0) + count;
  });

  return Object.entries(counts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

function isMissingRpcError(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(
    error &&
      (error.code === 'PGRST202' ||
        error.code === '42883' ||
        /function .*admin_platform_stats|could not find the function/i.test(error.message || '')),
  );
}

function normalizeAdminStatsPayload(payload: unknown): AdminStats & { includesAiInterviews: boolean } {
  const stats = (Array.isArray(payload) ? payload[0] : payload || {}) as AdminStatsRpcPayload;

  return {
    averageScore: stats.averageScore ?? stats.average_score ?? 0,
    dailyActivity: stats.dailyActivity ?? stats.daily_activity ?? {},
    difficultyCounts: stats.difficultyCounts ?? stats.difficulty_counts ?? {},
    includesAiInterviews: Boolean(
      stats.includesAiInterviews ?? stats.includes_ai_interviews ?? false,
    ),
    topDomains: stats.topDomains ?? stats.top_domains ?? [],
    totalInterviews: stats.totalInterviews ?? stats.total_interviews ?? 0,
    totalUsers: stats.totalUsers ?? stats.total_users ?? 0,
  };
}

class InterviewService {
  private mapInterviewRow(row: InterviewSessionRow): InterviewSession {
    const questions = (Array.isArray(row.questions) ? row.questions : []) as InterviewSession['questions'];

    return {
      id: row.id,
      userId: row.user_id,
      domainId: row.domain_id || '',
      domainName: row.role,
      difficulty: (row.difficulty as InterviewSession['difficulty']) || 'beginner',
      questions,
      selectedQuestionIds: questions?.map((question) => question.id) || [],
      requestedQuestionCount: questions?.length || undefined,
      startTime: new Date(row.started_at || row.created_at).getTime(),
      endTime: row.ended_at ? new Date(row.ended_at).getTime() : undefined,
      currentQuestionIndex: row.current_question_index || 0,
      answers: (Array.isArray(row.answers) ? row.answers : []) as InterviewAnswer[],
      score: row.score ?? undefined,
      status: row.status,
    };
  }

  async saveInterview(session: InterviewSession) {
    return runLoggedOperation(
      'interviewService',
      'saveInterview',
      {
        answersCount: session.answers.length,
        currentQuestionIndex: session.currentQuestionIndex,
        id: session.id,
        requestedQuestionCount: session.requestedQuestionCount ?? session.questions?.length ?? null,
        score: session.score ?? null,
        status: session.status,
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { data, error } = await supabase
          .from('interview_sessions')
          .upsert(
            {
              answers: session.answers,
              created_at: toIsoString(session.startTime),
              current_question_index: session.currentQuestionIndex,
              difficulty: session.difficulty,
              domain_id: session.domainId,
              ended_at: toIsoString(session.endTime),
              id: session.id,
              questions: session.questions || [],
              role: session.domainName,
              score: session.score ?? null,
              started_at: toIsoString(session.startTime),
              status: session.status,
              user_id: authUser.id,
            },
            { onConflict: 'id' },
          )
          .select('id, status, score')
          .single<{ id: string; status: InterviewSession['status']; score: number | null }>();

        assertNoError(error, 'Unable to save the interview session.');

        if (!data?.id) {
          throw new ServiceError('The interview session could not be confirmed.');
        }

        return { success: true, id: data.id, score: data.score, status: data.status };
      },
    );
  }

  async getInterviews() {
    return runLoggedOperation(
      'interviewService',
      'getInterviews',
      undefined,
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', authUser.id)
          .order('started_at', { ascending: false });

        assertNoError(error, 'Unable to load interview sessions.');
        return ((data as InterviewSessionRow[] | null) || []).map((row) =>
          this.mapInterviewRow(row),
        );
      },
    );
  }

  async getInterview(id: string) {
    return runLoggedOperation(
      'interviewService',
      'getInterview',
      { id },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', authUser.id)
          .single<InterviewSessionRow>();

        assertNoError(error, 'Unable to load the requested interview.');
        return this.mapInterviewRow(data);
      },
    );
  }

  async deleteInterview(id: string) {
    return runLoggedOperation(
      'interviewService',
      'deleteInterview',
      { id },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { error } = await supabase
          .from('interview_sessions')
          .delete()
          .eq('id', id)
          .eq('user_id', authUser.id);

        assertNoError(error, 'Unable to delete the interview.');
        return { success: true };
      },
    );
  }

  async getAdminStats(): Promise<AdminStats> {
    return runLoggedOperation(
      'interviewService',
      'getAdminStats',
      undefined,
      async () => {
        const { data, error } = await supabase.rpc('admin_platform_stats');

        if (!isMissingRpcError(error)) {
          assertNoError(error, 'Unable to load platform statistics.');
        }

        const stats = normalizeAdminStatsPayload(data);

        if (stats.includesAiInterviews) {
          return {
            averageScore: stats.averageScore,
            dailyActivity: stats.dailyActivity,
            difficultyCounts: stats.difficultyCounts,
            topDomains: stats.topDomains,
            totalInterviews: stats.totalInterviews,
            totalUsers: stats.totalUsers,
          };
        }

        const aiStats = await aiInterviewStatsService.getCompletedStats();
        const manualTotalInterviews = stats.totalInterviews;
        const manualAverageScore = stats.averageScore;
        const totalInterviews = manualTotalInterviews + aiStats.totalInterviews;
        const averageScore =
          totalInterviews > 0
            ? Math.round(
                (manualAverageScore * manualTotalInterviews + aiStats.scoreSum) /
                  totalInterviews,
              )
            : 0;

        return {
          averageScore,
          dailyActivity: mergeCountRecords(stats.dailyActivity, aiStats.dailyActivity),
          difficultyCounts: mergeCountRecords(
            stats.difficultyCounts,
            aiStats.difficultyCounts,
          ),
          topDomains: mergeDomainCounts(stats.topDomains, aiStats.topDomains),
          totalInterviews,
          totalUsers: stats.totalUsers,
        };
      },
    );
  }
}

export const interviewService = new InterviewService();
