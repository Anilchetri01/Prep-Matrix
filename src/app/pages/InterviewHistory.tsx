import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { InterviewSession } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { format } from 'date-fns';
import {
  FileText, Trophy, Clock, Calendar, ChevronRight,
  Trash2, Filter, TrendingUp, Search,
} from 'lucide-react';

type SortKey = 'date' | 'score' | 'domain';
type FilterKey = 'all' | 'completed' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export function InterviewHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [filterBy, setFilterBy] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const loadInterviews = async () => {
    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      console.log('[InterviewHistory] load:start');
      const data = await api.getInterviews();

      if (!isMountedRef.current) return;

      setInterviews(data);
      console.log('[InterviewHistory] load:success', { count: data.length });
    } catch (err: any) {
      console.error('[InterviewHistory] load:error', err);
      if (isMountedRef.current) {
        toast.error('Failed to load interviews: ' + err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      void loadInterviews();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this interview? This cannot be undone.')) return;
    if (isMountedRef.current) {
      setDeletingId(id);
    }
    try {
      console.log('[InterviewHistory] delete:start', { id });
      await api.deleteInterview(id);

      if (!isMountedRef.current) return;

      setInterviews((prev) => prev.filter((i) => i.id !== id));
      toast.success('Interview deleted');
      console.log('[InterviewHistory] delete:success', { id });
    } catch (err: any) {
      console.error('[InterviewHistory] delete:error', err);
      if (isMountedRef.current) {
        toast.error('Delete failed: ' + err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setDeletingId(null);
      }
    }
  };

  const completed = interviews.filter((i) => i.status === 'completed');
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((s, i) => s + (i.score ?? 0), 0) / completed.length)
      : 0;
  const bestScore = completed.length > 0 ? Math.max(...completed.map((i) => i.score ?? 0)) : 0;

  // Filter + search
  const filtered = interviews.filter((i) => {
    const matchFilter =
      filterBy === 'all' ? true :
      filterBy === 'completed' ? i.status === 'completed' :
      i.difficulty === filterBy;
    const matchSearch = i.domainName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return b.startTime - a.startTime;
    if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0);
    return a.domainName.localeCompare(b.domainName);
  });

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track your progress and review past sessions
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Total', value: interviews.length },
              { icon: <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />, bg: 'bg-green-100 dark:bg-green-900/30', label: 'Avg Score', value: `${avgScore}%` },
              { icon: <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />, bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Best Score', value: `${bestScore}%` },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterKey)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Difficulties</option>
              <option value="completed">Completed Only</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">Sort: Newest</option>
              <option value="score">Sort: Highest Score</option>
              <option value="domain">Sort: Domain</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">
              {sorted.length} Interview{sorted.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading interviews..." />
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {interviews.length === 0 ? "You haven't taken any interviews yet." : 'No interviews match your filters.'}
              </p>
              {interviews.length === 0 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Start Your First Interview
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((interview) => {
                const totalTime = interview.endTime
                  ? Math.floor((interview.endTime - interview.startTime) / 1000)
                  : 0;
                const isClickable = interview.status === 'completed';

                return (
                  <div
                    key={interview.id}
                    onClick={() => isClickable && navigate(`/results/${interview.id}`)}
                    className={`flex items-center gap-4 p-5 transition-colors group ${
                      isClickable
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer'
                        : 'opacity-70'
                    }`}
                  >
                    {/* Domain icon */}
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                      📋
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {interview.domainName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[interview.difficulty]}`}>
                          {interview.difficulty}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          interview.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(interview.startTime), 'MMM dd, yyyy')}
                        </span>
                        {interview.status === 'completed' && (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                            </span>
                            <span>{interview.answers.length} questions</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score + actions */}
                    <div className="flex items-center gap-3">
                      {interview.status === 'completed' && interview.score !== undefined && (
                        <div className={`text-xl font-bold ${
                          interview.score >= 75 ? 'text-green-600' :
                          interview.score >= 50 ? 'text-yellow-600' :
                          'text-orange-600'
                        }`}>
                          {interview.score}%
                        </div>
                      )}

                      <button
                        onClick={(e) => handleDelete(interview.id, e)}
                        disabled={deletingId === interview.id}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete interview"
                      >
                        {deletingId === interview.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      {isClickable && (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
