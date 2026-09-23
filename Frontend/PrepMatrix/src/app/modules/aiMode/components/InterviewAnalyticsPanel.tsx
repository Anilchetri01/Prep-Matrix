import {
  Activity,
  BarChart3,
  CircleHelp,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { InterviewAreaAnalytics, InterviewSessionAnalytics } from '../utils/interviewAnalytics';

function formatMetric(value: number | null) {
  return value === null ? 'Pending' : `${value}%`;
}

function AreaList({
  emptyLabel,
  icon: Icon,
  items,
  title,
}: {
  emptyLabel: string;
  icon: typeof TrendingUp;
  items: InterviewAreaAnalytics[];
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-sky-200" />
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>

      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={`${title}-${item.area}`}
              className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{item.area}</p>
                <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                  {item.answeredCount} answered
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-300/75">
                <span>Score {formatMetric(item.averageScore)}</span>
                <span>Confidence {formatMetric(item.averageConfidence)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-5 text-sm text-slate-300/75">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function InterviewAnalyticsPanel({
  analytics,
}: {
  analytics: InterviewSessionAnalytics;
}) {
  return (
    <section className="space-y-5 rounded-[24px] border border-white/10 bg-slate-950/45 p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Performance analytics</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Session insights dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/80">
            Review the overall outcome, area-level strengths, and how performance changed from one
            answer to the next.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85">
          Completion {analytics.completionRate}%
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[#6D5EF9] transition-[width] duration-500"
          style={{ width: `${analytics.completionRate}%` }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-100">
            <Target className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">Overall score</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatMetric(analytics.overallScore)}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-100">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">Confidence avg</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatMetric(analytics.averageConfidence)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-100">
            <Activity className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">Questions answered</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {analytics.answeredCount}/{analytics.totalQuestions}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-400/10 text-fuchsia-100">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">Completion</p>
          <p className="mt-2 text-2xl font-semibold text-white">{analytics.completionRate}%</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-200" />
            <p className="text-sm font-semibold text-white">Progress chart</p>
          </div>

          {analytics.progress.some((point) => point.answered) ? (
            <div className="mt-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.progress}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2, 6, 23, 0.94)',
                      border: '1px solid rgba(148, 163, 184, 0.16)',
                      borderRadius: 16,
                      color: '#ffffff',
                    }}
                    formatter={(value: number | null, name: string) => [
                      value === null ? 'Pending' : `${value}%`,
                      name === 'score' ? 'Score' : 'Confidence',
                    ]}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ fill: '#38bdf8', r: 4 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#818cf8"
                    strokeWidth={3}
                    dot={{ fill: '#818cf8', r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-10 text-center text-sm text-slate-300/75">
              No responses are saved yet, so the progress chart will appear after the first scored
              answer.
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <AreaList
            title="Strong areas"
            icon={TrendingUp}
            items={analytics.strongAreas}
            emptyLabel="No strong areas are visible yet. Finish more questions to build a reliable trend."
          />
          <AreaList
            title="Weak areas"
            icon={TrendingDown}
            items={analytics.weakAreas}
            emptyLabel="No weak areas are visible yet. Once scores spread out, lower-performing topics will show here."
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300/80">
        <div className="flex items-start gap-2">
          <CircleHelp className="mt-0.5 h-4 w-4 text-slate-300/75" />
          <p>
            Area analytics are computed from each question&apos;s focus area and stored tags, so
            the dashboard stays in sync with the question set that Gemini generated for this
            interview.
          </p>
        </div>
      </div>
    </section>
  );
}
