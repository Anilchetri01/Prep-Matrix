import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Target,
  Trash2,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import type { AIInterviewAnswer, AIInterviewQuestion, AIInterviewSession } from '../modules/aiMode/types';
import { aiInterviewService } from '../modules/aiMode/services/aiInterviewService';
import { generateInterviewReportPdf } from '../modules/aiMode/utils/generateInterviewReportPdf';

function formatDuration(startedAt?: number, endedAt?: number) {
  if (!startedAt || !endedAt || endedAt <= startedAt) {
    return 'In progress';
  }

  const totalSeconds = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatPercent(value?: number) {
  return typeof value === 'number' ? `${value}%` : 'Pending';
}

type SessionHeaderProps = {
  deleting: boolean;
  downloading: boolean;
  onBack: () => void;
  onDelete: () => void;
  onDownload: () => void;
  reportReady: boolean;
  title: string;
};

const SessionHeader = memo(function SessionHeader({
  deleting,
  downloading,
  onBack,
  onDelete,
  onDownload,
  reportReady,
  title,
}: SessionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Mode
        </button>

        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Resume-based history
          </p>
          <h1 className="mt-1 text-lg font-semibold text-foreground">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Review saved questions, answers, feedback, and scores from this interview session.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onDownload}
          disabled={!reportReady || downloading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Report
        </button>

        <button
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </button>
      </div>
    </div>
  );
});

type SessionStatsProps = {
  answeredCount: number;
  confidenceScore?: number;
  createdAt?: number;
  duration: string;
  overallScore?: number;
  questionCount: number;
  resumeFileName: string;
  role: string;
  status: string;
  summary: string;
};

