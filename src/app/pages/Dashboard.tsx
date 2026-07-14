import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileSearch,
  History,
  LineChart as LineChartIcon,
  Medal,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Users,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { DOMAINS, DIFFICULTY_LEVELS } from '../data/questions';
import { aiInterviewService } from '../modules/aiMode/services/aiInterviewService';
import type { AIInterviewSession } from '../modules/aiMode/types';
import type { InterviewSession, Resume } from '../types';
import { api } from '../utils/api';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#10B981',
  intermediate: '#3B82F6',
  advanced: '#8B5CF6',
};

const CATEGORY_LABELS: Record<string, string> = {
  'ai-careers': 'AI Careers',
  'business-management': 'Business',
  'creative-design': 'Creative',
  education: 'Education',
  engineering: 'Engineering',
  'finance-commerce': 'Finance',
  'government-public-sector': 'Government',
  healthcare: 'Healthcare',
  'hospitality-tourism': 'Hospitality',
  legal: 'Legal',
  'marketing-sales': 'Marketing',
  'media-communication': 'Media',
  'operations-support': 'Operations',
  technology: 'Technology',
};

function getInterviewScore(interview: InterviewSession | AIInterviewSession) {
  if ('overallScore' in interview) {
    return interview.overallScore ?? 0;
  }

  return interview.score ?? 0;
}

function getWeeklyProgress(manualInterviews: InterviewSession[], aiInterviews: AIInterviewSession[]) {
  return Array.from({ length: 7 }).map((_, index) => {
    const day = subDays(new Date(), 6 - index);
    const dayKey = format(day, 'yyyy-MM-dd');
    const manual = manualInterviews.filter(
      (interview) => format(new Date(interview.startTime), 'yyyy-MM-dd') === dayKey,
    ).length;
    const ai = aiInterviews.filter((interview) => {
      const timestamp = interview.endedAt ?? interview.startedAt ?? interview.createdAt;
      return format(new Date(timestamp), 'yyyy-MM-dd') === dayKey;
    }).length;

    return {
      day: format(day, 'EEE'),
      manual,
      ai,
      total: manual + ai,
    };
  });
}

