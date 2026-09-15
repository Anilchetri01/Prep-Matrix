import { BrainCircuit, Gauge, MessageSquareQuote, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import type { AIInterviewSession } from '../types';

interface SessionSummaryProps {
  session: AIInterviewSession;
  isDarkMode: boolean;
}

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function SessionSummary({ session, isDarkMode }: SessionSummaryProps) {
  const score = session.overallScore ?? getAverage(session.answers.map((answer) => answer.score));
  const confidence =
    session.confidenceScore ??
    getAverage(session.answers.map((answer) => answer.confidenceScore));
  const metrics = [
    {
      icon: Gauge,
      label: 'Overall Score',
      value: `${score}%`,
      iconClass: isDarkMode
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      icon: BrainCircuit,
      label: 'Confidence Score',
      value: `${confidence}%`,
      iconClass: isDarkMode
        ? 'bg-[#EEECFF]/10 text-[#8E82FA] border border-[#6D5EF9]/20'
        : 'bg-[#EEECFF] text-[#6D5EF9] border border-[#6D5EF9]/20',
    },
    {
      icon: Sparkles,
      label: 'Resume Domain',
      value: session.analysis.domain,
      iconClass: isDarkMode
        ? 'border border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE]'
        : 'border border-[#22D3EE]/40 bg-[#22D3EE]/10 text-cyan-800',
    },
  ];

  const metricCardClass = isDarkMode
    ? 'border-[#263449] bg-[#101827] text-white shadow-sm'
    : 'border-[#DDE3EC] bg-white text-slate-900 shadow-sm';

  const panelClass = isDarkMode
    ? 'border-[#263449] bg-[#101827] text-white shadow-sm'
    : 'border-[#DDE3EC] bg-white text-slate-900 shadow-sm';

  const mutedTextClass = isDarkMode ? 'text-[#AAB7CA]' : 'text-[#5F6F84]';
  const accentChipClass = isDarkMode
    ? 'border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE]'
    : 'border-[#22D3EE]/40 bg-[#22D3EE]/10 text-cyan-800';

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={`min-w-0 rounded-[14px] border p-3.5 backdrop-blur-xl sm:p-4 ${metricCardClass}`}>
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconClass}`}>
              <metric.icon className="h-5 w-5" />
            </div>
            <p className={`break-words text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] ${mutedTextClass}`}>
              {metric.label}
            </p>
            <p className="mt-1.5 break-words text-xl font-semibold sm:text-2xl">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className={`min-w-0 rounded-[14px] border p-4 backdrop-blur-xl sm:p-5 ${panelClass}`}>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold sm:text-xl">Session Breakdown</h3>
            <p className={`break-all text-sm sm:break-words ${mutedTextClass}`}>
              {session.resumeFileName} / {format(new Date(session.createdAt), 'MMM dd, yyyy hh:mm a')}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            {session.analysis.skills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className={`max-w-full break-words rounded-full border px-3 py-1 text-xs font-medium ${accentChipClass}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {session.answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className={`min-w-0 rounded-[14px] border p-3.5 sm:p-4 ${
                isDarkMode
                  ? 'border-white/8 bg-slate-950/35'
                  : 'border-[#DDE3EC] bg-slate-50/85'
              }`}
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white/70'
                        : 'border-[#DDE3EC] bg-white text-slate-600'
                    }`}
                  >
                    <MessageSquareQuote className="h-3.5 w-3.5" />
                    Question {index + 1}
                  </div>
                  <h4 className="break-words text-base font-semibold">{answer.questionText}</h4>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isDarkMode
                        ? 'bg-emerald-400/10 text-emerald-200'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Score {answer.score}%
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isDarkMode
                        ? 'bg-indigo-400/10 text-indigo-200'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    Confidence {answer.confidenceScore}%
                  </span>
                </div>
              </div>

              <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div
                  className={`min-w-0 rounded-[14px] border p-3.5 sm:p-4 ${
                    isDarkMode
                      ? 'border-white/8 bg-white/5'
                      : 'border-[#DDE3EC] bg-white/90'
                  }`}
                >
                  <p className={`text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] ${mutedTextClass}`}>Answer</p>
                  <p className="mt-2 break-words text-sm leading-6">{answer.answer}</p>
                </div>

                <div className="min-w-0 space-y-3">
                  <div
                    className={`min-w-0 rounded-[14px] border p-3.5 sm:p-4 ${
                      isDarkMode
                        ? 'border-white/8 bg-white/5'
                        : 'border-[#DDE3EC] bg-white/90'
                    }`}
                  >
                    <p className={`text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] ${mutedTextClass}`}>
                      Feedback
                    </p>
                    <p className="mt-2 break-words text-sm leading-6">{answer.feedback}</p>
                  </div>

                  <div className="grid min-w-0 gap-3 md:grid-cols-2">
                    <div
                      className={`min-w-0 rounded-[14px] border p-3.5 sm:p-4 ${
                        isDarkMode
                          ? 'border-emerald-400/12 bg-emerald-500/8'
                          : 'border-emerald-100 bg-emerald-50'
                      }`}
                    >
                      <p
                        className={`text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] ${
                          isDarkMode ? 'text-emerald-100/70' : 'text-emerald-700/80'
                        }`}
                      >
                        Strengths
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {answer.strengths.map((strength) => (
                          <p
                            key={strength}
                            className={`break-words text-sm ${isDarkMode ? 'text-emerald-50/85' : 'text-emerald-800'}`}
                          >
                            {strength}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`min-w-0 rounded-[14px] border p-3.5 sm:p-4 ${
                        isDarkMode
                          ? 'border-amber-400/12 bg-amber-500/8'
                          : 'border-amber-100 bg-amber-50'
                      }`}
                    >
                      <p
                        className={`text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] ${
                          isDarkMode ? 'text-amber-100/70' : 'text-amber-700/80'
                        }`}
                      >
                        Improvements
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {answer.improvements.map((item) => (
                          <p
                            key={item}
                            className={`break-words text-sm ${isDarkMode ? 'text-amber-50/85' : 'text-amber-800'}`}
                          >
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
