import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  BrainCircuit,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Clock3,
  FileUp,
  Gauge,
  LoaderCircle,
  Mic,
  MicOff,
  Play,
  RefreshCcw,
  ScanSearch,
  Sparkles,
  Trash2,
  Upload,
  Waves,
  X,
} from 'lucide-react';

import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { InterviewLaunchOverlay } from '../../components/InterviewLaunchOverlay';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { type DifficultyLevel } from '../../data/questions';
import { speechToText, textToSpeech } from '../../utils/speech';
import { CameraPreview, type CameraStatus } from './components/CameraPreview';
import { ImmersiveInterviewShell } from './components/ImmersiveInterviewShell';
import { SessionSummary } from './components/SessionSummary';
import { aiInterviewService } from './services/aiInterviewService';
import {
  evaluateInterviewAnswer,
  generateResumeInterview,
} from './services/geminiClient';
import type { AIInterviewAnswer, AIInterviewSession } from './types';
import { extractResumeText } from './utils/resumeTextExtractor';

type Phase = 'setup' | 'ready' | 'interview' | 'complete';
type VoiceCaptureState = 'idle' | 'listening' | 'processing' | 'error';
type InterviewTransitionState = 'idle' | 'loading' | 'revealing';
type AIInterviewPageNavigationState = {
  restoredSessionId?: string;
  restoreToast?: string;
  restoreToken?: string;
};

const QUESTION_OPTIONS = [5, 7, 10, 12];
const DIFFICULTY_OPTIONS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
const INTERVIEW_ENTRY_MIN_DURATION_MS = 1400;
const INTERVIEW_REVEAL_DURATION_MS = 420;
const PREPARE_INTERVIEW_TOAST_ID = 'ai-interview-prepare';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function mergeResponseSegments(...segments: string[]) {
  return segments
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.max(totalSeconds % 60, 0)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getMicErrorMessage(error: string) {
  if (error === 'no-speech') {
    return 'No voice detected. Please try again and speak clearly after clicking the mic.';
  }

  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'Microphone permission denied. Please allow microphone access and try again.';
  }

  if (error === 'audio-capture') {
    return 'No microphone found. Please check your microphone and try again.';
  }

  if (error === 'network') {
    return 'Voice input hit a network issue. Please try again.';
  }

  if (error === 'aborted') {
    return 'Voice input was interrupted. Please try again.';
  }

  return 'Voice input could not be started.';
}

function mapSessionToPhase(session: AIInterviewSession | null): Phase {
  if (!session) return 'setup';
  if (session.status === 'completed') return 'complete';
  if (session.status === 'in-progress') return 'interview';
  return 'ready';
}

function formatStatus(status: AIInterviewSession['status']) {
  return status === 'in-progress' ? 'In progress' : status === 'completed' ? 'Completed' : 'Ready';
}

function formatCameraStatus(status: CameraStatus) {
  if (status === 'live') return 'Active';
  if (status === 'requesting') return 'Requesting access';
  if (status === 'denied') return 'Blocked';
  if (status === 'error') return 'Unavailable';
  return 'Ready';
}

