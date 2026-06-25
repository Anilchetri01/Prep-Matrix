import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Crown, Medal, RefreshCw, TrendingUp, Trophy } from 'lucide-react';
import { toast } from 'sonner';

import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { LeaderboardEntry } from '../types';
import { api } from '../utils/api';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg sm:h-12 sm:w-12">
        <Crown className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>
    );

  if (rank === 2)
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 shadow-md sm:h-12 sm:w-12">
        <Medal className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>
    );

  if (rank === 3)
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md sm:h-12 sm:w-12">
        <Medal className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>
    );

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 sm:h-12 sm:w-12">
      <span className="text-base font-bold text-gray-700 dark:text-gray-300 sm:text-lg">
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
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, backgroundColor: color ?? '#6366F1', fontSize: size * 0.35 }}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-gray-900 dark:text-white">
              Leaderboard
            </h1>
            <p className="mt-0.5 break-words text-sm text-gray-500 dark:text-gray-400">
              Global rankings across all users
            </p>
          </div>
          <button
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
        ) : (
          <>
            {userEntry && (
              <div className="min-w-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shadow-xl sm:p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                  Your Ranking
                </p>
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <UserAvatar name={user?.name ?? ''} color="rgba(255,255,255,0.3)" size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-lg font-bold">{user?.name}</p>
                    <p className="break-all text-sm text-indigo-200">{user?.email}</p>
                  </div>
                  <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:w-auto sm:min-w-[300px]">
                    <div className="min-w-0 rounded-xl bg-white/10 p-2.5 text-left sm:bg-transparent sm:p-0 sm:text-right">
                      <p className="break-words text-2xl font-extrabold sm:text-3xl">#{userRank}</p>
                      <p className="text-xs text-indigo-200">Rank</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-white/10 p-2.5 text-left sm:bg-transparent sm:p-0 sm:text-right">
                      <p className="break-words text-2xl font-extrabold sm:text-3xl">
                        {userEntry.averageScore}%
                      </p>
                      <p className="text-xs text-indigo-200">Avg Score</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-white/10 p-2.5 text-left sm:bg-transparent sm:p-0 sm:text-right">
                      <p className="break-words text-2xl font-extrabold sm:text-3xl">
                        {userEntry.totalInterviews}
                      </p>
                      <p className="text-xs text-indigo-200">Interviews</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {leaderboard.length >= 2 && (
              <div className="min-w-0 rounded-2xl bg-white p-4 shadow-lg dark:bg-gray-800 sm:p-6">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900 dark:text-white sm:mb-6">
                  <Trophy className="h-5 w-5 text-yellow-500" /> Top Performers
                </h3>
                <div className="grid min-w-0 gap-3 sm:flex sm:items-end sm:justify-center sm:gap-4">
                  {top3[1] && (
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900/40 sm:flex-1 sm:flex-col sm:bg-transparent sm:p-0 dark:sm:bg-transparent">
                      <UserAvatar name={top3[1].userName} color={top3[1].avatarColor} size={52} />
                      <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-center">
                        <p className="break-words text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                          {top3[1].userName}
                        </p>
                        <p className="text-xl font-bold text-gray-700 dark:text-gray-200">
                          {top3[1].averageScore}%
                        </p>
                      </div>
                      <div className="hidden h-20 w-full items-end justify-center rounded-t-xl bg-gray-200 pb-2 dark:bg-gray-600 sm:flex">
                        <span className="text-2xl font-extrabold text-gray-500 dark:text-gray-300">2</span>
                      </div>
                    </div>
                  )}

                  {top3[0] && (
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-yellow-50 p-3 dark:bg-yellow-950/20 sm:flex-1 sm:flex-col sm:bg-transparent sm:p-0 dark:sm:bg-transparent">
                      <div className="relative shrink-0">
                        <UserAvatar name={top3[0].userName} color={top3[0].avatarColor} size={64} />
                        <Crown className="absolute -right-2 -top-3 h-6 w-6 text-yellow-500 drop-shadow-md" />
                      </div>
                      <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-center">
                        <p className="break-words text-sm font-bold leading-tight text-gray-900 dark:text-white">
                          {top3[0].userName}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {top3[0].averageScore}%
                        </p>
                      </div>
                      <div className="hidden h-32 w-full items-end justify-center rounded-t-xl bg-gradient-to-br from-yellow-400 to-yellow-600 pb-2 shadow-lg sm:flex">
                        <span className="text-3xl font-extrabold text-white">1</span>
                      </div>
                    </div>
                  )}

                  {top3[2] && (
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-orange-50 p-3 dark:bg-orange-950/20 sm:flex-1 sm:flex-col sm:bg-transparent sm:p-0 dark:sm:bg-transparent">
                      <UserAvatar name={top3[2].userName} color={top3[2].avatarColor} size={52} />
                      <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-center">
                        <p className="break-words text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                          {top3[2].userName}
                        </p>
                        <p className="text-xl font-bold text-gray-700 dark:text-gray-200">
                          {top3[2].averageScore}%
                        </p>
                      </div>
                      <div className="hidden h-16 w-full items-end justify-center rounded-t-xl bg-orange-300 pb-2 dark:bg-orange-700 sm:flex">
                        <span className="text-2xl font-extrabold text-white">3</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
              <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  All Rankings ({leaderboard.length})
                </h2>
              </div>

              {leaderboard.length === 0 ? (
                <div className="px-4 py-16 text-center">
                  <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="break-words text-gray-500 dark:text-gray-400">
                    No data yet - be the first to complete an interview!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {leaderboard.map((entry, i) => {
                    const rank = i + 1;
                    const isMe = entry.userId === user?.id;

                    return (
                      <div
                        key={entry.userId}
                        className={`flex min-w-0 flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${
                          isMe ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                          <RankBadge rank={rank} />
                          <UserAvatar name={entry.userName} color={entry.avatarColor} size={40} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                                {entry.userName}
                              </p>
                              {isMe && (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                  You
                                </span>
                              )}
                              {entry.userRole === 'admin' && (
                                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>{entry.totalInterviews} interviews</span>
                              <span>Best: {entry.highestScore}%</span>
                              {entry.lastInterviewDate > 0 && (
                                <span>{format(new Date(entry.lastInterviewDate), 'MMM dd')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-900/30 sm:block sm:bg-transparent sm:p-0 sm:text-right dark:sm:bg-transparent">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              {entry.averageScore}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">avg</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="min-w-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 p-4 text-center text-white shadow-xl sm:p-6">
              <h3 className="mb-2 break-words text-xl font-bold">Climb the Ranks!</h3>
              <p className="mb-4 break-words text-sm text-purple-100">
                More interviews = higher average score potential = better rank
              </p>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