const SessionStats = memo(function SessionStats({
  answeredCount,
  confidenceScore,
  createdAt,
  duration,
  overallScore,
  questionCount,
  resumeFileName,
  role,
  status,
  summary,
}: SessionStatsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground">
            <BriefcaseBusiness className="h-4 w-4" />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Role</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{role}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-semibold capitalize text-foreground">{status}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground">
            <CalendarDays className="h-4 w-4" />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Created</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {createdAt ? format(new Date(createdAt), 'MMM dd, yyyy hh:mm a') : 'Unavailable'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground">
            <Clock3 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Duration</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{duration}</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Resume</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{resumeFileName}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Session stats</p>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Total questions</span>
              <span className="font-semibold text-foreground">{questionCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Answered</span>
              <span className="font-semibold text-foreground">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Overall score</span>
              <span className="font-semibold text-foreground">{overallScore ?? 'Pending'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Confidence</span>
              <span className="font-semibold text-foreground">{confidenceScore ?? 'Pending'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

type QuestionCardProps = {
  answer?: AIInterviewAnswer;
  index: number;
  isExpanded: boolean;
  onToggle: (questionId: string) => void;
  question: AIInterviewQuestion;
};

const QuestionCard = memo(function QuestionCard({
  answer,
  index,
  isExpanded,
  onToggle,
  question,
}: QuestionCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-accent px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
              Q{index + 1}
            </span>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {question.focusArea || 'General'}
            </span>
          </div>

          <h3 className="text-sm font-semibold leading-6 text-foreground">
            {question.text || 'Question text unavailable'}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-border bg-accent px-2 py-0.5 text-xs font-semibold text-foreground">
            {answer ? `Score ${formatPercent(answer.score)}` : 'No response'}
          </span>

          <button
            onClick={() => onToggle(question.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Answer</p>
            <div className="mt-2 max-h-40 overflow-y-auto pr-1">
              <p className="text-sm leading-6 text-foreground">
                {answer?.answer || 'No answer was saved for this question yet.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Feedback
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto pr-1">
                <p className="text-sm leading-6 text-foreground">
                  {answer?.feedback || 'Feedback will appear once this question has a saved response.'}
                </p>
              </div>
            </div>

            {answer && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Strengths
                  </p>
                  <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1 text-sm text-foreground">
                    {(answer.strengths?.length ?? 0) > 0 ? (
                      answer.strengths.map((item) => (
                        <p key={`${answer.questionId}-strength-${item}`}>{item}</p>
                      ))
                    ) : (
                      <p>No strengths were stored.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Improvements
                  </p>
                  <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1 text-sm text-foreground">
                    {(answer.improvements?.length ?? 0) > 0 ? (
                      answer.improvements.map((item) => (
                        <p key={`${answer.questionId}-improvement-${item}`}>{item}</p>
                      ))
                    ) : (
                      <p>No improvement notes were stored.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
});

type QuestionsSectionProps = {
  answersByQuestionId: Map<string, AIInterviewAnswer>;
  expandedQuestions: Record<string, boolean>;
  onToggle: (questionId: string) => void;
  questions: AIInterviewQuestion[];
};

const QuestionsSection = memo(function QuestionsSection({
  answersByQuestionId,
  expandedQuestions,
  onToggle,
  questions,
}: QuestionsSectionProps) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Question log</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Saved questions and responses</h2>
        </div>
        <div className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {questions.length} questions
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="mt-3 rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
          No data available. This session was saved, but no interview questions were found.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              answer={answersByQuestionId.get(question.id)}
              index={index}
              isExpanded={Boolean(expandedQuestions[question.id])}
              onToggle={onToggle}
              question={question}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export function AIInterviewSessionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const [session, setSession] = useState<AIInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    mountedRef.current = true;

    const loadSession = async () => {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
        setSession(null);
      }

      if (!id) {
        if (mountedRef.current) {
          setError('Missing interview id.');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await aiInterviewService.getSession(id);
        if (!mountedRef.current) return;
        setSession(data);
      } catch (loadError: any) {
        if (mountedRef.current) {
          setError(loadError?.message || 'Unable to load this interview.');
          toast.error(loadError?.message || 'Unable to load this interview.');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      mountedRef.current = false;
    };
  }, [id]);

  const answersByQuestionId = useMemo(
    () =>
      new Map(
        (session?.answers || []).map((answer) => [answer.questionId, answer] as const),
      ),
    [session?.answers],
  );
  const candidateName = user?.name?.trim() || 'Candidate';
  const questions = session?.questions ?? [];
  const answers = session?.answers ?? [];
  const analysis = session?.analysis;
  const reportReady = Boolean(session && !loading && questions.length > 0);

  const handleBack = useCallback(() => {
    navigate('/ai-mode');
  }, [navigate]);

  const toggleQuestion = useCallback((questionId: string) => {
    setExpandedQuestions((previousState) => ({
      ...previousState,
      [questionId]: !previousState[questionId],
    }));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!session) {
      return;
    }

    if (!window.confirm('Delete this resume-based interview? This also removes the uploaded resume.')) {
      return;
    }

    setDeleting(true);

    try {
      await aiInterviewService.deleteSession(session.id);
      toast.success('Interview deleted.');
      navigate('/ai-mode');
    } catch (deleteError: any) {
      toast.error(deleteError?.message || 'Unable to delete this interview.');
    } finally {
      if (mountedRef.current) {
        setDeleting(false);
      }
    }
  }, [navigate, session]);

  const handleDownload = useCallback(async () => {
    if (!reportReady || !session) {
      toast.error('Interview data is still loading or incomplete. Please try again in a moment.');
      return;
    }

    setDownloading(true);

    try {
      await generateInterviewReportPdf({
        candidateName,
        session,
      });
      toast.success('Interview report downloaded.');
    } catch (downloadError: any) {
      console.error('[AIInterviewSessionDetailPage] downloadReport:error', downloadError);
      toast.error(downloadError?.message || 'Unable to generate the interview report.');
    } finally {
      if (mountedRef.current) {
        setDownloading(false);
      }
    }
  }, [candidateName, reportReady, session]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-5 lg:px-6">
        <div className="rounded-[24px] border border-border bg-card p-3 shadow-sm">
          <SessionHeader
            deleting={deleting}
            downloading={downloading}
            onBack={handleBack}
            onDelete={handleDelete}
            onDownload={handleDownload}
            reportReady={reportReady}
            title={analysis?.domain || 'Interview details'}
          />

          {loading ? (
            <div className="py-16">
              <LoadingSpinner message="Loading interview details..." />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">Something went wrong</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {error || 'Unable to load the interview details right now.'}
              </p>
              <button
                onClick={handleBack}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Return to AI Mode
              </button>
            </div>
          ) : !session ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">Interview not found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This session may have been deleted, or the required history data is missing.
              </p>
              <button
                onClick={handleBack}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Return to AI Mode
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-3">
              <SessionStats
                answeredCount={answers.length}
                confidenceScore={session.confidenceScore}
                createdAt={session.createdAt}
                duration={formatDuration(session.startedAt, session.endedAt)}
                overallScore={session.overallScore}
                questionCount={session.questionCount ?? questions.length}
                resumeFileName={session.resumeFileName || 'Resume file unavailable'}
                role={analysis?.domain || 'General'}
                status={session.status === 'in-progress' ? 'Ongoing' : session.status || 'Unknown'}
                summary={analysis?.summary || 'No stored resume summary was found for this session.'}
              />

              <QuestionsSection
                answersByQuestionId={answersByQuestionId}
                expandedQuestions={expandedQuestions}
                onToggle={toggleQuestion}
                questions={questions}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AIInterviewSessionDetailPage;