export function AIInterviewPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPromptedQuestionRef = useRef('');
  const mountedRef = useRef(true);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const interviewEntryDelayRef = useRef<number | null>(null);
  const interviewRevealTimeoutRef = useRef<number | null>(null);
  const prepareRequestLockRef = useRef(false);
  const restoreRequestRef = useRef('');
  const voiceAnswerBaseRef = useRef('');
  const voiceCommittedTranscriptRef = useRef('');
  const voiceInterimTranscriptRef = useRef('');

  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionCount, setQuestionCount] = useState(7);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentSessions, setRecentSessions] = useState<AIInterviewSession[]>([]);
  const [session, setSession] = useState<AIInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingSessions, setRefreshingSessions] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [voiceCaptureState, setVoiceCaptureState] = useState<VoiceCaptureState>('idle');
  const [voiceFeedbackMessage, setVoiceFeedbackMessage] = useState('');
  const [interviewTransitionState, setInterviewTransitionState] =
    useState<InterviewTransitionState>('idle');
  const [isInterviewShellVisible, setIsInterviewShellVisible] = useState(false);
  const [showEndInterviewConfirm, setShowEndInterviewConfirm] = useState(false);
  const [isMobileCameraCollapsed, setIsMobileCameraCollapsed] = useState(true);
  const [interviewViewStartedAt, setInterviewViewStartedAt] = useState<number | null>(null);
  const [elapsedInterviewSeconds, setElapsedInterviewSeconds] = useState(0);

  const isDarkMode = settings.darkMode;

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    return session.questions[session.currentQuestionIndex] || null;
  }, [session]);

  const progress = session
    ? Math.round((session.answers.length / Math.max(session.questionCount, 1)) * 100)
    : 0;
  const latestAnswer = session?.answers[session.answers.length - 1] ?? null;
  const answeredCount = session?.answers.length ?? 0;
  const isImmersiveInterviewMode =
    phase === 'interview' || interviewTransitionState !== 'idle';
  const formattedInterviewTime = formatElapsedTime(elapsedInterviewSeconds);
  const activeQuestionNumber = session ? session.currentQuestionIndex + 1 : 0;
  const remainingQuestions = session
    ? Math.max(session.questions.length - answeredCount, 0)
    : 0;
  const selectedResumeLabel = selectedFile?.name || session?.resumeFileName || '';
  const voiceStatusLabel = isListening
    ? 'Capturing your response'
    : isSpeaking
    ? 'Reading the prompt'
    : settings.voiceEnabled
    ? 'Ready for voice guidance'
    : 'Voice guidance is off';
  const voiceStatusNote = isListening
    ? 'Your spoken answer will appear in the response field.'
    : isSpeaking
    ? 'Question audio is active for the current prompt.'
    : settings.voiceEnabled
    ? 'Question prompts can be read aloud when the interview begins.'
    : 'Use the navbar toggle any time you want spoken prompts.';
  const interviewVoiceLabel =
    voiceCaptureState === 'listening'
      ? 'Listening...'
      : voiceCaptureState === 'processing'
      ? 'Processing...'
      : voiceCaptureState === 'error'
      ? 'Try again'
      : settings.voiceEnabled
      ? 'Voice ready'
      : 'Voice off';
  const interviewVoiceNote =
    voiceCaptureState === 'listening'
      ? interimTranscript
        ? 'Live transcription is updating while you speak.'
        : 'Keep speaking. Your answer is being captured in real time.'
      : voiceCaptureState === 'processing'
      ? 'Finalizing the latest speech segment.'
      : voiceCaptureState === 'error'
      ? voiceFeedbackMessage || 'Check microphone access and try once more.'
      : settings.voiceEnabled
      ? 'Tap the microphone to answer without leaving the editor.'
      : 'Enable voice prompts in the navbar if you want spoken guidance.';
  const interviewStatusSummary = isListening
    ? 'Mic active'
    : voiceCaptureState === 'processing'
    ? 'Processing voice'
    : settings.voiceEnabled
    ? 'Mic ready'
    : 'Mic off';

  const theme = useMemo(
    () => ({
      page: isDarkMode
        ? 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white'
        : 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900',
      pageOverlay: isDarkMode
        ? 'absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_88%_0%,rgba(99,102,241,0.16),transparent_26%),radial-gradient(circle_at_50%_85%,rgba(14,165,233,0.12),transparent_28%)]'
        : 'absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(14,165,233,0.10),transparent_24%),radial-gradient(circle_at_85%_4%,rgba(99,102,241,0.10),transparent_24%),radial-gradient(circle_at_50%_90%,rgba(148,163,184,0.08),transparent_28%)]',
      section:
        isDarkMode
          ? 'min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_24px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl'
          : 'min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white/78 shadow-[0_20px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl',
      panel:
        isDarkMode
          ? 'min-w-0 max-w-full rounded-2xl border border-white/8 bg-slate-950/40 shadow-lg shadow-slate-950/15'
          : 'min-w-0 max-w-full rounded-2xl border border-slate-200/80 bg-slate-50/90 shadow-sm',
      surface:
        isDarkMode
          ? 'min-w-0 max-w-full rounded-2xl border border-white/8 bg-white/5'
          : 'min-w-0 max-w-full rounded-2xl border border-slate-200/80 bg-white/90',
      title: isDarkMode ? 'text-white' : 'text-slate-900',
      body: isDarkMode ? 'text-slate-300/80' : 'text-slate-600',
      muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
      subtle: isDarkMode ? 'text-slate-300/75' : 'text-slate-700',
      outlineButton: isDarkMode
        ? 'border-white/10 bg-white/6 text-white hover:bg-white/10'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      chip: isDarkMode
        ? 'border-sky-400/20 bg-sky-400/10 text-sky-100'
        : 'border-sky-200 bg-sky-50 text-sky-700',
      neutralChip: isDarkMode
        ? 'border-white/10 bg-white/6 text-white/70'
        : 'border-slate-200 bg-white text-slate-600',
      successChip: isDarkMode
        ? 'bg-emerald-400/10 text-emerald-200'
        : 'bg-emerald-50 text-emerald-700',
      scoreChip: isDarkMode
        ? 'bg-indigo-400/10 text-indigo-200'
        : 'bg-indigo-50 text-indigo-700',
      featureCard:
        isDarkMode
          ? 'flex h-full min-h-[132px] min-w-0 max-w-full flex-col items-start rounded-2xl border border-white/10 bg-white/6 p-3.5 sm:min-h-[150px] sm:p-4'
          : 'flex h-full min-h-[132px] min-w-0 max-w-full flex-col items-start rounded-2xl border border-slate-200/80 bg-white/88 p-3.5 sm:min-h-[150px] sm:p-4',
    }),
    [isDarkMode],
  );

  const heroHighlights = [
    {
      icon: ScanSearch,
      label: 'Smart analysis',
      value: 'Resume details are turned into focused, role-relevant questions.',
    },
    {
      icon: Camera,
      label: 'Live practice',
      value: 'Camera and voice support create a more natural interview flow.',
    },
    {
      icon: Gauge,
      label: 'Performance insights',
      value: 'Every answer is reviewed for clarity, depth, and confidence.',
    },
  ];

  const clearInterviewTransitionTimers = () => {
    if (interviewEntryDelayRef.current !== null) {
      window.clearTimeout(interviewEntryDelayRef.current);
      interviewEntryDelayRef.current = null;
    }

    if (interviewRevealTimeoutRef.current !== null) {
      window.clearTimeout(interviewRevealTimeoutRef.current);
      interviewRevealTimeoutRef.current = null;
    }
  };

  const startInterviewReveal = () => {
    if (!mountedRef.current) {
      return;
    }

    clearInterviewTransitionTimers();
    setInterviewTransitionState('revealing');
    interviewRevealTimeoutRef.current = window.setTimeout(() => {
      interviewRevealTimeoutRef.current = null;

      if (mountedRef.current) {
        setInterviewTransitionState('idle');
      }
    }, INTERVIEW_REVEAL_DURATION_MS);
  };

  const stopCameraStream = (nextStatus: CameraStatus = 'idle') => {
    const activeStream = cameraStreamRef.current;

    if (activeStream) {
      console.log('[AIInterviewPage] camera:stopping', {
        tracks: activeStream.getTracks().map((track) => ({
          kind: track.kind,
          label: track.label,
          readyState: track.readyState,
        })),
      });
      activeStream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (mountedRef.current) {
      setCameraStream(null);
      setCameraStatus(nextStatus);
    }
  };

  const startCameraStream = async () => {
    if (cameraStreamRef.current) {
      console.log('[AIInterviewPage] camera:reusing-stream');
      if (mountedRef.current) {
        setCameraStream(cameraStreamRef.current);
        setCameraStatus('live');
      }
      return true;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[AIInterviewPage] camera:error', {
        reason: 'mediaDevices.getUserMedia unavailable',
      });
      if (mountedRef.current) {
        setCameraStatus('error');
      }
      return false;
    }

    if (mountedRef.current) {
      setCameraStatus('requesting');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      console.log('[AIInterviewPage] camera:permission-granted');
      console.log('[AIInterviewPage] camera:stream-received', {
        tracks: stream.getTracks().map((track) => ({
          enabled: track.enabled,
          kind: track.kind,
          label: track.label,
          readyState: track.readyState,
        })),
      });

      cameraStreamRef.current = stream;

      if (mountedRef.current) {
        setCameraStream(stream);
        setCameraStatus('live');
      }

      return true;
    } catch (error: any) {
      console.error('[AIInterviewPage] camera:error', error);

      if (!mountedRef.current) {
        return false;
      }

      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        return false;
      }

      setCameraStatus('error');
      return false;
    }
  };

  const cameraSummaryTitle =
    cameraStatus === 'live'
      ? 'Camera active'
      : cameraStatus === 'requesting'
      ? 'Requesting camera access'
      : cameraStatus === 'denied'
      ? 'Camera permission blocked'
      : cameraStatus === 'error'
      ? 'Camera unavailable'
      : 'Camera ready';

  const cameraSummaryBody =
    cameraStatus === 'live'
      ? 'Your live video is active and will stay on for the full interview.'
      : cameraStatus === 'requesting'
      ? 'Approve the browser prompt to start your live preview.'
      : cameraStatus === 'denied'
      ? 'Allow camera access in your browser settings to enable live video.'
      : cameraStatus === 'error'
      ? 'No camera could be started. Check device availability and try again.'
      : 'Your preview stays quiet during setup and turns on when the interview begins.';

  const syncAnswerFromVoice = () => {
    if (!mountedRef.current) {
      return;
    }

    setCurrentAnswer(
      mergeResponseSegments(
        voiceAnswerBaseRef.current,
        voiceCommittedTranscriptRef.current,
        voiceInterimTranscriptRef.current,
      ),
    );
  };

  const resetVoiceCapture = () => {
    voiceAnswerBaseRef.current = '';
    voiceCommittedTranscriptRef.current = '';
    voiceInterimTranscriptRef.current = '';

    if (mountedRef.current) {
      setInterimTranscript('');
      setVoiceCaptureState('idle');
      setVoiceFeedbackMessage('');
    }
  };

  const commitInterimTranscript = () => {
    const interimDraft = voiceInterimTranscriptRef.current.trim();

    if (!interimDraft) {
      return;
    }

    const mergedTranscript = mergeResponseSegments(
      voiceCommittedTranscriptRef.current,
      interimDraft,
    );

    voiceCommittedTranscriptRef.current = mergedTranscript;
    voiceInterimTranscriptRef.current = '';

    if (mountedRef.current) {
      setInterimTranscript('');
    }
  };

  const loadSessions = async (showInitialLoader = false) => {
    if (showInitialLoader && mountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await aiInterviewService.listSessions();
      if (!mountedRef.current) return;
      setRecentSessions(data);
    } catch (error: any) {
      if (mountedRef.current) {
        toast.error(error?.message || 'Unable to load your saved sessions.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshingSessions(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void loadSessions(true);

    return () => {
      mountedRef.current = false;
      clearInterviewTransitionTimers();
      stopCameraStream();
      textToSpeech.cancel();
      speechToText.stopListening();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'interview') {
      setIsInterviewShellVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (mountedRef.current) {
        setIsInterviewShellVisible(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [phase, session?.id]);

  useEffect(() => {
    if (phase !== 'interview') {
      setElapsedInterviewSeconds(0);
      return;
    }

    const timerStartedAt = interviewViewStartedAt ?? session?.startedAt ?? Date.now();
    const updateElapsedTime = () => {
      if (!mountedRef.current) {
        return;
      }

      setElapsedInterviewSeconds(
        Math.max(0, Math.floor((Date.now() - timerStartedAt) / 1000)),
      );
    };

    updateElapsedTime();
    const timerId = window.setInterval(updateElapsedTime, 1000);

    return () => window.clearInterval(timerId);
  }, [interviewViewStartedAt, phase, session?.startedAt]);

  useEffect(() => {
    if (phase !== 'interview') {
      setInterviewViewStartedAt(null);
      return;
    }

    if (interviewViewStartedAt === null) {
      setInterviewViewStartedAt(session?.startedAt ?? Date.now());
    }
  }, [interviewViewStartedAt, phase, session?.startedAt]);

  useEffect(() => {
    if (phase !== 'interview' || !session || !currentQuestion) {
      return;
    }

    const promptKey = `${session.id}:${currentQuestion.id}`;
    if (lastPromptedQuestionRef.current === promptKey) {
      return;
    }

    lastPromptedQuestionRef.current = promptKey;
    setQuestionStartedAt(Date.now());
    setCurrentAnswer('');
    resetVoiceCapture();

    if (settings.voiceEnabled) {
      textToSpeech.cancel();
      setIsSpeaking(true);
      textToSpeech.speak(currentQuestion.text, () => {
        if (mountedRef.current) {
          setIsSpeaking(false);
        }
      });
    }
  }, [currentQuestion, phase, session, settings.voiceEnabled]);

  const upsertRecentSession = (nextSession: AIInterviewSession) => {
    setRecentSessions((previousSessions) => [
      nextSession,
      ...previousSessions.filter((item) => item.id !== nextSession.id),
    ]);
  };

  const hydrateSessionWorkspace = (nextSession: AIInterviewSession) => {
    clearInterviewTransitionTimers();
    stopCameraStream();
    textToSpeech.cancel();
    speechToText.stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    resetVoiceCapture();
    setCurrentAnswer('');
    setQuestionStartedAt(Date.now());
    setSelectedFile(null);
    setSession(nextSession);
    setPhase(mapSessionToPhase(nextSession));
    setInterviewTransitionState('idle');
    setShowEndInterviewConfirm(false);
    setIsMobileCameraCollapsed(true);
    setInterviewViewStartedAt(null);
    setElapsedInterviewSeconds(0);
    lastPromptedQuestionRef.current = '';
    upsertRecentSession(nextSession);
  };

  useEffect(() => {
    const navigationState = (location.state as AIInterviewPageNavigationState | null) || null;
    const restoredSessionId = navigationState?.restoredSessionId?.trim() || '';
    const restoreToken = navigationState?.restoreToken?.trim() || restoredSessionId;

    if (!restoredSessionId) {
      restoreRequestRef.current = '';
      return;
    }

    if (restoreRequestRef.current === restoreToken) {
      return;
    }

    restoreRequestRef.current = restoreToken;
    let cancelled = false;

    const restoreSession = async () => {
      if (mountedRef.current) {
        setLoading(true);
      }

      try {
        const restoredSession = await aiInterviewService.getSession(restoredSessionId);
        if (cancelled || !mountedRef.current) {
          return;
        }

        hydrateSessionWorkspace(restoredSession);
        toast.success(
          navigationState?.restoreToast || 'Your interview is ready. You can start when you are ready.',
        );
      } catch (error: any) {
        if (!cancelled && mountedRef.current) {
          toast.error(error?.message || 'Unable to restore the requested interview.');
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
          navigate(location.pathname, { replace: true, state: null });
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.state, navigate]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF resume to continue.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume size must be under 5MB.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleAnswerChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setCurrentAnswer(nextValue);

    if (isListening || voiceCaptureState === 'processing') {
      voiceAnswerBaseRef.current = nextValue.trim();
      voiceCommittedTranscriptRef.current = '';
      voiceInterimTranscriptRef.current = '';
      setInterimTranscript('');
      setVoiceFeedbackMessage('');
    }
  };

  const handlePrepareInterview = async () => {
    if (prepareRequestLockRef.current || preparing) {
      return;
    }

    const activeUser = user;
    const activeFile = selectedFile;
    const requestedDifficulty = difficulty;
    const requestedQuestionCount = questionCount;

    if (!activeUser) {
      toast.error('You must be signed in to use this interview mode.');
      return;
    }

    if (!activeFile) {
      toast.error('Upload a resume to continue.');
      return;
    }

    prepareRequestLockRef.current = true;
    setPreparing(true);
    toast.dismiss(PREPARE_INTERVIEW_TOAST_ID);

    try {
      const resumeText = await extractResumeText(activeFile);
      if (!resumeText.trim()) {
        throw new Error('The resume text could not be read. Please upload a clearer PDF and try again.');
      }

      const analysis = await generateResumeInterview(
        resumeText,
        requestedDifficulty,
        requestedQuestionCount,
      );

      const savedSession = await aiInterviewService.createSession({
        file: activeFile,
        session: {
          id: crypto.randomUUID(),
          userId: activeUser.id,
          resumeFileName: activeFile.name,
          resumeText,
          analysis,
          difficulty: requestedDifficulty,
          questionCount: requestedQuestionCount,
          questions: analysis.questions,
          answers: [],
          currentQuestionIndex: 0,
          status: 'ready',
        },
      });

      if (!mountedRef.current) return;

      setSession(savedSession);
      setPhase('ready');
      lastPromptedQuestionRef.current = '';
      upsertRecentSession(savedSession);
      if (analysis.generationSource === 'fallback') {
        toast.warning(
          `Gemini was unavailable, so we prepared ${savedSession.questions.length} resume-based backup questions so you can keep going.`,
          { id: PREPARE_INTERVIEW_TOAST_ID },
        );
      } else {
        toast.success(
          `Your interview is ready with ${savedSession.questions.length} tailored questions.`,
          { id: PREPARE_INTERVIEW_TOAST_ID },
        );
      }
    } catch (error: any) {
      console.error('[AIInterviewPage] prepare:error', {
        difficulty: requestedDifficulty,
        fileName: activeFile.name,
        questionCount: requestedQuestionCount,
        error,
      });

      if (mountedRef.current) {
        toast.error(error?.message || 'Unable to prepare interview right now.', {
          id: PREPARE_INTERVIEW_TOAST_ID,
        });
      }
    } finally {
      prepareRequestLockRef.current = false;
      if (mountedRef.current) {
        setPreparing(false);
      }
    }
  };

  const handleStartInterview = async () => {
    if (!session) return;

    if (session.status === 'completed') {
      clearInterviewTransitionTimers();
      setShowEndInterviewConfirm(false);
      setInterviewViewStartedAt(null);
      stopCameraStream();
      setPhase('complete');
      return;
    }

    try {
      clearInterviewTransitionTimers();
      setInterviewTransitionState('loading');
      setShowEndInterviewConfirm(false);
      const transitionStartedAt = Date.now();
      await startCameraStream();
      const nextSession =
        session.status === 'ready'
          ? await aiInterviewService.saveSession({
              ...session,
              status: 'in-progress',
              startedAt: session.startedAt ?? Date.now(),
            })
          : session;

      const elapsedSinceTransitionStarted = Date.now() - transitionStartedAt;
      const remainingTransitionTime = Math.max(
        INTERVIEW_ENTRY_MIN_DURATION_MS - elapsedSinceTransitionStarted,
        0,
      );

      if (remainingTransitionTime > 0) {
        await new Promise<void>((resolve) => {
          interviewEntryDelayRef.current = window.setTimeout(() => {
            interviewEntryDelayRef.current = null;
            resolve();
          }, remainingTransitionTime);
        });
      }

      if (!mountedRef.current) return;

      setInterviewViewStartedAt(Date.now());
      setSession(nextSession);
      setPhase('interview');
      setQuestionStartedAt(Date.now());
      setIsMobileCameraCollapsed(true);
      upsertRecentSession(nextSession);
      startInterviewReveal();
    } catch (error: any) {
      clearInterviewTransitionTimers();
      if (mountedRef.current) {
        setInterviewTransitionState('idle');
      }
      if (cameraStreamRef.current) {
        stopCameraStream();
      }
      toast.error(error?.message || 'Unable to start the interview.');
    }
  };

  const handleOpenSession = (selectedSession: Pick<AIInterviewSession, 'id'>) => {
    navigate(`/interview/${selectedSession.id}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (
      !window.confirm(
        'Delete this saved session? The resume file is only removed when no other interview still uses it.',
      )
    ) {
      return;
    }

    setDeletingId(sessionId);
    try {
      await aiInterviewService.deleteSession(sessionId);
      if (!mountedRef.current) return;

      setRecentSessions((previousSessions) =>
        previousSessions.filter((item) => item.id !== sessionId),
      );

      if (session?.id === sessionId) {
        clearInterviewTransitionTimers();
        stopCameraStream();
        setSession(null);
        setPhase('setup');
        setSelectedFile(null);
        setIsSpeaking(false);
        resetVoiceCapture();
        setShowEndInterviewConfirm(false);
        setInterviewViewStartedAt(null);
      }

      toast.success('Session deleted.');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to delete the session.');
    } finally {
      if (mountedRef.current) {
        setDeletingId(null);
      }
    }
  };

  const toggleListening = async () => {
    if (evaluating || phase !== 'interview') {
      return;
    }

    if (isListening) {
      speechToText.stopListening();
      setIsListening(false);
      setVoiceCaptureState('processing');
      setVoiceFeedbackMessage('Processing your response...');
      return;
    }

    if (!speechToText.isSupported()) {
      toast.error('Speech recognition is not supported in your browser.');
      setVoiceCaptureState('error');
      setVoiceFeedbackMessage('Voice input is not supported in this browser.');
      return;
    }

    textToSpeech.cancel();
    setIsSpeaking(false);
    setIsListening(false);
    voiceAnswerBaseRef.current = currentAnswer.trim();
    voiceCommittedTranscriptRef.current = '';
    voiceInterimTranscriptRef.current = '';
    setInterimTranscript('');
    setVoiceCaptureState('processing');
    setVoiceFeedbackMessage('Requesting microphone access...');

    try {
      let startFailedWithError = false;
      const started = await speechToText.startListening(
        (transcript) => {
          if (!mountedRef.current) return;
          voiceCommittedTranscriptRef.current = transcript;
          voiceInterimTranscriptRef.current = '';
          setInterimTranscript('');
          setVoiceCaptureState('listening');
          setVoiceFeedbackMessage('Listening...');
          syncAnswerFromVoice();
        },
        (error) => {
          if (!mountedRef.current) return;
          startFailedWithError = true;
          commitInterimTranscript();
          syncAnswerFromVoice();
          const message = getMicErrorMessage(error);
          toast.error(message);
          setIsListening(false);
          setVoiceCaptureState('error');
          setVoiceFeedbackMessage(error === 'no-speech' ? 'Try again' : message);
        },
        () => {
          if (!mountedRef.current) return;
          commitInterimTranscript();
          syncAnswerFromVoice();
          setIsListening(false);
          setVoiceCaptureState('idle');
          setVoiceFeedbackMessage(
            voiceCommittedTranscriptRef.current
              ? 'Voice response added to your answer.'
              : '',
          );
        },
        () => {
          if (!mountedRef.current) return;
          setIsListening(true);
          setVoiceCaptureState('listening');
          setVoiceFeedbackMessage('Listening...');
        },
        {
          autoRestart: true,
          continuous: true,
          finalResultDebounceMs: 700,
          interimResults: true,
          onActivityChange: (activity) => {
            if (!mountedRef.current) return;

            if (activity === 'listening') {
              setIsListening(true);
              setVoiceCaptureState('listening');
              setVoiceFeedbackMessage('Listening...');
              return;
            }

            if (activity === 'processing') {
              setVoiceCaptureState('processing');
              setVoiceFeedbackMessage('Processing your response...');
              return;
            }

            setIsListening(false);
            setVoiceCaptureState('idle');
          },
          onInterimResult: (transcript) => {
            if (!mountedRef.current) return;
            voiceInterimTranscriptRef.current = transcript;
            setInterimTranscript(transcript);

            if (transcript) {
              setVoiceCaptureState('listening');
              setVoiceFeedbackMessage('Listening...');
            }

            syncAnswerFromVoice();
          },
          restartDelayMs: 180,
        },
      );

      if (!started && mountedRef.current && !startFailedWithError) {
        setIsListening(false);
        setVoiceCaptureState('idle');
        setVoiceFeedbackMessage('');
        setInterimTranscript('');
      }
    } catch {
      if (mountedRef.current) {
        toast.error('Unable to start voice input.');
        setIsListening(false);
        setVoiceCaptureState('error');
        setVoiceFeedbackMessage('Unable to start voice input right now.');
        setInterimTranscript('');
      }
    }
  };

  const handleSubmitAnswer = async () => {
    const normalizedAnswer = mergeResponseSegments(
      currentAnswer,
      voiceCommittedTranscriptRef.current,
      voiceInterimTranscriptRef.current,
    );

    if (!session || !currentQuestion || !normalizedAnswer || evaluating) {
      return;
    }

    speechToText.stopListening();
    commitInterimTranscript();
    const answerText = mergeResponseSegments(
      normalizedAnswer,
      voiceCommittedTranscriptRef.current,
      voiceInterimTranscriptRef.current,
    );
    setCurrentAnswer(answerText);
    setEvaluating(true);
    const timeSpent = Math.max(1, Math.floor((Date.now() - questionStartedAt) / 1000));

    try {
      const evaluation = await evaluateInterviewAnswer({
        domain: session.analysis.domain,
        skills: session.analysis.skills,
        difficulty: session.difficulty,
        question: currentQuestion,
        answer: answerText,
        timeSpent,
      });

      const answerRecord: AIInterviewAnswer = {
        ...evaluation,
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        answer: answerText,
        timeSpent,
        timestamp: Date.now(),
      };

      const updatedAnswers = [...session.answers, answerRecord];
      const nextIndex = session.currentQuestionIndex + 1;
      const completed = nextIndex >= session.questions.length;

      const savedSession = await aiInterviewService.saveSession({
        ...session,
        answers: updatedAnswers,
        currentQuestionIndex: nextIndex,
        overallScore: getAverage(updatedAnswers.map((item) => item.score)),
        confidenceScore: getAverage(updatedAnswers.map((item) => item.confidenceScore)),
        status: completed ? 'completed' : 'in-progress',
        endedAt: completed ? Date.now() : undefined,
      });

      if (!mountedRef.current) return;

      setSession(savedSession);
      upsertRecentSession(savedSession);
      setCurrentAnswer('');
      resetVoiceCapture();

      if (completed) {
        clearInterviewTransitionTimers();
        stopCameraStream();
        setInterviewTransitionState('idle');
        setInterviewViewStartedAt(null);
        setShowEndInterviewConfirm(false);
        setPhase('complete');
        toast.success('Interview complete. Your summary is ready.');
      } else {
        toast.success(
          `Response reviewed: ${answerRecord.score}% score and ${answerRecord.confidenceScore}% confidence.`,
        );
      }
    } catch (error: any) {
      console.error('[AIInterviewPage] evaluate:error', error);
      if (mountedRef.current) {
        toast.error(error?.message || 'Unable to review your answer right now.');
      }
    } finally {
      if (mountedRef.current) {
        setEvaluating(false);
      }
    }
  };

  const handleReset = () => {
    clearInterviewTransitionTimers();
    stopCameraStream();
    textToSpeech.cancel();
    speechToText.stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    resetVoiceCapture();
    setCurrentAnswer('');
    setSession(null);
    setPhase('setup');
    setSelectedFile(null);
    setInterviewTransitionState('idle');
    setShowEndInterviewConfirm(false);
    setIsMobileCameraCollapsed(true);
    setInterviewViewStartedAt(null);
    setElapsedInterviewSeconds(0);
    lastPromptedQuestionRef.current = '';
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const primarySetupLabel =
    session && phase === 'ready'
      ? 'Start Interview'
      : selectedFile
      ? 'Prepare Interview'
      : 'Upload resume to continue';
  const showApplicationChrome = !isImmersiveInterviewMode;
  const mainContainerClasses =
    phase === 'interview'
      ? 'relative flex min-h-screen flex-col'
      : 'mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-5 sm:px-6 sm:py-7 lg:px-8';

  if (loading) {
    return (
      <div className={theme.page}>
        <Navbar />
        <LoadingSpinner fullPage message="Loading interview workspace..." />
      </div>
    );
  }

  return (
    <div className={theme.page}>
      <div className={theme.pageOverlay} />
      <div className="relative z-10">
        {showApplicationChrome && <Navbar />}
        <main className={mainContainerClasses}>
          <section className={cx(theme.section, 'p-4 sm:p-6')}>
            <div className="flex flex-col gap-3 sm:gap-5">
              <div className="min-w-0 max-w-2xl">
                <div
                  className={cx(
                    'mb-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] sm:px-3.5 sm:tracking-[0.26em]',
                    theme.chip,
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Resume-based mode
                </div>
                <h1 className={cx('break-words text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[2rem]', theme.title)}>
                  Interviews shaped around your experience
                </h1>
                <p className={cx('mt-2 hidden max-w-xl break-words text-sm leading-6 sm:mt-3 sm:block sm:text-[15px]', theme.body)}>
                  Upload your resume to unlock tailored questions, a focused practice space, and
                  intelligent feedback that feels polished and purposeful.
                </p>
              </div>

              <div className="hidden min-w-0 gap-3 sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div key={item.label} className={theme.featureCard}>
                    <div
                      className={cx(
                        'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                        isDarkMode ? 'bg-sky-400/10 text-sky-100' : 'bg-sky-50 text-sky-700',
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className={cx('mt-3 break-words text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.22em]', theme.muted)}>
                      {item.label}
                    </p>
                    <p
                      className={cx('mt-1.5 break-words text-[13px] leading-5', theme.subtle)}
                      style={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {(phase === 'setup' || phase === 'ready') && (
            <section className={cx(theme.section, 'p-4 sm:p-6')}>
              <div className="mb-4 flex flex-col gap-1.5 sm:mb-5 sm:gap-2">
                <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>Section 2</p>
                <h2 className={cx('text-xl font-semibold sm:text-2xl', theme.title)}>Interview setup</h2>
                <p className={cx('hidden max-w-2xl break-words text-sm leading-6 sm:block', theme.body)}>
                  Fine-tune the session, upload your resume, and prepare a guided interview
                  tailored to your background.
                </p>
              </div>

              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)] lg:items-start xl:grid-cols-[minmax(0,1.9fr)_minmax(380px,1fr)]">
                <div className={cx(theme.panel, 'order-2 h-full p-4 sm:p-5 lg:order-1')}>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                        Camera preview
                      </p>
                      <h3 className={cx('mt-1 break-words text-lg font-semibold', theme.title)}>
                        Ready when you are
                      </h3>
                    </div>
                    <span className={cx('w-fit max-w-full rounded-full border px-3 py-1 text-xs', theme.neutralChip)}>
                      {formatCameraStatus(cameraStatus)}
                    </span>
                  </div>

                  <CameraPreview
                    isDarkMode={isDarkMode}
                    status={cameraStatus}
                    stream={cameraStream}
                  />

                  <div className={cx('mt-3 rounded-2xl border p-3.5', theme.outlineButton)}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-400/80" />
                      <p className={cx('min-w-0 break-words text-sm font-semibold', theme.title)}>{cameraSummaryTitle}</p>
                    </div>
                    <p className={cx('mt-1.5 break-words text-sm leading-6', theme.body)}>
                      {cameraSummaryBody}
                    </p>
                  </div>
                </div>

                <div className="order-1 grid gap-4 lg:order-2">
                  <div className={cx(theme.panel, 'p-4 sm:p-5')}>
                    <div className="flex flex-col gap-4">
                      <div className="order-2">
                        <p className={cx('text-sm font-medium', theme.title)}>Difficulty</p>
                        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          {DIFFICULTY_OPTIONS.map((option) => (
                            <button
                              key={option}
                              disabled={preparing}
                              onClick={() => setDifficulty(option)}
                              aria-pressed={difficulty === option}
                              className={cx(
                                'inline-flex h-12 min-w-0 items-center justify-center rounded-2xl border px-3 text-center text-[13px] font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:whitespace-nowrap',
                                difficulty === option
                                  ? isDarkMode
                                    ? 'border-sky-400/30 bg-sky-400/10 text-white'
                                    : 'border-sky-200 bg-sky-50 text-sky-900'
                                  : theme.outlineButton,
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="order-3">
                        <p className={cx('text-sm font-medium', theme.title)}>Question count</p>
                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {QUESTION_OPTIONS.map((option) => (
                            <button
                              key={option}
                              disabled={preparing}
                              onClick={() => setQuestionCount(option)}
                              aria-pressed={questionCount === option}
                              className={cx(
                                'inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                                questionCount === option
                                  ? isDarkMode
                                    ? 'border-indigo-400/30 bg-indigo-400/10 text-white'
                                    : 'border-indigo-200 bg-indigo-50 text-indigo-900'
                                  : theme.outlineButton,
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div
                        className={cx(
                          'order-1 rounded-2xl border border-dashed p-3.5',
                          isDarkMode ? 'border-white/12 bg-white/5' : 'border-slate-300 bg-slate-50/80',
                        )}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          disabled={preparing}
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className={cx('text-sm font-semibold', theme.title)}>Resume upload</p>
                              <p className={cx('mt-1 break-words text-sm leading-6', theme.body)}>
                                Use a PDF to prepare a personalized interview and keep it linked to
                                this session.
                              </p>
                            </div>

                            <button
                              disabled={preparing}
                              onClick={() => fileInputRef.current?.click()}
                              className={cx(
                                'inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto',
                                theme.outlineButton,
                              )}
                            >
                              <Upload className="h-4 w-4" />
                              Choose resume
                            </button>
                          </div>

                          {selectedResumeLabel && (
                            <p className={cx('inline-flex max-w-full flex-wrap rounded-full border px-3 py-1 text-xs break-all sm:w-fit sm:break-normal', theme.chip)}>
                              {selectedFile ? 'Selected' : 'Using saved resume'}: {selectedResumeLabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="order-4 space-y-3 pt-1">
                        <p className={cx('break-words text-sm leading-6', theme.body)}>
                          {preparing
                            ? 'Preparing your interview...'
                            : session && phase === 'ready'
                            ? 'Everything is prepared. Start when you are ready.'
                            : selectedFile
                            ? 'We will prepare your personalized interview after upload.'
                            : 'Upload a resume to continue.'}
                        </p>
                        {session && (
                          <div className={cx('flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5', theme.surface)}>
                            <span className={cx('text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.22em]', theme.muted)}>
                              Prepared
                            </span>
                            <span className={cx('min-w-0 break-words text-sm font-medium', theme.title)}>
                              {session.analysis.domain}
                            </span>
                            <span className={cx('rounded-full border px-2.5 py-1 text-[11px]', theme.chip)}>
                              {session.questionCount} questions
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() =>
                            session && phase === 'ready'
                              ? void handleStartInterview()
                              : void handlePrepareInterview()
                          }
                          disabled={session && phase === 'ready' ? false : preparing || !selectedFile}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {preparing ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Preparing your interview...
                            </>
                          ) : (
                            <>
                              {session && phase === 'ready' ? <Play className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                              {primarySetupLabel}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {phase === 'interview' && session && currentQuestion && (
            <>
            <ImmersiveInterviewShell
              activeQuestionNumber={activeQuestionNumber}
              cameraStatus={cameraStatus}
              cameraStatusLabel={formatCameraStatus(cameraStatus)}
              cameraStream={cameraStream}
              currentAnswer={currentAnswer}
              currentQuestion={currentQuestion}
              elapsedTime={formattedInterviewTime}
              evaluating={evaluating}
              interviewStatusSummary={interviewStatusSummary}
              interviewVoiceLabel={interviewVoiceLabel}
              interviewVoiceNote={interviewVoiceNote}
              interimTranscript={interimTranscript}
              isDarkMode={isDarkMode}
              isInterviewShellVisible={isInterviewShellVisible}
              isListening={isListening}
              isMobileCameraCollapsed={isMobileCameraCollapsed}
              latestAnswer={latestAnswer}
              onAnswerChange={handleAnswerChange}
              onEndInterview={() => setShowEndInterviewConfirm(true)}
              onSubmitAnswer={() => void handleSubmitAnswer()}
              onToggleListening={() => void toggleListening()}
              onToggleMobileCamera={() =>
                setIsMobileCameraCollapsed((previousState) => !previousState)
              }
              progress={progress}
              remainingQuestions={remainingQuestions}
              session={session}
              theme={{
                body: theme.body,
                chip: theme.chip,
                neutralChip: theme.neutralChip,
                outlineButton: theme.outlineButton,
                panel: theme.panel,
                scoreChip: theme.scoreChip,
                successChip: theme.successChip,
                title: theme.title,
              }}
              voiceCaptureState={voiceCaptureState}
              voiceFeedbackMessage={voiceFeedbackMessage}
            />
            
            </>
          )}

          {phase === 'complete' && session && (
            <section className={cx(theme.section, 'p-4 sm:p-6')}>
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>Section 2</p>
                  <h2 className={cx('mt-2 break-words text-xl font-semibold sm:text-2xl', theme.title)}>
                    Session summary
                  </h2>
                  <p className={cx('mt-2 max-w-2xl break-words text-sm leading-6', theme.body)}>
                    Review the full breakdown, revisit strengths and improvements, and use the
                    next session to keep building momentum.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      setRefreshingSessions(true);
                      void loadSessions();
                    }}
                    className={cx(
                      'inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                      theme.outlineButton,
                    )}
                  >
                    <RefreshCcw className={cx('h-4 w-4', refreshingSessions && 'animate-spin')} />
                    Refresh sessions
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
                  >
                    <Play className="h-4 w-4" />
                    Start new interview
                  </button>
                </div>
              </div>

              <SessionSummary session={session} isDarkMode={isDarkMode} />
            </section>
          )}

          {phase !== 'interview' && (
            <section className={cx(theme.section, 'px-4 py-4 sm:px-5 sm:py-4')}>
            <div className="mx-auto w-full min-w-0 max-w-[1120px]">
              <div className="mb-3.5 flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>Section 3</p>
                  <h2 className={cx('mt-2 break-words text-xl font-semibold sm:text-2xl', theme.title)}>Session info</h2>
                  <p className={cx('mt-1.5 max-w-2xl break-words text-sm leading-[1.35rem]', theme.body)}>
                    Keep an eye on the active session, check voice readiness, and jump back into
                    earlier practice rounds whenever you need them.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setRefreshingSessions(true);
                    void loadSessions();
                  }}
                  className={cx(
                    'inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition sm:w-auto',
                    theme.outlineButton,
                  )}
                >
                  <RefreshCcw className={cx('h-4 w-4', refreshingSessions && 'animate-spin')} />
                  Refresh list
                </button>
              </div>

              <div className="grid min-w-0 gap-4 lg:grid-cols-3 lg:gap-5">
              <div className={cx(theme.panel, 'flex h-full flex-col p-3 sm:p-3.5')}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                      Current session
                    </p>
                    <h3 className={cx('mt-1.5 break-words text-base font-semibold sm:text-lg', theme.title)}>
                      {session ? session.analysis.domain : 'No active session'}
                    </h3>
                  </div>
                  <div
                    className={cx(
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg',
                      isDarkMode ? 'bg-sky-400/10 text-sky-100' : 'bg-sky-50 text-sky-700',
                    )}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                  </div>
                </div>

                {session ? (
                  <div className="mt-3 flex flex-1 flex-col space-y-2">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className={cx('rounded-xl border p-2.5', theme.surface)}>
                        <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                          Status
                        </p>
                        <p className={cx('mt-1.5 text-sm font-semibold', theme.title)}>
                          {formatStatus(session.status)}
                        </p>
                      </div>
                      <div className={cx('rounded-xl border p-2.5', theme.surface)}>
                        <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                          Questions
                        </p>
                        <p className={cx('mt-1.5 text-sm font-semibold', theme.title)}>
                          {session.questionCount}
                        </p>
                      </div>
                    </div>

                    <div className={cx('rounded-xl border p-2.5', theme.surface)}>
                      <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                        Resume file
                      </p>
                      <p className={cx('mt-1.5 break-all text-sm font-medium leading-5 sm:break-words', theme.title)}>
                        {session.resumeFileName}
                      </p>
                      <p className={cx('mt-1 text-[13px] leading-5', theme.body)}>
                        Created {format(new Date(session.createdAt), 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={cx('mt-3 rounded-xl border p-2.5', theme.surface)}>
                    <p className={cx('text-sm font-semibold', theme.title)}>
                      Upload a resume to begin
                    </p>
                    <p className={cx('mt-1.5 text-[13px] leading-5', theme.body)}>
                      Once a session is prepared, its details will appear here for quick access.
                    </p>
                  </div>
                )}
              </div>

              <div className={cx(theme.panel, 'flex h-full flex-col p-3 sm:p-3.5')}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                      Voice guidance
                    </p>
                    <h3 className={cx('mt-1.5 break-words text-base font-semibold sm:text-lg', theme.title)}>
                      {voiceStatusLabel}
                    </h3>
                  </div>
                  <div
                    className={cx(
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg',
                      isDarkMode ? 'bg-indigo-400/10 text-indigo-100' : 'bg-indigo-50 text-indigo-700',
                    )}
                  >
                    <Waves className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mt-3 flex flex-1 flex-col space-y-2">
                  <div className={cx('rounded-xl border p-2.5', theme.surface)}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cx(
                          'h-2.5 w-2.5 rounded-full',
                          isListening || isSpeaking
                            ? 'animate-pulse bg-emerald-400'
                            : isDarkMode
                            ? 'bg-white/30'
                            : 'bg-slate-300',
                        )}
                      />
                      <p className={cx('min-w-0 break-words text-sm font-semibold', theme.title)}>{voiceStatusLabel}</p>
                    </div>
                    <p className={cx('mt-1 break-words text-[13px] leading-[1.25rem]', theme.body)}>{voiceStatusNote}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className={cx('rounded-xl border p-2.5', theme.surface)}>
                      <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                        Prompts
                      </p>
                      <p className={cx('mt-1.5 text-sm font-medium', theme.title)}>
                        {settings.voiceEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className={cx('rounded-xl border p-2.5', theme.surface)}>
                      <p className={cx('text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em]', theme.muted)}>
                        Microphone
                      </p>
                      <p className={cx('mt-1.5 text-sm font-medium', theme.title)}>
                        {isListening ? 'Listening now' : 'Standby'}
                      </p>
                    </div>
                  </div>

                  <p className={cx('text-[13px] leading-[1.25rem]', theme.body)}>
                    Voice controls stay synced with the global toggle in the navbar, so the rest of
                    the app behaves the same way.
                  </p>
                </div>
              </div>

              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground sm:tracking-[0.24em]">
                      Previous sessions
                    </p>
                    <h3 className="mt-1.5 break-words text-base font-semibold text-foreground sm:text-lg">
                      Resume-based history
                    </h3>
                  </div>
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mt-3 max-h-[312px] flex-1 space-y-2 overflow-y-auto pr-1">
                  {recentSessions.length ? (
                    recentSessions.map((item) => (
                      <div
                        key={item.id}
                        className={cx(
                          'rounded-xl border bg-card p-2.5 shadow-sm',
                          session?.id === item.id
                            ? 'border-primary/30 bg-accent/40'
                            : 'border-border',
                        )}
                      >
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="min-w-0 break-words text-sm font-semibold text-foreground sm:truncate">
                                  {item.analysis.domain}
                                </p>
                              <span
                                className={cx(
                                  'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                                  item.status === 'completed' &&
                                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
                                  item.status === 'in-progress' &&
                                    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300',
                                  item.status === 'ready' &&
                                    'border-border bg-background text-muted-foreground',
                                )}
                              >
                                {formatStatus(item.status)}
                              </span>
                            </div>
                              <p className="mt-1 break-all text-xs leading-5 text-muted-foreground sm:truncate">
                                {item.resumeFileName}
                              </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {format(new Date(item.createdAt), 'MMM dd, yyyy hh:mm a')}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <button
                              onClick={() => handleOpenSession(item)}
                              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                              Open
                            </button>
                            <button
                              onClick={() => void handleDeleteSession(item.id)}
                              disabled={deletingId === item.id}
                              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === item.id ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm">
                      <p className="text-sm font-semibold text-foreground">
                        No saved sessions yet
                      </p>
                      <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
                        Prepare your first resume-based interview and it will appear here for quick
                        re-entry.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
            </section>
          )}
        </main>

        {showEndInterviewConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <div
              className={cx(
                'absolute inset-0',
                isDarkMode ? 'bg-slate-950/72 backdrop-blur-md' : 'bg-slate-900/35 backdrop-blur-md',
              )}
              onClick={() => setShowEndInterviewConfirm(false)}
            />

            <div
              className={cx(
                'relative w-full max-w-md rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl',
                isDarkMode
                  ? 'border-white/10 bg-slate-950/88 text-white'
                  : 'border-white/80 bg-white/92 text-slate-900',
              )}
            >
              <p className={cx('text-xs uppercase tracking-[0.24em]', theme.muted)}>
                End interview
              </p>
              <h3 className={cx('mt-3 text-2xl font-semibold', theme.title)}>
                Leave focused mode?
              </h3>
              <p className={cx('mt-3 text-sm leading-6', theme.body)}>
                Your current interview remains saved, and you can return to it from the session
                list whenever you are ready.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowEndInterviewConfirm(false)}
                  className={cx(
                    'inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                    theme.outlineButton,
                  )}
                >
                  Keep going
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
                >
                  End interview
                </button>
              </div>
            </div>
          </div>
        )}

        <InterviewLaunchOverlay
          visible={interviewTransitionState === 'loading'}
        />

        {showApplicationChrome && <Footer />}
      </div>
    </div>
  );
}

