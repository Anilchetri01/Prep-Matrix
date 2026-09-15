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
  beginner: '#34D399',
  intermediate: '#6D5EF9',
  advanced: '#8174FF',
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

function EmptyAnalytics({ actionText = "Start an interview", onAction }: { actionText?: string; onAction?: () => void }) {
  return (
    <div className="flex h-[175px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#DDE3EC] bg-[#F7F8FC] p-4 text-center dark:border-[#263449] dark:bg-[#172235]/40">
      <BarChart3 className="h-6 w-6 text-[#7F8CA0] dark:text-[#718096]" />
      <p className="mt-2 font-display text-xs font-bold text-[#142033] dark:text-[#F4F7FB]">Analytics will appear after practice</p>
      <p className="mt-0.5 max-w-xs text-[11px] text-[#5F6F84] dark:text-[#AAB7CA]">
        Complete an AI or manual session to see performance analytics and score trends.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#EEECFF] px-2.5 py-1 text-xs font-semibold text-[#5B4BE7] transition hover:bg-[#5B4BE7] hover:text-white dark:bg-[#1D1B49] dark:text-[#8174FF] dark:hover:bg-[#6D5EF9] dark:hover:text-white"
        >
          {actionText}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
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
    { name: 'Manual', count: completedManual.length, color: '#6D5EF9' },
    { name: 'AI', count: completedAi.length, color: '#22D3EE' },
  ];

  const statCards = [
    {
      label: 'Total Interviews',
      value: totalInterviews,
      detail: `${completedManual.length} manual, ${completedAi.length} AI`,
      icon: ClipboardList,
      iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      label: 'Average Score',
      value: `${averageScore}%`,
      detail: scoreValues.length > 0 ? 'Across completed sessions' : 'No scored sessions yet',
      icon: Target,
      iconClass: averageScore >= 75
        ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399]'
        : averageScore >= 50
        ? 'bg-amber-50 text-[#B45309] dark:bg-amber-950/40 dark:text-[#FBBF24]'
        : 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      label: 'Best Score',
      value: `${bestScore}%`,
      detail: bestScore > 0 ? 'Personal high score' : 'Complete a session to set it',
      icon: Trophy,
      iconClass: bestScore >= 75
        ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399]'
        : 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      label: 'Domains Practiced',
      value: practicedDomains,
      detail: `${DOMAINS.length} total domains available`,
      icon: BriefcaseBusiness,
      iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      label: 'AI Interviews Completed',
      value: completedAi.length,
      detail: 'Resume-based dynamic sessions',
      icon: Bot,
      iconClass: 'bg-cyan-50 text-[#0891B2] dark:bg-cyan-950/40 dark:text-[#22D3EE]',
    },
    {
      label: 'Manual Interviews Completed',
      value: completedManual.length,
      detail: 'Curated question-bank sessions',
      icon: ClipboardList,
      iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      label: 'Resume Analyses Done',
      value: resumes.length,
      detail: 'Uploaded and reviewed resumes',
      icon: FileSearch,
      iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      label: 'Weekly Progress',
      value: weeklyProgress.reduce((sum, day) => sum + day.total, 0),
      detail: 'Sessions completed this week',
      icon: CalendarDays,
      iconClass: weeklyProgress.reduce((sum, day) => sum + day.total, 0) > 0
        ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399]'
        : 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#142033] dark:bg-[#070B14] dark:text-[#F4F7FB]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-[14px] border border-[#DDE3EC] bg-white p-5 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#6D5EF9]/[0.07] blur-3xl dark:bg-[#6D5EF9]/[0.10]"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.10em] text-[#5B4BE7] dark:text-[#8174FF]">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#142033] dark:text-[#F4F7FB] sm:mt-1.5 sm:text-[32px] sm:leading-[40px]">
                Your career preparation command center.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA] sm:text-[15px]">
                Track interview readiness, practice consistency, and resume progress from one focused dashboard.
              </p>

              {/* Smaller quick-actions row per report recommendation */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                <span className="font-medium text-[#7F8CA0] dark:text-[#718096]">Quick links:</span>
                <button
                  onClick={() => navigate('/resume-analysis')}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition hover:bg-[#F1F4F8] hover:text-[#142033] dark:hover:bg-[#172235] dark:hover:text-[#F4F7FB]"
                >
                  <Upload className="h-3.5 w-3.5 text-[#5B4BE7] dark:text-[#8174FF]" />
                  <span>Resume Analysis</span>
                </button>
                <span className="text-[#DDE3EC] dark:text-[#263449]">·</span>
                <button
                  onClick={() => navigate(allCompleted[0]?.route || '/history')}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition hover:bg-[#F1F4F8] hover:text-[#142033] dark:hover:bg-[#172235] dark:hover:text-[#F4F7FB]"
                >
                  <History className="h-3.5 w-3.5 text-[#5B4BE7] dark:text-[#8174FF]" />
                  <span>Previous sessions</span>
                </button>
              </div>
            </div>

            {/* CTA Hierarchy: Primary = Start AI, Secondary = Start Manual */}
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:min-w-[220px]">
              <button
                onClick={() => navigate('/ai-mode')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6D5EF9] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8174FF] active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-[#22D3EE]" />
                <span>Start AI interview</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/manual-mode')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DDE3EC] bg-[#F1F4F8] px-5 text-sm font-semibold text-[#142033] transition hover:border-[#8174FF]/40 hover:bg-white dark:border-[#263449] dark:bg-[#172235] dark:text-[#F4F7FB] dark:hover:bg-[#172235]/80 active:scale-[0.98]"
              >
                <ClipboardList className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                <span>Start manual interview</span>
              </button>
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
                  className="min-w-0 rounded-[14px] border border-[#DDE3EC] bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#263449] dark:bg-[#101827] sm:p-5"
                >
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${stat.iconClass} sm:mb-4 sm:h-10 sm:w-10`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">{stat.label}</p>
                  <p className="mt-1 font-display break-words text-xl font-bold text-[#142033] dark:text-[#F4F7FB] sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 hidden text-xs leading-5 text-[#7F8CA0] dark:text-[#718096] sm:block">{stat.detail}</p>
                </div>
              );
            })}
          </section>
        )}

        <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
                  <LineChartIcon className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                  Score Progress
                </div>
                <p className="mt-1 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Last completed sessions across AI and Manual Mode.</p>
                {scoreProgress.length > 0 && (
                  <p className="mt-1.5 text-xs font-semibold text-[#5B4BE7] dark:text-[#8174FF]">
                    Latest score: {scoreProgress[scoreProgress.length - 1].score}% across {scoreProgress.length} recent session{scoreProgress.length === 1 ? '' : 's'}.
                  </p>
                )}
              </div>
            </div>

            {scoreProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={scoreProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263449" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#718096" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} stroke="#718096" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101827', border: '1px solid #263449', borderRadius: 10, color: '#F4F7FB' }}
                    formatter={(value: number, _name, props: any) => [`${value}%`, props?.payload?.domain || 'Score']}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.mode || 'Session'}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6D5EF9" strokeWidth={2.5} dot={{ r: 4, fill: '#6D5EF9' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalytics onAction={() => navigate('/manual-mode')} />
            )}
          </div>

          <div className="rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5">
            <div className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
              <BarChart3 className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
              AI vs Manual
            </div>
            <p className="mb-2 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
              {comparisonData.map((item) => `${item.name}: ${item.count}`).join(' | ')}
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" opacity={0.3} />
                <XAxis dataKey="name" stroke="#718096" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#718096" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101827', border: '1px solid #263449', borderRadius: 10, color: '#F4F7FB' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {comparisonData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5">
            <div className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
              <Target className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
              Difficulty Performance
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={difficultyPerformance} layout="vertical">
                <XAxis type="number" domain={[0, 100]} stroke="#718096" tick={{ fontSize: 12 }} />
                <YAxis dataKey="difficulty" type="category" width={92} stroke="#718096" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101827', border: '1px solid #263449', borderRadius: 10, color: '#F4F7FB' }}
                  formatter={(value: number) => [`${value}%`, 'Average score']}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {difficultyPerformance.map((entry) => (
                    <Cell key={entry.difficulty} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5">
            <div className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
              <BriefcaseBusiness className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
              Category Performance
            </div>
            {categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263449" opacity={0.3} />
                  <XAxis dataKey="category" stroke="#718096" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={62} />
                  <YAxis domain={[0, 100]} stroke="#718096" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101827', border: '1px solid #263449', borderRadius: 10, color: '#F4F7FB' }}
                    formatter={(value: number) => [`${value}%`, 'Average score']}
                  />
                  <Bar dataKey="score" fill="#6D5EF9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalytics onAction={() => navigate('/manual-mode')} />
            )}
          </div>

          <div className="rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5">
            <div className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
              <CalendarDays className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
              Weekly Progress
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" opacity={0.3} />
                <XAxis dataKey="day" stroke="#718096" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#718096" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101827', border: '1px solid #263449', borderRadius: 10, color: '#F4F7FB' }}
                />
                <Area type="monotone" dataKey="manual" stackId="1" stroke="#6D5EF9" fill="#6D5EF9" fillOpacity={0.6} />
                <Area type="monotone" dataKey="ai" stackId="1" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-[#142033] dark:text-[#F4F7FB]">Feature Access</h2>
                <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Jump into the core PrepMatrix workflows.</p>
              </div>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {[
                {
                  title: 'Manual Mode',
                  description: 'Practice curated domain-based interviews with randomized non-repeating questions.',
                  action: 'Open Manual Mode',
                  route: '/manual-mode',
                  icon: ClipboardList,
                  iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
                },
                {
                  title: 'AI Mode',
                  description: 'Upload a resume and start a dynamic Gemini-powered interview experience.',
                  action: 'Open AI Mode',
                  route: '/ai-mode',
                  icon: Sparkles,
                  iconClass: 'bg-cyan-50 text-[#0891B2] dark:bg-cyan-950/40 dark:text-[#22D3EE]',
                },
                {
                  title: 'Resume Analysis',
                  description: 'Analyze your resume for role fit, missing skills, and practical improvements.',
                  action: 'Analyze Resume',
                  route: '/resume-analysis',
                  icon: FileSearch,
                  iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
                },
                {
                  title: 'Leaderboard',
                  description: 'Compare rankings, consistency, and interview performance across candidates.',
                  action: 'View Rankings',
                  route: '/leaderboard',
                  icon: Medal,
                  iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.title}
                    onClick={() => navigate(feature.route)}
                    className="group rounded-[14px] border border-[#DDE3EC] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#8174FF]/40 hover:shadow-md dark:border-[#263449] dark:bg-[#101827] sm:p-5"
                  >
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${feature.iconClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-base font-bold text-[#142033] dark:text-[#F4F7FB]">{feature.title}</h3>
                    <p className="mt-1.5 min-h-[44px] text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">
                      {feature.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4BE7] transition group-hover:translate-x-0.5 dark:text-[#8174FF]">
                      {feature.action}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-[14px] border border-[#DDE3EC] bg-white shadow-sm dark:border-[#263449] dark:bg-[#101827]">
            <div className="border-b border-[#DDE3EC] p-4.5 dark:border-[#263449]">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-bold text-[#142033] dark:text-[#F4F7FB]">Recent Activity</h2>
                  <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Latest scores and resume uploads.</p>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs font-semibold text-[#5B4BE7] hover:underline dark:text-[#8174FF]"
                >
                  View all
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#DDE3EC] dark:divide-[#263449]">
              {allCompleted.slice(0, 5).map((activity) => (
                <button
                  key={`${activity.mode}-${activity.id}`}
                  onClick={() => navigate(activity.route)}
                  className="flex w-full items-center justify-between gap-4 px-4.5 py-3.5 text-left transition hover:bg-[#F1F4F8] dark:hover:bg-[#172235]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#142033] dark:text-[#F4F7FB]">{activity.label}</p>
                    <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                      {activity.mode} Mode · {format(new Date(activity.timestamp), 'MMM dd')}
                    </p>
                  </div>
                  <span className="rounded-md bg-[#EEECFF] px-2.5 py-1 text-xs font-bold text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                    {activity.score}%
                  </span>
                </button>
              ))}

              {resumes.slice(0, 2).map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => navigate('/resume-analysis')}
                  className="flex w-full items-center justify-between gap-4 px-4.5 py-3.5 text-left transition hover:bg-[#F1F4F8] dark:hover:bg-[#172235]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#142033] dark:text-[#F4F7FB]">{resume.fileName}</p>
                    <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                      Resume Analysis · {format(new Date(resume.uploadedAt), 'MMM dd')}
                    </p>
                  </div>
                  <FileSearch className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                </button>
              ))}

              {allCompleted.length === 0 && resumes.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <History className="mx-auto h-7 w-7 text-[#7F8CA0] dark:text-[#718096]" />
                  <p className="mt-2 text-xs font-semibold text-[#142033] dark:text-[#F4F7FB]">No activity yet</p>
                  <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
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
