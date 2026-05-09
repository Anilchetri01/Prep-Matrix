import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Bot, Mic, MicOff, Send, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  createManualInterviewQuestions,
  DOMAINS,
  DifficultyLevel,
  normalizeQuestionCount,
  Question,
} from '../data/questions';
import { InterviewAnswer, InterviewSession } from '../types';
import { api } from '../utils/api';
import { evaluateAnswer } from '../utils/evaluation';
import { sanitizeInterviewText } from '../utils/interviewText';
import { speechToText, textToSpeech } from '../utils/speech';

interface ChatMessage {
  type: 'bot' | 'user' | 'feedback';
  text: string;
  score?: number;
}

function formatInterviewMessage(text: string) {
  return sanitizeInterviewText(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');
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

  if (error === 'permission') {
    return 'Please allow microphone access and try again.';
  }

  return 'Mic error. Please try again.';
}

export function Interview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();

  const domainId = searchParams.get('domain') ?? '';
  const difficulty = (searchParams.get('difficulty') ?? 'beginner') as DifficultyLevel;
  const requestedCount = normalizeQuestionCount(parseInt(searchParams.get('count') ?? '10', 10));

  const domain = DOMAINS.find((item) => item.id === domainId);

  const [questions] = useState<Question[]>(() => {
    if (!domain) return [];
    return createManualInterviewQuestions(domain.id, difficulty, requestedCount);
  });

  const [phase, setPhase] = useState<'main' | 'complete'>('main');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const timeoutIdsRef = useRef<number[]>([]);
  const sessionSaveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const isCompletingRef = useRef(false);

  const totalQuestions = questions.length;
  const answeredCount = currentQuestionIndex;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const currentMainQuestion = questions[currentQuestionIndex];
  const isInputDisabled = isTyping || isCompleting || phase === 'complete';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isTyping, messages]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
      textToSpeech.cancel();
      speechToText.stopListening();
    };
  }, []);

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);

      if (!isMountedRef.current) {
        return;
      }

      callback();
    }, delay);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  };

  const addBotMessage = (
    text: string,
    score?: number,
    type: ChatMessage['type'] = 'bot',
  ) => {
    if (!isMountedRef.current) return;

    setMessages((previousMessages) => [
      ...previousMessages,
      { type, text, score },
    ]);
  };

  const persistSession = async (nextSession: InterviewSession) => {
    const queuePayload = {
      answerCount: nextSession.answers.length,
      currentQuestionIndex: nextSession.currentQuestionIndex,
      id: nextSession.id,
      score: nextSession.score ?? null,
      status: nextSession.status,
    };

    console.log('[Interview] persistSession:queued', queuePayload);

    sessionSaveQueueRef.current = sessionSaveQueueRef.current
      .catch((error) => {
        console.error('[Interview] persistSession:previousError', error);
      })
      .then(async () => {
        console.log('[Interview] persistSession:start', queuePayload);
        const response = await api.saveInterview(nextSession);
        console.log('[Interview] persistSession:success', response);
        return response;
      });

    return sessionSaveQueueRef.current;
  };

  const askMainQuestion = (index: number) => {
    if (index >= questions.length) return;

    const question = questions[index];
    setIsTyping(true);

    scheduleTimeout(() => {
      setIsTyping(false);
      addBotMessage(`**Q${index + 1}/${questions.length}:** ${question.text}`);

      if (settings.voiceEnabled) {
        setIsSpeaking(true);
        textToSpeech.speak(question.text, () => {
          if (!isMountedRef.current) return;
          setIsSpeaking(false);
        });
      }

      setQuestionStartTime(Date.now());
    }, 1200);
  };

  useEffect(() => {
    if (!domain || !user) {
      navigate('/dashboard');
      return;
    }

    const newSession: InterviewSession = {
      id: crypto.randomUUID(),
      userId: user.id,
      domainId: domain.id,
      domainName: domain.name,
      difficulty,
      questions,
      selectedQuestionIds: questions.map((question) => question.id),
      requestedQuestionCount: requestedCount,
      startTime: Date.now(),
      currentQuestionIndex: 0,
      answers: [],
      status: 'in-progress',
    };

    console.log('[Interview] init:start', {
      difficulty,
      domainId: domain.id,
      domainName: domain.name,
      requestedCount,
      selectedQuestionIds: questions.map((question) => question.id),
      sessionId: newSession.id,
    });

    setSession(newSession);
    void persistSession(newSession).catch((error) => {
      console.error('[Interview] init:save:error', error);
    });

    setMessages([
      {
        type: 'bot',
        text: `Hello ${user.name}! I'm your interviewer for **${domain.name}** at *${difficulty}* level.\n\nYou selected ${questions.length} questions. They are randomized and will not repeat in this session. Take your time and answer thoroughly. Let's begin!`,
      },
    ]);

    scheduleTimeout(() => askMainQuestion(0), 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMainAnswer = (answer: string, timeSpent: number) => {
    if (!currentMainQuestion || !session) return;

    const evaluation = evaluateAnswer(currentMainQuestion, answer, timeSpent);

    const interviewAnswer: InterviewAnswer = {
      questionId: currentMainQuestion.id,
      questionText: currentMainQuestion.text,
      answer,
      timeSpent,
      matchedKeywords: evaluation.matchedKeywords,
      score: evaluation.score,
      confidenceScore: evaluation.confidenceScore,
      relevanceScore: evaluation.relevanceScore,
      feedback: evaluation.feedback,
      improvements: evaluation.improvements,
      strengths: evaluation.strengths,
      timestamp: Date.now(),
      isIntro: false,
    };

    const updatedSession: InterviewSession = {
      ...session,
      answers: [...session.answers, interviewAnswer],
      currentQuestionIndex: currentQuestionIndex + 1,
    };

    setSession(updatedSession);
    void persistSession(updatedSession).catch((error) => {
      console.error('[Interview] main:save:error', error);
    });
    setIsTyping(true);

    scheduleTimeout(() => {
      setIsTyping(false);
      addBotMessage(evaluation.feedback, evaluation.score, 'feedback');

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
        scheduleTimeout(() => askMainQuestion(nextIndex), 1500);
        return;
      }

      setCurrentQuestionIndex(nextIndex);
      setPhase('complete');
      scheduleTimeout(() => {
        void completeInterview(updatedSession);
      }, 1500);
    }, 900);
  };

  const completeInterview = async (finalSession: InterviewSession) => {
    if (isCompletingRef.current) return;

    isCompletingRef.current = true;
    setIsCompleting(true);
    setIsTyping(true);
    console.log('[Interview] complete:start', {
      answerCount: finalSession.answers.length,
      id: finalSession.id,
    });

    scheduleTimeout(() => {
      void (async () => {
        try {
          setIsTyping(false);
          addBotMessage(
            "🎉 Excellent work! You've completed all questions. Calculating your results...",
          );

          const scores = finalSession.answers.map((answerItem) => answerItem.score);

          const avgScore =
            scores.length > 0
              ? Math.round(
                  scores.reduce((total, score) => total + score, 0) / scores.length,
                )
              : 0;

          const completedSession: InterviewSession = {
            ...finalSession,
            endTime: Date.now(),
            score: avgScore,
            status: 'completed',
          };

          const saveResponse = await persistSession(completedSession);
          console.log('[Interview] complete:saveSuccess', saveResponse);

          scheduleTimeout(() => {
            console.log('[Interview] complete:navigate', {
              id: completedSession.id,
              route: '/history',
            });
            navigate('/history');
          }, 1800);
        } catch (error: any) {
          console.error('[Interview] complete:error', error);
          toast.error(error?.message || 'Unable to save your results. Please try again.');

          if (isMountedRef.current) {
            setIsCompleting(false);
            setIsTyping(false);
          }

          isCompletingRef.current = false;
        }
      })();
    }, 1200);
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim() || !session || isTyping || isCompleting) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const answer = userAnswer.trim();
    setUserAnswer('');
    setMessages((previousMessages) => [...previousMessages, { type: 'user', text: answer }]);

    handleMainAnswer(answer, timeSpent);
  };

  const toggleListening = async () => {
    if (isListening) {
      speechToText.stopListening();
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    if (!speechToText.isSupported()) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    textToSpeech.cancel();
    setIsSpeaking(false);
    setIsListening(true);
    setInterimTranscript('Listening... Speak clearly after clicking the mic.');
    toast.info('Listening... Speak clearly after clicking the mic.');

    try {
      const started = await speechToText.startListening(
        (transcript) => {
          if (!isMountedRef.current) return;

          console.log('[Interview] mic:result', transcript);
          setUserAnswer((previousAnswer) =>
            (previousAnswer ? `${previousAnswer} ${transcript}` : transcript).trim(),
          );
          setInterimTranscript('');
        },
        (error) => {
          console.error('[Interview] mic:error', error);
          toast.error(getMicErrorMessage(error));

          if (!isMountedRef.current) return;

          setIsListening(false);
          setInterimTranscript('');
        },
        () => {
          if (!isMountedRef.current) return;
          setIsListening(false);
          setInterimTranscript('');
        },
        () => {
          console.log('[Interview] mic:start');

          if (!isMountedRef.current) return;

          setIsListening(true);
          setInterimTranscript('Listening... Speak clearly after clicking the mic.');
        },
      );

      if (!started && isMountedRef.current) {
        setIsListening(false);
        setInterimTranscript('');
      }
    } catch (error) {
      console.error('[Interview] mic:start:error', error);
      toast.error('Unable to start voice input right now.');
      setIsListening(false);
      setInterimTranscript('');
    }
  };

  const handleExit = () => {
    console.log('[Interview] exit:start', {
      sessionId: session?.id,
      status: session?.status,
    });

    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
    textToSpeech.cancel();
    speechToText.stopListening();

    if (session?.status === 'in-progress') {
      api.deleteInterview(session.id).catch((error) => {
        console.error('[Interview] exit:deleteSession:error', error);
      });
    }

    navigate('/dashboard');
  };

  if (!domain || !user) return null;

  const headerLabel = `Q${Math.min(currentQuestionIndex + 1, questions.length)}/${questions.length}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 flex flex-col">
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{sanitizeInterviewText(domain.icon)}</span>
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                  {sanitizeInterviewText(domain.name)}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1">
                  {sanitizeInterviewText(`${difficulty} · ${headerLabel}`)}
                </p>
              </div>
            </div>
            <button
              onClick={handleExit}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Exit interview"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              {sanitizeInterviewText(`Domain questions · ${Math.min(answeredCount, totalQuestions)}/${totalQuestions}`)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.type}-${index}`}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type !== 'user' && (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg shadow-sm ${
                    message.type === 'feedback'
                      ? 'bg-green-500'
                      : 'bg-indigo-600'
                  }`}
                >
                  {message.type === 'feedback' ? (
                    message.score !== undefined && message.score >= 70 ? (
                      sanitizeInterviewText('👏')
                    ) : message.score !== undefined && message.score >= 50 ? (
                      sanitizeInterviewText('👍')
                    ) : (
                      sanitizeInterviewText('💡')
                    )
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white'
                    : message.type === 'feedback'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <p
                  className={`text-sm leading-relaxed ${
                    message.type === 'user'
                      ? 'text-white'
                      : message.type === 'feedback'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {formatInterviewMessage(message.text)}
                </p>
                {message.type === 'feedback' && message.score !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          message.score >= 75
                            ? 'bg-green-500'
                            : message.score >= 50
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${message.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {message.score}%
                    </span>
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((dotIndex) => (
                    <div
                      key={dotIndex}
                      className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: `${dotIndex * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          {interimTranscript && (
            <div className="mb-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-600 dark:text-indigo-300 italic">
              {sanitizeInterviewText(interimTranscript)}...
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={toggleListening}
              disabled={isInputDisabled}
              className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <textarea
              value={userAnswer}
              onChange={(event) => setUserAnswer(event.target.value)}
              disabled={isInputDisabled}
              placeholder={
                isInputDisabled
                  ? sanitizeInterviewText('Wait for the question...')
                  : sanitizeInterviewText('Type your answer here...')
              }
              rows={2}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
            />

            <button
              onClick={handleSubmitAnswer}
              disabled={isInputDisabled || !userAnswer.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
              title="Send answer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            {sanitizeInterviewText('Press Enter to send · Shift+Enter for new line ·')} {isSpeaking && sanitizeInterviewText('🔊 Reading question...')}
          </p>
        </div>
      </div>
    </div>
  );
}