function EmptyAnalytics() {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-white/10 dark:bg-slate-950/50">
      <BarChart3 className="h-9 w-9 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Analytics will appear after practice</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Complete manual or AI interviews to unlock trends, comparisons, and performance breakdowns.
      </p>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [manualInterviews, setManualInterviews] = useState<InterviewSession[]>([]);
  const [aiInterviews, setAiInterviews] = useState<AIInterviewSession[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;

    const loadDashboardData = async () => {
      try {
        const [manualData, aiData, resumeData] = await Promise.all([
          api.getInterviews(),
          aiInterviewService.listSessions().catch((error) => {
            console.warn('[Dashboard] AI session analytics unavailable', error);
            return [] as AIInterviewSession[];
          }),
          api.getResumes().catch((error) => {
            console.warn('[Dashboard] resume analytics unavailable', error);
            return [] as Resume[];
          }),
        ]);

        if (!isMountedRef.current) return;

        setManualInterviews(manualData);
        setAiInterviews(aiData);
        setResumes(resumeData);
      } catch (error: any) {
        if (isMountedRef.current) {
          toast.error(error?.message || 'Could not load dashboard analytics.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const completedManual = useMemo(
    () => manualInterviews.filter((interview) => interview.status === 'completed'),
    [manualInterviews],
  );

  const completedAi = useMemo(
    () => aiInterviews.filter((interview) => interview.status === 'completed'),
    [aiInterviews],
  );

  const allCompleted = useMemo(
    () => [
      ...completedManual.map((interview) => ({
        id: interview.id,
        label: interview.domainName,
        mode: 'Manual',
        score: getInterviewScore(interview),
        timestamp: interview.endTime ?? interview.startTime,
        route: `/results/${interview.id}`,
        difficulty: interview.difficulty,
      })),
      ...completedAi.map((interview) => ({
        id: interview.id,
        label: interview.analysis.domain,
        mode: 'AI',
        score: getInterviewScore(interview),
        timestamp: interview.endedAt ?? interview.startedAt ?? interview.createdAt,
        route: `/interview/${interview.id}`,
        difficulty: interview.difficulty,
      })),
    ].sort((left, right) => right.timestamp - left.timestamp),
    [completedAi, completedManual],
  );

  const totalInterviews = completedManual.length + completedAi.length;
  const scoreValues = allCompleted.map((interview) => interview.score).filter((score) => score > 0);
  const averageScore =
    scoreValues.length > 0
      ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
      : 0;
  const bestScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
  const practicedDomains = new Set([
    ...completedManual.map((interview) => interview.domainId),
    ...completedAi.map((interview) => interview.analysis.domain),
  ]).size;

  const scoreProgress = allCompleted
    .slice()
    .reverse()
    .slice(-10)
    .map((interview, index) => ({
      name: `S${index + 1}`,
      score: interview.score,
      mode: interview.mode,
      domain: interview.label,
    }));

  const difficultyPerformance = DIFFICULTY_LEVELS.map((difficulty) => {
    const manualScores = completedManual
      .filter((interview) => interview.difficulty === difficulty)
      .map((interview) => interview.score ?? 0)
      .filter((score) => score > 0);
    const aiScores = completedAi
      .filter((interview) => interview.difficulty === difficulty)
      .map((interview) => interview.overallScore ?? 0)
      .filter((score) => score > 0);
    const scores = [...manualScores, ...aiScores];

    return {
      difficulty,
      score:
        scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0,
      count: scores.length,
      color: DIFFICULTY_COLORS[difficulty],
    };
  });

  const categoryPerformance = Object.entries(
    completedManual.reduce<Record<string, { total: number; count: number }>>((accumulator, interview) => {
      const category = DOMAINS.find((domain) => domain.id === interview.domainId)?.category || 'technology';
      accumulator[category] ??= { total: 0, count: 0 };
      accumulator[category].total += interview.score ?? 0;
      accumulator[category].count += 1;
      return accumulator;
    }, {}),
  )
    .map(([category, value]) => ({
      category: CATEGORY_LABELS[category] || category,
      score: value.count > 0 ? Math.round(value.total / value.count) : 0,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  const weeklyProgress = getWeeklyProgress(completedManual, completedAi);

  const comparisonData = [
    { name: 'Manual', count: completedManual.length, color: '#6366F1' },
    { name: 'AI', count: completedAi.length, color: '#14B8A6' },
  ];

  const statCards = [
    {
      label: 'Total Interviews',
      value: totalInterviews,
      detail: `${completedManual.length} manual, ${completedAi.length} AI`,
      icon: ClipboardList,
      tone: 'from-indigo-500 to-violet-500',
    },
    {
      label: 'Average Score',
      value: `${averageScore}%`,
      detail: scoreValues.length > 0 ? 'Across completed sessions' : 'No scored sessions yet',
      icon: Target,
      tone: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Best Score',
      value: `${bestScore}%`,
      detail: bestScore > 0 ? 'Personal high score' : 'Complete a session to set it',
      icon: Trophy,
      tone: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Domains Practiced',
      value: practicedDomains,
      detail: `${DOMAINS.length} total domains available`,
      icon: BriefcaseBusiness,
      tone: 'from-sky-500 to-blue-500',
    },
    {
      label: 'AI Interviews Completed',
      value: completedAi.length,
      detail: 'Resume-based dynamic sessions',
      icon: Bot,
      tone: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Manual Interviews Completed',
      value: completedManual.length,
      detail: 'Curated question-bank sessions',
      icon: ClipboardList,
      tone: 'from-fuchsia-500 to-violet-500',
    },
    {
      label: 'Resume Analyses Done',
      value: resumes.length,
      detail: 'Uploaded and reviewed resumes',
      icon: FileSearch,
      tone: 'from-rose-500 to-pink-500',
    },
    {
      label: 'Weekly Progress',
      value: weeklyProgress.reduce((sum, day) => sum + day.total, 0),
      detail: 'Sessions completed this week',
      icon: CalendarDays,
      tone: 'from-lime-500 to-emerald-500',
    },
  ];

  const featureCards = [
    {
      title: 'Manual Mode',
      description: 'Practice curated domain-based interviews with randomized non-repeating questions.',
      action: 'Open Manual Mode',
      route: '/manual-mode',
      icon: ClipboardList,
      accent: 'from-indigo-600 to-violet-600',
    },
    {
      title: 'AI Mode',
      description: 'Upload a resume and start a dynamic Gemini-powered interview experience.',
      action: 'Open AI Mode',
      route: '/ai-mode',
      icon: Sparkles,
      accent: 'from-cyan-600 to-blue-600',
    },
    {
      title: 'Resume Analysis',
      description: 'Analyze your resume for role fit, missing skills, and practical improvements.',
      action: 'Analyze Resume',
      route: '/resume-analysis',
      icon: FileSearch,
      accent: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Leaderboard',
      description: 'Compare rankings, consistency, and interview performance across candidates.',
      action: 'View Rankings',
      route: '/leaderboard',
      icon: Medal,
      accent: 'from-amber-500 to-orange-600',
    },
  ];

  const quickActions = [
    { label: 'Start AI Interview', route: '/ai-mode', icon: Sparkles },
    { label: 'Start Manual Interview', route: '/manual-mode', icon: ClipboardList },
    { label: 'Upload Resume', route: '/resume-analysis', icon: Upload },
    { label: 'Continue Previous Session', route: allCompleted[0]?.route || '/history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </p>
              <h1 className="mt-1 max-w-3xl text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-4xl">
                Your AI-powered career preparation command center.
              </h1>
              <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:block sm:text-base">
                Track interview readiness, resume progress, practice consistency, and the next best action from one professional dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.route)}
                    className="flex min-h-[72px] min-w-0 flex-col items-start justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold leading-4 text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 sm:min-h-0 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white sm:h-9 sm:w-9">
                      <Icon className="h-4 w-4" />
                    </span>
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/80 sm:p-5"
                >
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tone} text-white shadow-sm sm:mb-4 sm:h-11 sm:w-11 sm:shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-1 break-words text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 hidden text-xs leading-5 text-slate-500 dark:text-slate-400 sm:block">{stat.detail}</p>
                </div>
              );
            })}
          </section>
        )}

        <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <LineChartIcon className="h-4 w-4 text-indigo-500" />
                  Score Progress
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last completed sessions across AI and Manual Mode.</p>
                {scoreProgress.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                    Latest score: {scoreProgress[scoreProgress.length - 1].score}% across {scoreProgress.length} recent session{scoreProgress.length === 1 ? '' : 's'}.
                  </p>
                )}
              </div>
            </div>

            {scoreProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={scoreProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} />
                  <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                    formatter={(value: number, _name, props: any) => [`${value}%`, props?.payload?.domain || 'Score']}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.mode || 'Session'}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalytics />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              AI vs Manual
            </div>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              {comparisonData.map((item) => `${item.name}: ${item.count}`).join(' | ')}
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {comparisonData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Target className="h-4 w-4 text-indigo-500" />
              Difficulty Performance
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={difficultyPerformance} layout="vertical">
                <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <YAxis dataKey="difficulty" type="category" width={92} stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Average score']}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {difficultyPerformance.map((entry) => (
                    <Cell key={entry.difficulty} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <BriefcaseBusiness className="h-4 w-4 text-indigo-500" />
              Category Performance
            </div>
            {categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} />
                  <XAxis dataKey="category" stroke="#94A3B8" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={62} />
                  <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, 'Average score']}
                  />
                  <Bar dataKey="score" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalytics />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <CalendarDays className="h-4 w-4 text-indigo-500" />
              Weekly Progress
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} />
                <XAxis dataKey="day" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                />
                <Area type="monotone" dataKey="manual" stackId="1" stroke="#6366F1" fill="#6366F1" fillOpacity={0.65} />
                <Area type="monotone" dataKey="ai" stackId="1" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.65} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Feature Access</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump into the core PrepMatrix workflows.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.title}
                    onClick={() => navigate(feature.route)}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/80 sm:p-5"
                  >
                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {feature.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                      {feature.action}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/80">
            <div className="border-b border-slate-200 p-5 dark:border-white/10">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent Activity</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest scores and resume uploads.</p>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
                >
                  View all
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {allCompleted.slice(0, 5).map((activity) => (
                <button
                  key={`${activity.mode}-${activity.id}`}
                  onClick={() => navigate(activity.route)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{activity.label}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {activity.mode} Mode - {format(new Date(activity.timestamp), 'MMM dd')}
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-800 dark:bg-white/10 dark:text-white">
                    {activity.score}%
                  </span>
                </button>
              ))}

              {resumes.slice(0, 2).map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => navigate('/resume-analysis')}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{resume.fileName}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Resume Analysis - {format(new Date(resume.uploadedAt), 'MMM dd')}
                    </p>
                  </div>
                  <FileSearch className="h-4 w-4 text-indigo-500" />
                </button>
              ))}

              {allCompleted.length === 0 && resumes.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <History className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No activity yet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Start a session or upload a resume to populate your timeline.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
