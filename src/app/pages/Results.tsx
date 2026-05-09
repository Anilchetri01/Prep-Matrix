import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { InterviewSession, InterviewAnswer } from '../types';
import { getPerformanceRating } from '../utils/evaluation';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { Trophy, Clock, Target, TrendingUp, Home, History, RefreshCw, ChevronDown, ChevronUp, Star, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';
// @ts-ignore
import confetti from 'canvas-confetti';

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-green-600 dark:text-green-400' :
    score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
    'text-orange-600 dark:text-orange-400';
  return <span className={`text-2xl font-bold ${color}`}>{score}%</span>;
}

function MiniScoreBadge({ score }: { score: number }) {
  const bg = score >= 75 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
    score >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${bg}`}>
      {score}%
    </span>
  );
}

// Generate domain-based strengths and weaknesses based on scores
function generateInsights(answers: InterviewAnswer[], domainName: string) {
  const mainAnswers = answers.filter((a) => !a.isIntro);
  const avgScore = mainAnswers.length > 0
    ? mainAnswers.reduce((s, a) => s + a.score, 0) / mainAnswers.length
    : 0;

  const highScoring = mainAnswers.filter((a) => a.score >= 75);
  const lowScoring = mainAnswers.filter((a) => a.score < 50);
  const midScoring = mainAnswers.filter((a) => a.score >= 50 && a.score < 75);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (avgScore >= 75) {
    strengths.push(`Strong understanding of ${domainName} concepts`);
    strengths.push('Consistent performance across questions');
  } else if (avgScore >= 50) {
    strengths.push(`Foundational knowledge of ${domainName}`);
    strengths.push('Good effort and engagement throughout the interview');
  } else {
    strengths.push('Willingness to attempt all questions');
    strengths.push('Demonstrated basic awareness of the domain');
  }

  if (highScoring.length > 0) {
    strengths.push(`Excellent answers on ${highScoring.length} question${highScoring.length > 1 ? 's' : ''}`);
  }

  if (lowScoring.length > 0) {
    weaknesses.push(`${lowScoring.length} question${lowScoring.length > 1 ? 's' : ''} need significant improvement`);
  }

  if (midScoring.length > 0) {
    weaknesses.push(`${midScoring.length} answer${midScoring.length > 1 ? 's' : ''} were partially correct — could be more detailed`);
  }

  if (avgScore < 75) {
    weaknesses.push('Answers could include more specific technical details and examples');
  }

  // Suggestions
  if (avgScore < 50) {
    suggestions.push(`Study ${domainName} fundamentals from beginner resources`);
    suggestions.push('Practice with mock interviews more regularly');
  } else if (avgScore < 75) {
    suggestions.push(`Deep dive into intermediate ${domainName} topics`);
    suggestions.push('Use the STAR method: Situation, Task, Action, Result');
    suggestions.push('Include real-world examples and project experiences in answers');
  } else {
    suggestions.push('Explore advanced topics and edge cases');
    suggestions.push('Practice system design and architecture discussions');
    suggestions.push('Try advanced difficulty level for continued growth');
  }

  suggestions.push('Review flagged questions and study the feedback provided');
  suggestions.push('Enable voice input to simulate a real interview environment');

  return { strengths, weaknesses, suggestions };
}

export function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'insights'>('overview');

  useEffect(() => {
    if (!id) { navigate('/dashboard'); return; }
    loadInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadInterview = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getInterview(id!);
      if (data.status !== 'completed') throw new Error('Interview not complete');
      setInterview(data);
      triggerConfetti(data.score ?? 0);
    } catch (err: any) {
      setError(err?.message ?? 'Interview not found');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySync = async () => {
    if (!interview) return;
    setSyncing(true);
    try {
      await api.saveInterview(interview);
      toast.success('Results synced to server!');
    } catch (err: any) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const triggerConfetti = (score: number) => {
    if (score >= 75) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <Navbar />
      <LoadingSpinner fullPage message="Loading your results..." />
    </div>
  );

  if (error || !interview) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex flex-col">
      <Navbar />
      <div className="flex items-center justify-center py-24 flex-1">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Interview Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">{error || 'This interview result could not be loaded.'}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );

  const totalTime = interview.endTime
    ? Math.floor((interview.endTime - interview.startTime) / 1000)
    : 0;
  const avgTimePerQ = interview.answers.length > 0
    ? Math.floor(totalTime / interview.answers.length)
    : 0;
  const performanceRating = getPerformanceRating(interview.score ?? 0);

  // Separate intro and main answers
  const introAnswers = interview.answers.filter((a) => a.isIntro);
  const mainAnswers = interview.answers.filter((a) => !a.isIntro);

  const introAvg = introAnswers.length > 0
    ? Math.round(introAnswers.reduce((s, a) => s + a.score, 0) / introAnswers.length)
    : null;

  const mainAvg = mainAnswers.length > 0
    ? Math.round(mainAnswers.reduce((s, a) => s + a.score, 0) / mainAnswers.length)
    : null;

  const questionScores = mainAnswers.map((a, i) => ({
    name: `Q${i + 1}`,
    score: a.score,
    fill: a.score >= 75 ? '#10B981' : a.score >= 50 ? '#F59E0B' : '#EF4444',
  }));

  const radarData = [
    { subject: 'Accuracy', value: interview.score ?? 0 },
    {
      subject: 'Speed',
      value: Math.min(100, Math.round((60 / Math.max(1, avgTimePerQ)) * 100)),
    },
    {
      subject: 'Completion',
      value: 100,
    },
    {
      subject: 'Consistency',
      value: (() => {
        const scores = mainAnswers.map((a) => a.score);
        if (!scores.length) return 0;
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((s, sc) => s + Math.pow(sc - avg, 2), 0) / scores.length;
        return Math.max(0, Math.round(100 - Math.sqrt(variance)));
      })(),
    },
    {
      subject: 'Intro',
      value: introAvg ?? 0,
    },
  ];

  const { strengths, weaknesses, suggestions } = generateInsights(interview.answers, interview.domainName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1">
        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-2xl">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Interview Complete!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {interview.domainName} · <span className="capitalize">{interview.difficulty}</span>
          </p>
        </div>

        {/* Score card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center shadow-2xl">
          <p className="text-indigo-200 mb-1">Overall Score</p>
          <div className="text-7xl font-extrabold mb-3 tracking-tight">{interview.score}%</div>
          <div className="inline-block px-5 py-1.5 rounded-full bg-white/20 backdrop-blur font-semibold">
            {performanceRating.rating}
          </div>
          <p className="mt-3 text-indigo-100 text-sm max-w-xs mx-auto">
            {performanceRating.message}
          </p>

          {/* Intro vs Main scores */}
          {(introAvg !== null || mainAvg !== null) && (
            <div className="mt-6 grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {introAvg !== null && (
                <div className="bg-white/10 rounded-2xl p-3">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-3.5 h-3.5 text-amber-300" />
                    <p className="text-xs text-indigo-200">Intro Score</p>
                  </div>
                  <p className="text-2xl font-bold">{introAvg}%</p>
                </div>
              )}
              {mainAvg !== null && (
                <div className="bg-white/10 rounded-2xl p-3">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-3.5 h-3.5 text-blue-300" />
                    <p className="text-xs text-indigo-200">Domain Score</p>
                  </div>
                  <p className="text-2xl font-bold">{mainAvg}%</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Questions', value: interview.answers.length },
            { icon: <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />, bg: 'bg-green-100 dark:bg-green-900/30', label: 'Total Time', value: `${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}` },
            { icon: <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />, bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Avg Time/Q', value: `${avgTimePerQ}s` },
            { icon: <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />, bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Intro Score', value: introAvg !== null ? `${introAvg}%` : 'N/A' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
              <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: '📊 Performance' },
              { id: 'breakdown', label: '📋 Q&A Breakdown' },
              { id: 'insights', label: '💡 Insights' },
            ].map(({ id: tabId, label }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId as any)}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                  activeTab === tabId
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score per question bar chart */}
                {questionScores.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Score per Domain Question</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={questionScores}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                          formatter={(v: any) => [`${v}%`, 'Score']}
                        />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                          {questionScores.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Radar chart */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Performance Analysis</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" opacity={0.3} />
                      <PolarAngleAxis dataKey="subject" stroke="#6B7280" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6B7280" fontSize={10} />
                      <Radar dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Intro questions results */}
              {introAnswers.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Introduction Questions
                  </h3>
                  <div className="space-y-3">
                    {introAnswers.map((answer, i) => (
                      <div key={i} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{answer.questionText}</p>
                          <MiniScoreBadge score={answer.score} />
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full ${answer.score >= 75 ? 'bg-green-500' : answer.score >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                            style={{ width: `${answer.score}%` }}
                          />
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300 italic">{answer.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Breakdown Tab */}
          {activeTab === 'breakdown' && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {interview.answers.map((answer, i) => (
                <div key={i} className="p-5">
                  <button
                    className="w-full flex items-start justify-between gap-4 text-left"
                    onClick={() => setExpandedAnswer(expandedAnswer === i ? null : i)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {answer.isIntro && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold">
                            <Star className="w-3 h-3" /> Intro
                          </span>
                        )}
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {answer.isIntro ? `I${introAnswers.indexOf(answer) + 1}` : `Q${mainAnswers.indexOf(answer) + 1}`}
                        </span>
                        <ScoreBadge score={answer.score} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">· {answer.timeSpent}s</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {answer.questionText}
                      </p>
                    </div>
                    {expandedAnswer === i
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    }
                  </button>

                  {expandedAnswer === i && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              answer.score >= 75 ? 'bg-green-500' : answer.score >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${answer.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{answer.score}/100</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Your answer:</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{answer.answer}</p>
                      </div>
                      {(answer.confidenceScore !== undefined || answer.relevanceScore !== undefined) && (
                        <div className="grid grid-cols-2 gap-2">
                          {answer.relevanceScore !== undefined && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
                              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">Relevance</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{answer.relevanceScore}%</p>
                            </div>
                          )}
                          {answer.confidenceScore !== undefined && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
                              <p className="text-xs font-semibold text-purple-600 dark:text-purple-300">Confidence</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{answer.confidenceScore}%</p>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="p-6 space-y-6">
              {/* Strengths */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-orange-500" />
                  Areas for Improvement
                </h3>
                {weaknesses.length > 0 ? (
                  <ul className="space-y-2">
                    {weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No major weaknesses detected — great performance!</p>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  Suggestions for Improvement
                </h3>
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-2.5">
                      <span className="text-indigo-500 mt-0.5 flex-shrink-0">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Domain-based feedback */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
                  🎯 Domain-Based Feedback: {interview.domainName}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {interview.score! >= 80
                    ? `Outstanding performance in ${interview.domainName}! You demonstrated deep knowledge and clear communication. You're well-prepared for interviews at this level.`
                    : interview.score! >= 65
                    ? `Good performance in ${interview.domainName}. You have solid foundational knowledge. Focus on expanding your practical examples and technical depth to excel at senior-level interviews.`
                    : interview.score! >= 50
                    ? `Moderate performance in ${interview.domainName}. You show basic awareness of key concepts, but need to deepen your understanding. Study core principles and practice explaining concepts clearly.`
                    : `You're in the early stages of learning ${interview.domainName}. Focus on mastering the fundamentals before attempting intermediate or advanced questions. Consider beginner-level study resources.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-md"
          >
            <Home className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <History className="w-4 h-4" /> All Interviews
          </button>
          <button
            onClick={handleRetrySync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold py-3 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Results'}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
