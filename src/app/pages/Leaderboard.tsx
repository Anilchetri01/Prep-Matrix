import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { LeaderboardEntry } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { Trophy, Medal, Award, TrendingUp, RefreshCw, Crown } from 'lucide-react';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
        <Crown className="w-6 h-6 text-white" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md">
        <Medal className="w-6 h-6 text-white" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
        <Medal className="w-6 h-6 text-white" />
      </div>
    );
  return (
    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{rank}</span>
    </div>
  );
}

function UserAvatar({ name, color, size = 40 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
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
    if (showToast) setRefreshing(true); else setLoading(true);
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

  useEffect(() => { loadLeaderboard(); }, []);

  const userRank = leaderboard.findIndex((e) => e.userId === user?.id) + 1;
  const userEntry = leaderboard.find((e) => e.userId === user?.id);
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Global rankings across all users
            </p>
          </div>
          <button
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
        ) : (
          <>
            {/* Your rank */}
            {userEntry && (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-3">
                  Your Ranking
                </p>
                <div className="flex items-center gap-4">
                  <UserAvatar name={user?.name ?? ''} color="rgba(255,255,255,0.3)" size={48} />
                  <div className="flex-1">
                    <p className="font-bold text-lg">{user?.name}</p>
                    <p className="text-indigo-200 text-sm">{user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold">#{userRank}</p>
                    <p className="text-indigo-200 text-xs">Rank</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold">{userEntry.averageScore}%</p>
                    <p className="text-indigo-200 text-xs">Avg Score</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold">{userEntry.totalInterviews}</p>
                    <p className="text-indigo-200 text-xs">Interviews</p>
                  </div>
                </div>
              </div>
            )}

            {/* Podium (top 3) */}
            {leaderboard.length >= 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Top Performers
                </h3>
                <div className="flex items-end justify-center gap-4">
                  {/* 2nd */}
                  {top3[1] && (
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <UserAvatar name={top3[1].userName} color={top3[1].avatarColor} size={52} />
                      <p className="font-semibold text-sm text-gray-900 dark:text-white text-center leading-tight">
                        {top3[1].userName}
                      </p>
                      <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{top3[1].averageScore}%</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-t-xl h-20 flex items-end justify-center pb-2">
                        <span className="text-2xl font-extrabold text-gray-500 dark:text-gray-300">2</span>
                      </div>
                    </div>
                  )}
                  {/* 1st */}
                  {top3[0] && (
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="relative">
                        <UserAvatar name={top3[0].userName} color={top3[0].avatarColor} size={64} />
                        <Crown className="absolute -top-3 -right-2 w-6 h-6 text-yellow-500 drop-shadow-md" />
                      </div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white text-center leading-tight">
                        {top3[0].userName}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{top3[0].averageScore}%</p>
                      <div className="w-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-xl h-32 flex items-end justify-center pb-2 shadow-lg">
                        <span className="text-3xl font-extrabold text-white">1</span>
                      </div>
                    </div>
                  )}
                  {/* 3rd */}
                  {top3[2] && (
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <UserAvatar name={top3[2].userName} color={top3[2].avatarColor} size={52} />
                      <p className="font-semibold text-sm text-gray-900 dark:text-white text-center leading-tight">
                        {top3[2].userName}
                      </p>
                      <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{top3[2].averageScore}%</p>
                      <div className="w-full bg-orange-300 dark:bg-orange-700 rounded-t-xl h-16 flex items-end justify-center pb-2">
                        <span className="text-2xl font-extrabold text-white">3</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  All Rankings ({leaderboard.length})
                </h2>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-16 text-center">
                  <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No data yet — be the first to complete an interview!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {leaderboard.map((entry, i) => {
                    const rank = i + 1;
                    const isMe = entry.userId === user?.id;
                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                          isMe ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <RankBadge rank={rank} />

                        <UserAvatar name={entry.userName} color={entry.avatarColor} size={40} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {entry.userName}
                            </p>
                            {isMe && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                You
                              </span>
                            )}
                            {entry.userRole === 'admin' && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            <span>📝 {entry.totalInterviews} interviews</span>
                            <span>🏆 Best: {entry.highestScore}%</span>
                            {entry.lastInterviewDate > 0 && (
                              <span>📅 {format(new Date(entry.lastInterviewDate), 'MMM dd')}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <TrendingUp className="w-4 h-4 text-green-500" />
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

            {/* CTA */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white text-center shadow-xl">
              <h3 className="text-xl font-bold mb-2">Climb the Ranks! 🚀</h3>
              <p className="text-purple-100 text-sm mb-4">
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