import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { InterviewSession } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { format } from 'date-fns';
import {
  FileText, Trophy, Clock, Calendar, ChevronRight,
  Trash2, TrendingUp, Search, Play,
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
    beginner: 'bg-emerald-500/10 text-[#059669] dark:text-[#34D399] border border-emerald-500/20',
    intermediate: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF] border border-[#6D5EF9]/20',
    advanced: 'bg-[#EEECFF] text-[#6D5EF9] dark:bg-[#1D1B49] dark:text-[#8174FF] border border-[#6D5EF9]/30',
    expert: 'bg-amber-500/10 text-[#B45309] dark:text-[#FBBF24] border border-amber-500/20',
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#070B14] transition-colors">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Interview History"
          description="Track your performance, review answers, and analyze your progress over time"
          action={
            <button
              onClick={() => navigate('/dashboard')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D5EF9] hover:bg-[#8174FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors sm:w-auto"
            >
              <Play className="h-4 w-4" />
              New Interview
            </button>
          }
        />

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#101827] border border-[#DDE3EC] dark:border-[#263449] rounded-[14px] p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: FileText, label: 'Total Sessions', value: interviews.length },
              { icon: TrendingUp, label: 'Average Score', value: `${avgScore}%` },
              { icon: Trophy, label: 'Best Score', value: `${bestScore}%` },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex min-w-0 items-center gap-4 rounded-[14px] bg-white dark:bg-[#101827] border border-[#DDE3EC] dark:border-[#263449] p-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEECFF] dark:bg-[#1D1B49] text-[#6D5EF9]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#5F6F84] dark:text-[#AAB7CA]">{s.label}</p>
                    <p className="break-words text-2xl font-bold font-display text-[#142033] dark:text-[#F4F7FB] mt-0.5">{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-[14px] bg-white dark:bg-[#101827] border border-[#DDE3EC] dark:border-[#263449] p-3 shadow-sm sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
              <input
                type="text"
                placeholder="Search by domain name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#DDE3EC] dark:border-[#263449] bg-[#F1F4F8] dark:bg-[#172235] py-2 pl-10 pr-4 text-sm text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
              />
            </div>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterKey)}
              aria-label="Filter by difficulty"
              className="h-11 rounded-xl border border-[#DDE3EC] dark:border-[#263449] bg-[#F1F4F8] dark:bg-[#172235] px-3.5 py-2 text-sm text-[#142033] dark:text-[#F4F7FB] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
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
              aria-label="Sort interviews"
              className="h-11 rounded-xl border border-[#DDE3EC] dark:border-[#263449] bg-[#F1F4F8] dark:bg-[#172235] px-3.5 py-2 text-sm text-[#142033] dark:text-[#F4F7FB] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
            >
              <option value="date">Sort: Newest First</option>
              <option value="score">Sort: Highest Score</option>
              <option value="domain">Sort: Domain Name</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-[#101827] border border-[#DDE3EC] dark:border-[#263449] rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DDE3EC] dark:border-[#263449] flex items-center justify-between">
            <h2 className="font-bold font-display text-[#142033] dark:text-[#F4F7FB] text-base">
              {sorted.length} Session{sorted.length !== 1 ? 's' : ''}
            </h2>
            <span className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
              Showing {filtered.length} of {interviews.length}
            </span>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading interviews..." />
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 bg-[#EEECFF] dark:bg-[#1D1B49] text-[#6D5EF9] rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-semibold font-display text-[#142033] dark:text-[#F4F7FB] mb-1">No interviews found</h3>
              <p className="text-sm text-[#5F6F84] dark:text-[#AAB7CA] mb-5 max-w-sm mx-auto">
                {interviews.length === 0 ? "You haven't completed any interviews yet. Start your first session to track performance." : 'No sessions match your search criteria. Try clearing filters.'}
              </p>
              {interviews.length === 0 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 bg-[#6D5EF9] hover:bg-[#8174FF] text-white rounded-xl font-semibold text-sm shadow-sm transition-colors"
                >
                  Start Your First Interview
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#DDE3EC] dark:divide-[#263449]">
              {sorted.map((interview) => {
                const totalTime = interview.endTime
                  ? Math.floor((interview.endTime - interview.startTime) / 1000)
                  : 0;
                const isClickable = interview.status === 'completed';

                return (
                  <div
                    key={interview.id}
                    onClick={() => isClickable && navigate(`/results/${interview.id}`)}
                    className={`group flex min-w-0 items-start gap-3.5 p-4 transition-colors sm:items-center sm:gap-4 sm:p-5 ${
                      isClickable
                        ? 'hover:bg-[#F1F4F8]/60 dark:hover:bg-[#172235]/40 cursor-pointer'
                        : 'opacity-70'
                    }`}
                  >
                    {/* Domain icon */}
                    <div className="w-11 h-11 bg-[#EEECFF] dark:bg-[#1D1B49] text-[#6D5EF9] rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h3 className="font-semibold font-display text-[#142033] dark:text-[#F4F7FB] text-sm truncate">
                          {interview.domainName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${difficultyColors[interview.difficulty]}`}>
                          {interview.difficulty}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          interview.status === 'completed'
                            ? 'bg-emerald-500/10 text-[#059669] dark:text-[#34D399] border border-emerald-500/20'
                            : 'bg-amber-500/10 text-[#B45309] dark:text-[#FBBF24] border border-amber-500/20'
                        }`}>
                          {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5F6F84] dark:text-[#AAB7CA] sm:gap-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(interview.startTime), 'MMM dd, yyyy')}
                        </span>
                        {interview.status === 'completed' && (
                          <>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                            </span>
                            <span>{interview.answers.length} question{interview.answers.length === 1 ? '' : 's'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score + actions */}
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                      {interview.status === 'completed' && interview.score !== undefined && (
                        <div className={`text-xl font-bold font-mono ${
                          interview.score >= 75 ? 'text-[#059669] dark:text-[#34D399]' :
                          interview.score >= 50 ? 'text-[#B45309] dark:text-[#FBBF24]' :
                          'text-[#E11D48] dark:text-[#FB7185]'
                        }`}>
                          {interview.score}%
                        </div>
                      )}

                      <button
                        onClick={(e) => handleDelete(interview.id, e)}
                        disabled={deletingId === interview.id}
                        aria-label={`Delete ${interview.domainName} interview`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 opacity-100 transition-all hover:bg-rose-500/10 hover:text-[#E11D48] dark:hover:text-[#FB7185] sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete interview"
                      >
                        {deletingId === interview.id ? (
                          <div className="w-4 h-4 border-2 border-[#FB7185] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      {isClickable && (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0" />
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
