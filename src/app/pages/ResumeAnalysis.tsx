import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { analyzeResume } from '../utils/resumeAnalyzer';
import type { Resume } from '../types';
import { DOMAINS } from '../data/questions';
import { Navbar } from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Trash2,
  Search,
  BarChart3,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY_COLORS = {
  high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

const EXPERIENCE_LABELS = {
  entry: '🌱 Entry Level',
  mid: '📚 Mid Level',
  senior: '🚀 Senior Level',
  expert: '👑 Expert Level',
};

export function ResumeAnalysis() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    void loadResumes(true);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadResumes = async (showLoading = false) => {
    if (showLoading && isMountedRef.current) {
      setLoading(true);
    }

    try {
      console.log('[ResumeAnalysis] loadResumes:start');
      const data = await api.getResumes();
      if (!isMountedRef.current) return [];
      setResumes(data);
      setSelectedResume((previousSelectedResume) => {
        if (!previousSelectedResume) {
          return data[0] || null;
        }

        return (
          data.find((resume) => resume.id === previousSelectedResume.id) ||
          data[0] ||
          previousSelectedResume
        );
      });
      console.log('[ResumeAnalysis] loadResumes:success', { count: data.length });
      return data;
    } catch (err: any) {
      console.error('[ResumeAnalysis] loadResumes:error', err);
      toast.error('Could not load resumes: ' + err.message);
      return [];
    } finally {
      if (showLoading && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const hydrateSelectedResume = async (
    resume: Resume,
    fallbackAnalysis = resume.analysisResult,
  ) => {
    const fallbackResume = {
      ...resume,
      analysisResult: fallbackAnalysis ?? resume.analysisResult,
    };

    if (isMountedRef.current) {
      setSelectedResume(fallbackResume);
    }

    try {
      console.log('[ResumeAnalysis] select:start', { id: resume.id });
      const fetchedResume = await api.getResume(resume.id);

      const nextSelectedResume = {
        ...resume,
        ...fetchedResume,
        analysisResult: fetchedResume.analysisResult ?? fallbackAnalysis,
      };

      if (!isMountedRef.current) {
        return nextSelectedResume;
      }

      setSelectedResume(nextSelectedResume);
      console.log('[ResumeAnalysis] select:success', {
        id: nextSelectedResume.id,
        hasAnalysis: Boolean(nextSelectedResume.analysisResult),
      });
      return nextSelectedResume;
    } catch (error) {
      console.error('[ResumeAnalysis] select:error', error);

      if (isMountedRef.current) {
        setSelectedResume(fallbackResume);
      }

      return fallbackResume;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a TXT, PDF, or DOC file');
      return;
    }

    if (!selectedDomain) {
      toast.warning('Please select a domain first');
      return;
    }

    setAnalyzing(true);
    try {
      if (!user) {
        throw new Error('You must be signed in to analyze a resume.');
      }

      console.log('[ResumeAnalysis] analyze:start', {
        domainId: selectedDomain,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });

      // Read file content
      const content = await readFileAsText(file);
      
      if (content.length < 100) {
        toast.error('Resume content seems too short. Please upload a complete resume.');
        return;
      }

      // Create resume object
      const domain = DOMAINS.find(d => d.id === selectedDomain);
      const resumeId = crypto.randomUUID();
      
      // Analyze resume
      const analysis = analyzeResume(content, selectedDomain, domain?.name || 'Unknown');
      
      const resume: Resume = {
        id: resumeId,
        userId: user!.id,
        fileName: file.name,
        fileSize: file.size,
        domainId: selectedDomain,
        domainName: domain?.name || 'Unknown',
        content,
        uploadedAt: Date.now(),
        analysisResult: analysis,
      };

      // Save to API
      const savedResume = await api.saveResume({
        ...resume,
        file,
      });
      
      if (!isMountedRef.current) return;

      toast.success(`Resume analyzed! Overall score: ${analysis.overallScore}%`);
      
      // Reload resumes and show the new one
      const refreshedResumes = await loadResumes(false);
      const nextSelectedResume =
        refreshedResumes.find((item) => item.id === savedResume.id) || {
          ...savedResume,
          analysisResult: analysis,
        };

      if (!isMountedRef.current) return;

      await hydrateSelectedResume(nextSelectedResume, analysis);
      console.log('[ResumeAnalysis] analyze:success', {
        resumeId: nextSelectedResume.id,
        score: analysis.overallScore,
      });
      
    } catch (err: any) {
      console.error('[ResumeAnalysis] analyze:error', err);
      toast.error('Failed to analyze resume: ' + err.message);
    } finally {
      if (isMountedRef.current) {
        setAnalyzing(false);
      }
      if (fileInputRef.current && isMountedRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error(`Unable to read file: ${file.name}`));
      reader.readAsText(file);
    });
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume analysis?')) return;
    
    try {
      console.log('[ResumeAnalysis] delete:start', { id });
      await api.deleteResume(id);
      if (!isMountedRef.current) return;
      toast.success('Resume deleted');
      setResumes((previousResumes) => previousResumes.filter((resume) => resume.id !== id));
      if (selectedResume?.id === id) {
        setSelectedResume(null);
      }
      console.log('[ResumeAnalysis] delete:success', { id });
    } catch (err: any) {
      console.error('[ResumeAnalysis] delete:error', err);
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const filteredDomains = DOMAINS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <Navbar />

      <main className="mx-auto w-full min-w-0 max-w-7xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="min-w-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shadow-lg sm:p-6 sm:shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
            <h1 className="min-w-0 break-words text-2xl font-bold sm:text-3xl">Resume Analysis</h1>
          </div>
          <p className="text-indigo-100 text-sm">
            Upload your resume and get AI-powered feedback tailored to your target domain
          </p>
        </div>

        {/* Stats */}
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[
            {
              icon: '📄',
              label: 'Total Resumes',
              value: resumes.length,
              color: 'bg-blue-100 dark:bg-blue-900/30',
            },
            {
              icon: '⭐',
              label: 'Avg Score',
              value: resumes.length > 0
                ? `${Math.round(resumes.reduce((s, r) => s + (r.analysisResult?.overallScore || 0), 0) / resumes.length)}%`
                : '0%',
              color: 'bg-green-100 dark:bg-green-900/30',
            },
            {
              icon: '🏆',
              label: 'Best Score',
              value: resumes.length > 0
                ? `${Math.max(...resumes.map(r => r.analysisResult?.overallScore || 0))}%`
                : '0%',
              color: 'bg-yellow-100 dark:bg-yellow-900/30',
            },
            {
              icon: '🎯',
              label: 'Domains',
              value: new Set(resumes.map(r => r.domainId)).size,
              color: 'bg-purple-100 dark:bg-purple-900/30',
            },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0 rounded-2xl bg-white p-3 shadow-md dark:bg-gray-800 sm:p-5 sm:shadow-lg">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-lg sm:mb-3 sm:h-10 sm:w-10 sm:text-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <p className="mt-0.5 break-words text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="min-w-0 rounded-2xl bg-white p-4 shadow-lg dark:bg-gray-800 sm:p-6 lg:p-8">
          <div className="mb-4 flex min-w-0 items-center gap-2 sm:mb-6">
            <Upload className="w-5 h-5 text-indigo-600" />
            <h2 className="min-w-0 break-words text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Upload New Resume</h2>
          </div>

          {/* Domain Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Target Domain ({filteredDomains.length} available)
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid max-h-60 min-w-0 grid-cols-1 gap-2 overflow-y-auto p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredDomains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  aria-pressed={selectedDomain === domain.id}
                  className={`group min-h-11 min-w-0 rounded-xl border-2 p-3 text-center transition-all ${
                    selectedDomain === domain.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-md dark:bg-indigo-900/30'
                      : 'border-gray-200 hover:border-indigo-300 dark:border-gray-600 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{domain.icon}</div>
                  <p className={`text-xs font-medium leading-tight ${
                    selectedDomain === domain.id
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {domain.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="min-w-0 rounded-xl border-2 border-dashed border-gray-300 p-4 text-center dark:border-gray-600 sm:p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={analyzing || !selectedDomain}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                {analyzing ? (
                  <div className="animate-spin">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                  </div>
                ) : (
                  <Upload className="w-8 h-8 text-indigo-600" />
                )}
              </div>
              <div className="min-w-0 max-w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing || !selectedDomain}
                  className="min-h-12 max-w-full break-words rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 sm:px-6 sm:text-base"
                >
                  {analyzing ? 'Analyzing Resume...' : selectedDomain ? 'Choose File to Upload' : 'Select Domain First'}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Supported formats: TXT, PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume List and Analysis */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Resume List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Your Resumes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {resumes.length} resume{resumes.length !== 1 ? 's' : ''} analyzed
              </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner />
                </div>
              ) : resumes.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No resumes uploaded yet</p>
                </div>
              ) : (
                resumes.map((resume) => (
                  <div
                    key={resume.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      void hydrateSelectedResume(resume, resume.analysisResult);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void hydrateSelectedResume(resume, resume.analysisResult);
                      }
                    }}
                    className={`flex w-full min-w-0 items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:px-6 ${
                      selectedResume?.id === resume.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <span className="text-xl">
                          {DOMAINS.find(d => d.id === resume.domainId)?.icon ?? '📋'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {resume.fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {resume.domainName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${
                          (resume.analysisResult?.overallScore || 0) >= 75
                            ? 'text-green-600'
                            : (resume.analysisResult?.overallScore || 0) >= 50
                            ? 'text-yellow-600'
                            : 'text-orange-600'
                        }`}>
                          {resume.analysisResult?.overallScore || 0}%
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResume(resume.id);
                          }}
                          aria-label={`Delete ${resume.fileName}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Delete resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Analysis Details */}
          <div className="min-w-0 rounded-2xl bg-white p-4 shadow-lg dark:bg-gray-800 sm:p-6 lg:col-span-2">
            {selectedResume?.analysisResult ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="mb-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-all text-lg font-bold text-gray-900 dark:text-white sm:break-words sm:text-xl">
                        {selectedResume.fileName}
                      </h3>
                      <p className="break-words text-sm text-gray-500 dark:text-gray-400">
                        {selectedResume.domainName} • Uploaded {format(new Date(selectedResume.uploadedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className={`shrink-0 text-3xl font-bold sm:text-4xl ${
                      selectedResume.analysisResult.overallScore >= 75
                        ? 'text-green-600'
                        : selectedResume.analysisResult.overallScore >= 50
                        ? 'text-yellow-600'
                        : 'text-orange-600'
                    }`}>
                      {selectedResume.analysisResult.overallScore}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {EXPERIENCE_LABELS[selectedResume.analysisResult.experienceLevel]}
                    </span>
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-gray-900 dark:text-white">Strengths</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedResume.analysisResult.strengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <span className="text-green-600 flex-shrink-0">✓</span>
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-bold text-gray-900 dark:text-white">Areas for Improvement</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedResume.analysisResult.weaknesses.map((weakness, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                        <span className="text-orange-600 flex-shrink-0">!</span>
                        <span>{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Skills Found ({selectedResume.analysisResult.skillsFound.length})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedResume.analysisResult.skillsFound.slice(0, 10).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Skills Needed ({selectedResume.analysisResult.skillsNeeded.length})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedResume.analysisResult.skillsNeeded.slice(0, 10).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-gray-900 dark:text-white">Improvement Suggestions</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedResume.analysisResult.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${PRIORITY_COLORS[suggestion.priority]}`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{suggestion.icon || '💡'}</span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h5 className="break-words text-sm font-bold">{suggestion.title}</h5>
                              <span className="px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded text-xs font-semibold capitalize">
                                {suggestion.priority}
                              </span>
                            </div>
                            <p className="break-words text-sm opacity-90">{suggestion.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedResume ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-semibold">Analysis not available</p>
                <p className="text-sm">This resume was loaded, but no saved analysis was found.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-semibold">No Resume Selected</p>
                <p className="text-sm">Upload a resume or select one from the list to view analysis</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
