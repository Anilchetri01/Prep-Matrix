import { supabase } from '../lib/supabaseClient';

import { runLoggedOperation } from './serviceUtils';

type AIInterviewStatsRow = {
  created_at: string | null;
  difficulty: string | null;
  ended_at: string | null;
  id: string;
  overall_score: number | null;
  role: string | null;
  started_at: string | null;
  status: string | null;
  user_id: string;
};

export type UserInterviewStats = {
  averageScore: number;
  bestScore: number;
  count: number;
  lastInterviewDate: number;
  scoreSum: number;
};

export type AIInterviewStatsSummary = {
  averageScore: number;
  dailyActivity: Record<string, number>;
  difficultyCounts: Record<string, number>;
  scoreSum: number;
  topDomains: { domain: string; count: number }[];
  totalInterviews: number;
  users: Record<string, UserInterviewStats>;
};

function normalizeScore(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function toTimestamp(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function getInterviewTimestamp(row: AIInterviewStatsRow) {
  return (
    toTimestamp(row.ended_at) ||
    toTimestamp(row.started_at) ||
    toTimestamp(row.created_at)
  );
}

function getInterviewDateKey(row: AIInterviewStatsRow) {
  const timestamp = getInterviewTimestamp(row);
  return timestamp ? new Date(timestamp).toISOString().slice(0, 10) : null;
}

function toCountArray(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

class AIInterviewStatsService {
  async getCompletedStats(): Promise<AIInterviewStatsSummary> {
    return runLoggedOperation(
      'aiInterviewStatsService',
      'getCompletedStats',
      undefined,
      async () => {
        const { data, error } = await supabase
          .from('interviews')
          .select('id,user_id,role,difficulty,status,overall_score,started_at,ended_at,created_at')
          .eq('status', 'completed');

        if (error) {
          console.warn('[aiInterviewStatsService] Unable to load AI interview stats.', error);
          return {
            averageScore: 0,
            dailyActivity: {},
            difficultyCounts: {},
            scoreSum: 0,
            topDomains: [],
            totalInterviews: 0,
            users: {},
          };
        }

        const rows = ((data as AIInterviewStatsRow[] | null) || []).filter((row) => row.user_id);
        const users: Record<string, UserInterviewStats> = {};
        const domainCounts: Record<string, number> = {};
        const difficultyCounts: Record<string, number> = {};
        const dailyActivity: Record<string, number> = {};
        let scoreSum = 0;

        rows.forEach((row) => {
          const score = normalizeScore(row.overall_score);
          const timestamp = getInterviewTimestamp(row);
          const domain = row.role?.trim() || 'AI Interview';
          const difficulty = row.difficulty?.trim().toLowerCase() || 'beginner';
          const dateKey = getInterviewDateKey(row);

          scoreSum += score;
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;

          if (dateKey) {
            dailyActivity[dateKey] = (dailyActivity[dateKey] || 0) + 1;
          }

          const current = users[row.user_id] || {
            averageScore: 0,
            bestScore: 0,
            count: 0,
            lastInterviewDate: 0,
            scoreSum: 0,
          };

          current.count += 1;
          current.scoreSum += score;
          current.bestScore = Math.max(current.bestScore, score);
          current.lastInterviewDate = Math.max(current.lastInterviewDate, timestamp);
          current.averageScore = Math.round(current.scoreSum / current.count);
          users[row.user_id] = current;
        });

        return {
          averageScore: rows.length > 0 ? Math.round(scoreSum / rows.length) : 0,
          dailyActivity,
          difficultyCounts,
          scoreSum,
          topDomains: toCountArray(domainCounts),
          totalInterviews: rows.length,
          users,
        };
      },
    );
  }
}

export const aiInterviewStatsService = new AIInterviewStatsService();
