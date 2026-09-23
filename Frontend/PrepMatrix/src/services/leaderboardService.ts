import type { LeaderboardEntry } from '../app/types';
import { supabase } from '../lib/supabaseClient';
import { aiInterviewStatsService } from './aiInterviewStatsService';
import { assertNoError, runLoggedOperation } from './serviceUtils';

type LeaderboardRow = {
  user_id: string;
  user_name: string;
  user_role: 'admin' | 'user';
  avatar_color: string | null;
  total_interviews: number;
  average_score: number;
  highest_score: number;
  last_interview_date: string | null;
};

class LeaderboardService {
  async getLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    return runLoggedOperation(
      'leaderboardService',
      'getLeaderboard',
      { limit },
      async () => {
        const { data, error } = await supabase.rpc('get_leaderboard', {
          limit_count: limit,
        });

        assertNoError(error, 'Unable to load the leaderboard.');

        const aiStats = await aiInterviewStatsService.getCompletedStats();

        return ((data as LeaderboardRow[] | null) || [])
          .map((row) => {
            const userAiStats = aiStats.users[row.user_id];
            const manualTotalInterviews = row.total_interviews || 0;
            const aiCount = userAiStats?.count || 0;
            const totalInterviews = manualTotalInterviews + aiCount;
            const averageScore =
              totalInterviews > 0
                ? Math.round(
                    ((row.average_score || 0) * manualTotalInterviews +
                      (userAiStats?.scoreSum || 0)) /
                      totalInterviews,
                  )
                : 0;
            const manualLastInterviewDate = row.last_interview_date
              ? new Date(row.last_interview_date).getTime()
              : 0;

            return {
              userId: row.user_id,
              userName: row.user_name,
              userRole: row.user_role,
              avatarColor: row.avatar_color || undefined,
              totalInterviews,
              averageScore,
              highestScore: Math.max(row.highest_score || 0, userAiStats?.bestScore || 0),
              lastInterviewDate: Math.max(
                manualLastInterviewDate,
                userAiStats?.lastInterviewDate || 0,
              ),
            };
          })
          .sort(
            (a, b) =>
              b.averageScore - a.averageScore ||
              b.totalInterviews - a.totalInterviews ||
              b.highestScore - a.highestScore,
          )
          .slice(0, limit);
      },
    );
  }
}

export const leaderboardService = new LeaderboardService();
