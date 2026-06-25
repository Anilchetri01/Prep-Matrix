import type { ChangeEvent } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Clock3,
  LoaderCircle,
  Mic,
  MicOff,
  Waves,
  X,
} from 'lucide-react';

import { CameraPreview, type CameraStatus } from './CameraPreview';
import type { AIInterviewAnswer, AIInterviewQuestion, AIInterviewSession } from '../types';

interface ImmersiveInterviewTheme {
  body: string;
  chip: string;
  neutralChip: string;
  outlineButton: string;
  panel: string;
  scoreChip: string;
  successChip: string;
  title: string;
}

interface ImmersiveInterviewShellProps {
  activeQuestionNumber: number;
  cameraStatus: CameraStatus;
  cameraStatusLabel: string;
  cameraStream: MediaStream | null;
  currentAnswer: string;
  currentQuestion: AIInterviewQuestion;
  elapsedTime: string;
  evaluating: boolean;
  interviewStatusSummary: string;
  interviewVoiceLabel: string;
  interviewVoiceNote: string;
  interimTranscript: string;
  isDarkMode: boolean;
  isInterviewShellVisible: boolean;
  isListening: boolean;
  isMobileCameraCollapsed: boolean;
  latestAnswer: AIInterviewAnswer | null;
  onAnswerChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onEndInterview: () => void;
  onSubmitAnswer: () => void;
  onToggleListening: () => void;
  onToggleMobileCamera: () => void;
  progress: number;
  remainingQuestions: number;
  session: AIInterviewSession;
  theme: ImmersiveInterviewTheme;
  voiceCaptureState: 'idle' | 'listening' | 'processing' | 'error';
  voiceFeedbackMessage: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function ImmersiveInterviewShell({
  activeQuestionNumber,
  cameraStatus,
  cameraStatusLabel,
  cameraStream,
  currentAnswer,
  currentQuestion,
  elapsedTime,
  evaluating,
  interviewStatusSummary,
  interviewVoiceLabel,
  interviewVoiceNote,
  interimTranscript,
  isDarkMode,
  isInterviewShellVisible,
  isListening,
  isMobileCameraCollapsed,
  latestAnswer,
  onAnswerChange,
  onEndInterview,
  onSubmitAnswer,
  onToggleListening,
  onToggleMobileCamera,
  progress,
  remainingQuestions,
  session,
  theme,
  voiceCaptureState,
  voiceFeedbackMessage,
}: ImmersiveInterviewShellProps) {
  return (
    <section
      className={cx(
        'relative min-h-screen overflow-hidden px-2 py-2 transition-all duration-500 sm:px-5 sm:py-5 lg:px-6 lg:py-6',
        isInterviewShellVisible ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0',
      )}
    >
      <div
        className={cx(
          'absolute inset-0',
          isDarkMode
            ? 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(99,102,241,0.12),transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.12),rgba(2,6,23,0))]'
            : 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(99,102,241,0.08),transparent_26%),linear-gradient(180deg,rgba(148,163,184,0.08),rgba(255,255,255,0))]',
        )}
      />

      <div
        className={cx(
          'relative mx-auto flex min-h-[calc(100svh-1rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-[24px] border backdrop-blur-2xl sm:min-h-[calc(100svh-1.5rem)] sm:rounded-[30px]',
          isDarkMode
            ? 'border-white/10 bg-slate-950/45 shadow-[0_32px_90px_rgba(2,6,23,0.45)]'
            : 'border-white/80 bg-white/74 shadow-[0_28px_80px_rgba(15,23,42,0.12)]',
        )}
      >
        <div
          className={cx(
            'border-b px-3 py-3 sm:px-6 sm:py-4 lg:px-8',
            isDarkMode ? 'border-white/8 bg-slate-950/30' : 'border-slate-200/80 bg-white/45',
          )}
        >
          <div className="relative flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className={cx('max-w-full break-words rounded-full border px-3 py-1 text-xs font-medium', theme.neutralChip)}>
                {session.analysis.domain}
              </span>
              <span className={cx('rounded-full border px-3 py-1 text-xs font-medium capitalize', theme.chip)}>
                {session.difficulty}
              </span>
              <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.neutralChip)}>
                Question {activeQuestionNumber}/{session.questions.length}
              </span>
            </div>

            <div className="hidden lg:absolute lg:left-1/2 lg:top-1/2 lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2">
              <div
                className={cx(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold',
                  isDarkMode
                    ? 'border-white/10 bg-slate-950/65 text-white'
                    : 'border-white/80 bg-white/90 text-slate-900 shadow-sm',
                )}
              >
                <Clock3 className="h-4 w-4" />
                {elapsedTime}
              </div>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-2 lg:justify-end">
              <div
                className={cx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium lg:hidden',
                  theme.scoreChip,
                )}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {elapsedTime}
              </div>

              <button
                onClick={onEndInterview}
                className={cx(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition sm:px-3.5',
                  isDarkMode
                    ? 'border-white/10 bg-white/6 text-white hover:bg-white/10'
                    : 'border-slate-200 bg-white/90 text-slate-700 hover:bg-white',
                )}
              >
                <X className="h-4 w-4" />
                End interview
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-4 lg:px-8 lg:pb-6">
          <div className="grid h-full min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(300px,0.78fr)] xl:gap-5">
            <div className="flex min-h-0 min-w-0 flex-col gap-4 xl:gap-5">
              <div className={cx(theme.panel, 'p-4 sm:p-6 lg:p-7')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.chip)}>
                    Current question
                  </span>
                  <span className={cx('max-w-full break-words rounded-full border px-3 py-1 text-xs font-medium', theme.neutralChip)}>
                    Focus: {currentQuestion.focusArea}
                  </span>
                </div>

                <h2
                  className={cx(
                    'mt-5 break-words text-xl font-semibold leading-8 sm:text-[2rem] sm:leading-[2.9rem] xl:max-w-4xl',
                    theme.title,
                  )}
                >
                  {currentQuestion.text}
                </h2>

                <div className="mt-5 flex flex-wrap gap-2">
                  {currentQuestion.expectedTraits.slice(0, 3).map((trait) => (
                    <span
                      key={trait}
                      className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.neutralChip)}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className={cx(theme.panel, 'flex flex-1 flex-col p-4 sm:p-6 lg:p-7')}>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cx('text-sm font-semibold', theme.title)}>Your answer</p>
                    <p className={cx('mt-1 break-words text-sm leading-6', theme.body)}>
                      Start speaking or type your answer.
                    </p>
                  </div>
                  <span className={cx('hidden rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex', theme.neutralChip)}>
                    {interviewStatusSummary}
                  </span>
                </div>

                <div className="relative mt-4 flex-1">
                  <textarea
                    value={currentAnswer}
                    onChange={onAnswerChange}
                    placeholder="Start speaking or type your answer..."
                    rows={12}
                    className={cx(
                      'h-full min-h-[260px] w-full resize-none rounded-[24px] border px-4 py-4 pb-24 text-sm leading-7 outline-none transition sm:min-h-[380px] sm:rounded-[28px] sm:px-5 sm:py-5',
                      isDarkMode
                        ? 'border-white/10 bg-slate-950/45 text-white placeholder:text-slate-500 focus:border-sky-400/35'
                        : 'border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:border-sky-300',
                    )}
                  />

                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 sm:inset-x-4 sm:bottom-4 sm:gap-3">
                    <div
                      className={cx(
                        'min-w-0 flex-1 rounded-2xl border px-3 py-2.5 backdrop-blur sm:px-3.5 sm:py-3',
                        isDarkMode
                          ? 'border-white/10 bg-slate-950/78'
                          : 'border-white/80 bg-white/92 shadow-sm',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cx(
                            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            voiceCaptureState === 'listening'
                              ? isDarkMode
                                ? 'bg-emerald-500/12 text-emerald-200'
                                : 'bg-emerald-50 text-emerald-700'
                              : voiceCaptureState === 'processing'
                              ? isDarkMode
                                ? 'bg-amber-500/12 text-amber-200'
                                : 'bg-amber-50 text-amber-700'
                              : voiceCaptureState === 'error'
                              ? isDarkMode
                                ? 'bg-rose-500/12 text-rose-200'
                                : 'bg-rose-50 text-rose-700'
                              : isDarkMode
                              ? 'bg-white/8 text-white/70'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          <Waves className={cx('h-4 w-4', voiceCaptureState === 'listening' && 'animate-pulse')} />
                        </span>

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className={cx('truncate text-sm font-semibold', theme.title)}>
                              {interviewVoiceLabel}
                            </p>
                            {voiceCaptureState === 'listening' && (
                              <span className="flex items-end gap-0.5 text-emerald-400">
                                <span className="h-2 w-1 rounded-full bg-current animate-pulse" />
                                <span className="h-4 w-1 rounded-full bg-current animate-pulse [animation-delay:120ms]" />
                                <span className="h-3 w-1 rounded-full bg-current animate-pulse [animation-delay:240ms]" />
                              </span>
                            )}
                          </div>
                          <p className={cx('truncate text-[13px] leading-5', theme.body)}>
                            {interimTranscript || voiceFeedbackMessage || interviewVoiceNote}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onToggleListening}
                      disabled={evaluating}
                      aria-pressed={isListening}
                      className={cx(
                        'inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-60',
                        isListening
                          ? isDarkMode
                            ? 'border-rose-400/20 bg-rose-500/10 text-rose-100'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                          : theme.outlineButton,
                      )}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? (
                        <MicOff className="h-5 w-5" />
                      ) : (
                        <Mic
                          className={cx(
                            'h-5 w-5',
                            voiceCaptureState === 'processing' && 'animate-pulse',
                          )}
                        />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.body)}>
                    Submit when your answer feels complete
                  </p>
                  <button
                    onClick={onSubmitAnswer}
                    disabled={!currentAnswer.trim() || evaluating}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.28)] transition hover:scale-[1.01] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:min-w-[240px]"
                  >
                    {evaluating ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Reviewing response...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        Submit answer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <aside className="flex min-h-0 min-w-0 flex-col gap-4">
              <button
                onClick={onToggleMobileCamera}
                className={cx(
                  'inline-flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold sm:hidden',
                  theme.outlineButton,
                )}
              >
                {isMobileCameraCollapsed ? 'Show live panel' : 'Hide live panel'}
                {isMobileCameraCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>

              <div className={cx(isMobileCameraCollapsed ? 'hidden sm:flex' : 'flex', 'min-h-0 flex-col gap-4')}>
                <div className={cx(theme.panel, 'p-4 sm:p-5')}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.body)}>
                        Live
                      </p>
                      <h3 className={cx('mt-1 break-words text-lg font-semibold', theme.title)}>
                        Interview camera
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.successChip)}>
                        <CircleDot className="mr-1 inline h-3.5 w-3.5" />
                        Live
                      </span>
                      <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.neutralChip)}>
                        {cameraStatusLabel}
                      </span>
                      <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.chip)}>
                        {interviewStatusSummary}
                      </span>
                    </div>
                  </div>

                  <CameraPreview
                    isDarkMode={isDarkMode}
                    status={cameraStatus}
                    stream={cameraStream}
                  />
                </div>

                <div className={cx(theme.panel, 'p-4 sm:p-5')}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.body)}>
                        Progress
                      </p>
                      <h3 className={cx('mt-1 text-lg font-semibold', theme.title)}>
                        Session status
                      </h3>
                    </div>

                    <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.scoreChip)}>
                      {activeQuestionNumber}/{session.questions.length}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.neutralChip)}>
                      {progress}% complete
                    </span>
                    <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.successChip)}>
                      {latestAnswer ? `Score ${latestAnswer.score}%` : 'Score pending'}
                    </span>
                    <span className={cx('rounded-full border px-3 py-1 text-xs font-medium', theme.scoreChip)}>
                      {latestAnswer
                        ? `Confidence ${latestAnswer.confidenceScore}%`
                        : 'Confidence pending'}
                    </span>
                  </div>

                  <div
                    className={cx(
                      'mt-4 h-2 overflow-hidden rounded-full',
                      isDarkMode ? 'bg-white/8' : 'bg-slate-200/80',
                    )}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.max(progress, 6)}%` }}
                    />
                  </div>

                  <p className={cx('mt-3 text-sm leading-6', theme.body)}>
                    {remainingQuestions} questions remain. Keep each response concise, specific,
                    and grounded in your experience.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
