import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Crown, Medal, RefreshCw, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { LeaderboardEntry } from '../types';
import { api } from '../utils/api';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 sm:h-11 sm:w-11">
        <Crown className="h-5 w-5" />
      </div>
    );

  if (rank === 2)
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-400/10 border border-slate-400/30 text-slate-400 sm:h-11 sm:w-11">
        <Medal className="h-5 w-5" />
      </div>
    );

  if (rank === 3)
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700/10 border border-amber-700/30 text-amber-700 dark:text-amber-600 sm:h-11 sm:w-11">
        <Medal className="h-5 w-5" />
      </div>
    );

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F4F8] dark:bg-[#172235] border border-[#DDE3EC] dark:border-[#263449] sm:h-11 sm:w-11">
      <span className="text-sm font-bold font-mono text-[#5F6F84] dark:text-[#AAB7CA]">
        {rank}
      </span>
    </div>
  );
}

function UserAvatar({ name, color, size = 40 }: { name: string; color?: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm"
      style={{ width: size, height: size, backgroundColor: color ?? '#6D5EF9', fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data);
      if (showToast) toast.success('Leaderboard refreshed!');
    } catch (err: any) {
      toast.error('Failed to load leaderboard: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const userRank = leaderboard.findIndex((e) => e.userId === user?.id) + 1;
  const userEntry = leaderboard.find((e) => e.userId === user?.id);
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#070B14] transition-colors">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Leaderboard"
          description="Global candidate rankings across all interview domains"
          action={
            <button
              onClick={() => loadLeaderboard(true)}
              disabled={refreshing}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDE3EC] dark:border-[#263449] bg-white dark:bg-[#101827] px-4 py-2 text-sm font-medium text-[#142033] dark:text-[#F4F7FB] shadow-sm transition-colors hover:bg-[#F1F4F8] dark:hover:bg-[#172235] disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          }
        />

        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
        ) : (
          <>
            {userEntry && (
              <div className="min-w-0 rounded-[14px] bg-white dark:bg-[#101827] border border-[#6D5EF9]/40 shadow-[0_0_24px_rgba(109,94,249,0.12)] p-5 text-[#142033] dark:text-[#F4F7FB]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5EF9] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Your Performance Ranking
                  </p>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EEECFF] dark:bg-[#1D1B49] text-[#6D5EF9]">
                    Rank #{userRank}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <UserAvatar name={user?.name ?? ''} color={user?.avatarColor ?? '#6D5EF9'} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-lg font-bold font-display">{user?.name}</p>
                    <p className="break-all text-xs text-[#5F6F84] dark:text-[#AAB7CA]">{user?.email}</p>
                  </div>
                  <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:w-auto sm:min-w-[320px]">
                    <div className="min-w-0 rounded-xl bg-[#F1F4F8] dark:bg-[#172235] border border-[#DDE3EC] dark:border-[#263449] p-3 text-left sm:text-right">
                      <p className="break-words text-2xl font-extrabold font-display text-[#6D5EF9]">#{userRank}</p>
                      <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Rank</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-[#F1F4F8] dark:bg-[#172235] border border-[#DDE3EC] dark:border-[#263449] p-3 text-left sm:text-right">
                      <p className="break-words text-2xl font-extrabold font-display text-[#142033] dark:text-[#F4F7FB]">
                        {userEntry.averageScore}%
                      </p>
                      <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Avg Score</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-[#F1F4F8] dark:bg-[#172235] border border-[#DDE3EC] dark:border-[#263449] p-3 text-left sm:text-right">
                      <p className="break-words text-2xl font-extrabold font-display text-[#142033] dark:text-[#F4F7FB]">
                        {userEntry.totalInterviews}
                      </p>
                      <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Interviews</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {leaderboard.length >= 2 && (
              <div className="min-w-0 rounded-[14px] bg-white dark:bg-[#101827] border border-[#DDE3EC] dark:border-[#263449] p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="flex items-center gap-2 font-bold font-display text-[#142033] dark:text-[#F4F7FB]">
                    <Trophy className="h-5 w-5 text-amber-500" /> Top Performers
                  </h3>
                  <span className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Top candidates by average score</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1st Place (Featured) */}
                  {top3[0] && (
                    <div className="order-1 md:order-2 rounded-xl bg-[#F1F4F8] dark:bg-[#172235] border-2 border-amber-500/40 p-4 sm:p-5 flex flex-col items-center text-center relative shadow-sm">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shadow-sm">
                        <Crown className="w-3 h-3" /> #1 Rank
                      </div>
                      <div className="mt-2 mb-3">
                        <UserAvatar name={top3[0].userName} color={top3[0].avatarColor} size={60} />
                      </div>
                      <p className="font-bold font-display text-base text-[#142033] dark:text-[#F4F7FB] truncate max-w-full">
                        {top3[0].userName}
                      </p>
                      <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] mt-0.5 mb-3">
                        {top3[0].totalInterviews} interview{top3[0].totalInterviews === 1 ? '' : 's'}
                      </p>
                      <div className="mt-auto w-full pt-3 border-t border-[#DDE3EC] dark:border-[#263449]/80 flex items-center justify-between px-2">
                        <span className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Score</span>
                        <span className="text-xl font-extrabold font-mono text-amber-500">
                          {top3[0].averageScore}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2nd Place */}
                  {top3[1] && (
                    <div className="order-2 md:order-1 rounded-xl bg-[#F1F4F8] dark:bg-[#172235] border border-[#DDE3EC] dark:border-[#263449] p-4 flex flex-col items-center text-center relative shadow-sm">
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-600 text-white px-2 py-0.5 rounded-full text-[11px] font-bold font-mono">
                        <Medal className="w-3 h-3" /> #2 Rank
                      </div>
                      <div className="mt-2 mb-3">
                        <UserAvatar name={top3[1].userName} color={top3[1].avatarColor} size={50} />
                      </div>
                      <p className="font-bold font-display text-sm text-[#142033] dark:text-[#F4F7FB] truncate max-w-full">
                        {top3[1].userName}
                      </p>
                      <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] mt-0.5 mb-3">
                        {top3[1].totalInterviews} interview{top3[1].totalInterviews === 1 ? '' : 's'}
                      </p>
                      <div className="mt-auto w-full pt-3 border-t border-[#DDE3EC] dark:border-[#263449]/80 flex items-center justify-between px-2">
                        <span className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Score</span>
                        <span className="text-lg font-bold font-mono text-[#142033] dark:text-[#F4F7FB]">
                          {top3[1].averageScore}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <div className="order-3 md:order-3 rounded-xl bg-[#F1F4F8] dark:bg-[#172235] border border-[#DDE3EC] dark:border-[#263449] p-4 flex flex-col items-center text-center relative shadow-sm">
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-800 text-white px-2 py-0.5 rounded-full text-[11px] font-bold font-mono">
                        <Medal className="w-3 h-3" /> #3 Rank
                      </div>
                      <div className="mt-2 mb-3">
                        <UserAvatar name={top3[2].userName} color={top3[2].avatarColor} size={50} />
                      </div>
                      <p className="font-bold font-display text-sm text-[#142033] dark:text-[#F4F7FB] truncate max-w-full">
                        {top3[2].userName}
                      </p>
                      <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] mt-0.5 mb-3">
                        {top3[2].totalInterviews} interview{top3[2].totalInterviews === 1 ? '' : 's'}
                      </p>
                      <div className="mt-auto w-full pt-3 border-t border-[#DDE3EC] dark:border-[#263449]/80 flex items-center justify-between px-2">
                        <span className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Score</span>
                        <span className="text-lg font-bold font-mono text-[#142033] dark:text-[#F4F7FB]">
                          {top3[2].averageScore}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="min-w-0 overflow-hidden rounded-[14px] bg-white dark:bg-[#101827] border border-[#DDE3EC] dark:border-[#263449] shadow-sm">
              <div className="border-b border-[#DDE3EC] dark:border-[#263449] px-5 py-4 flex items-center justify-between">
                <h2 className="font-bold font-display text-[#142033] dark:text-[#F4F7FB] text-base">
                  All Rankings ({leaderboard.length})
                </h2>
                <span className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Sorted by average score</span>
              </div>

              {leaderboard.length === 0 ? (
                <div className="px-4 py-16 text-center">
                  <Trophy className="mx-auto mb-4 h-12 w-12 text-[#5F6F84] dark:text-[#718096]" />
                  <p className="break-words text-sm text-[#5F6F84] dark:text-[#AAB7CA]">
                    No data yet - be the first to complete an interview!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#DDE3EC] dark:divide-[#263449]">
                  {leaderboard.map((entry, i) => {
                    const rank = i + 1;
                    const isMe = entry.userId === user?.id;

                    return (
                      <div
                        key={entry.userId}
                        className={`flex min-w-0 flex-col gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${
                          isMe ? 'bg-[#EEECFF]/40 dark:bg-[#1D1B49]/30' : 'hover:bg-[#F1F4F8]/60 dark:hover:bg-[#172235]/40'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3.5 sm:flex-1">
                          <RankBadge rank={rank} />
                          <UserAvatar name={entry.userName} color={entry.avatarColor} size={40} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-words text-sm font-semibold text-[#142033] dark:text-[#F4F7FB]">
                                {entry.userName}
                              </p>
                              {isMe && (
                                <span className="rounded-full bg-[#EEECFF] px-2 py-0.5 text-xs font-semibold text-[#6D5EF9] dark:bg-[#1D1B49] dark:text-[#8E82FA]">
                                  You
                                </span>
                              )}
                              {entry.userRole === 'admin' && (
                                <span className="rounded-md bg-[#EEECFF] px-2 py-0.5 text-xs font-semibold text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                              <span>{entry.totalInterviews} interview{entry.totalInterviews === 1 ? '' : 's'}</span>
                              <span>Best: {entry.highestScore}%</span>
                              {entry.lastInterviewDate > 0 && (
                                <span>Last: {format(new Date(entry.lastInterviewDate), 'MMM dd')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-[#F1F4F8] px-3 py-2 dark:bg-[#172235] sm:block sm:bg-transparent sm:p-0 sm:text-right dark:sm:bg-transparent">
                          <div className="flex items-center justify-end gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-xl font-bold font-mono text-[#142033] dark:text-[#F4F7FB]">
                              {entry.averageScore}%
                            </span>
                          </div>
                          <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">average score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="min-w-0 rounded-[14px] bg-[#F1F4F8] dark:bg-[#101827] border border-[#DDE3EC] dark:border-[#263449] p-4 text-center sm:p-5">
              <h3 className="font-semibold font-display text-[#142033] dark:text-[#F4F7FB] text-sm">Consistent Practice Drives Growth</h3>
              <p className="mt-1 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                Complete more interview sessions across varied domains to improve your scores and climb the global rankings.
              </p>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
