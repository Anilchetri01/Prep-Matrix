import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { analyzeResume } from '../utils/resumeAnalyzer';
import type { Resume } from '../types';
import { DOMAINS } from '../data/questions';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageHeader } from '../components/PageHeader';
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
  Target,
  Trophy,
  BriefcaseBusiness,
} from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY_COLORS = {
  high: 'border-[#FB7185]/30 bg-rose-50/70 text-[#E11D48] dark:bg-rose-950/20 dark:text-[#FB7185]',
  medium: 'border-[#FBBF24]/30 bg-amber-50/70 text-[#B45309] dark:bg-amber-950/20 dark:text-[#FBBF24]',
  low: 'border-[#6D5EF9]/30 bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  expert: 'Expert Level',
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

      await hydrateSelectedResume(nextSelectedResume, analysis);
      console.log('[ResumeAnalysis] analyze:success', { id: savedResume.id });
    } catch (err: any) {
      console.error('[ResumeAnalysis] analyze:error', err);
      toast.error('Analysis failed: ' + err.message);
    } finally {
      if (isMountedRef.current) {
        setAnalyzing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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

  const avgScore = resumes.length > 0
    ? Math.round(resumes.reduce((s, r) => s + (r.analysisResult?.overallScore || 0), 0) / resumes.length)
    : 0;
  const bestScore = resumes.length > 0
    ? Math.max(...resumes.map((r) => r.analysisResult?.overallScore || 0))
    : 0;
  const domainCount = new Set(resumes.map((r) => r.domainId)).size;

  const stats = [
    {
      icon: FileText,
      label: 'Total Resumes',
      value: resumes.length,
      iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      icon: Target,
      label: 'Avg Score',
      value: `${avgScore}%`,
      iconClass: avgScore >= 75
        ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399]'
        : avgScore >= 50
        ? 'bg-amber-50 text-[#B45309] dark:bg-amber-950/40 dark:text-[#FBBF24]'
        : 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      icon: Trophy,
      label: 'Best Score',
      value: `${bestScore}%`,
      iconClass: bestScore >= 75
        ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399]'
        : 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
    {
      icon: BriefcaseBusiness,
      label: 'Domains',
      value: domainCount,
      iconClass: 'bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F8FC] text-[#142033] dark:bg-[#070B14] dark:text-[#F4F7FB]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8 lg:py-8">
        {/* Header */}
        <PageHeader
          eyebrow="Resume Intelligence"
          eyebrowIcon={FileText}
          title="Resume Analysis"
          description="Upload your resume and get AI-powered feedback tailored to your target domain."
        />

        {/* Stats */}
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="min-w-0 rounded-[14px] border border-[#DDE3EC] bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#263449] dark:bg-[#101827] sm:p-5"
              >
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl sm:mb-4 sm:h-10 sm:w-10 ${stat.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">{stat.label}</p>
                <p className="mt-1 break-words font-display text-xl font-bold text-[#142033] dark:text-[#F4F7FB] sm:text-2xl">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Upload Section */}
        <div className="min-w-0 rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6 lg:p-7">
          <div className="mb-4 flex min-w-0 items-center gap-2 sm:mb-5">
            <Upload className="h-5 w-5 text-[#5B4BE7] dark:text-[#8174FF]" />
            <h2 className="min-w-0 break-words font-display text-base font-bold text-[#142033] dark:text-[#F4F7FB] sm:text-lg">
              Upload New Resume
            </h2>
          </div>

          {/* Domain Selection */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.10em] text-[#5F6F84] dark:text-[#AAB7CA]">
              Select Target Domain ({filteredDomains.length} available)
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F8CA0] dark:text-[#718096]" />
              <input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#DDE3EC] bg-[#F1F4F8] py-2.5 pl-10 pr-4 text-sm text-[#142033] outline-none transition focus:border-[#8174FF] focus:ring-2 focus:ring-[#8174FF]/20 dark:border-[#263449] dark:bg-[#172235] dark:text-[#F4F7FB]"
              />
            </div>
            {/* Compact list tiles matching Manual Mode per report */}
            <div className="grid max-h-60 min-w-0 grid-cols-1 gap-2 overflow-y-auto p-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDomains.map((domain) => {
                const active = selectedDomain === domain.id;
                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all ${
                      active
                        ? 'border-2 border-[#6D5EF9] bg-[#EEECFF] shadow-xs dark:bg-[#1D1B49]'
                        : 'border border-[#DDE3EC] bg-white hover:border-[#8174FF]/60 hover:bg-[#F1F4F8] dark:border-[#263449] dark:bg-[#101827] dark:hover:bg-[#172235]'
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        active
                          ? 'bg-[#6D5EF9] text-white'
                          : 'bg-[#F1F4F8] text-[#5F6F84] dark:bg-[#172235] dark:text-[#AAB7CA]'
                      }`}
                    >
                      {domain.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-xs font-bold text-[#142033] dark:text-[#F4F7FB]">
                        {domain.name}
                      </span>
                      <span className="block truncate text-[11px] text-[#5F6F84] dark:text-[#AAB7CA]">
                        {domain.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Drop Area */}
          <div className="min-w-0 rounded-xl border-2 border-dashed border-[#DDE3EC] bg-[#F7F8FC] p-4 text-center dark:border-[#263449] dark:bg-[#172235]/40 sm:p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={analyzing || !selectedDomain}
            />
            <div className="flex flex-col items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                {analyzing ? (
                  <div className="animate-spin">
                    <Sparkles className="h-6 w-6" />
                  </div>
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 max-w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing || !selectedDomain}
                  className="min-h-11 max-w-full break-words rounded-xl bg-[#6D5EF9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#8174FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#DDE3EC] disabled:text-[#7F8CA0] dark:disabled:bg-[#263449] dark:disabled:text-[#718096]"
                >
                  {analyzing ? 'Analyzing Resume...' : selectedDomain ? 'Choose File to Upload' : 'Select Domain First'}
                </button>
                <p className="mt-2 text-xs text-[#7F8CA0] dark:text-[#718096]">
                  Supported formats: TXT, PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume List and Analysis */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Resume List */}
          <div className="overflow-hidden rounded-[14px] border border-[#DDE3EC] bg-white shadow-sm dark:border-[#263449] dark:bg-[#101827] lg:col-span-1">
            <div className="border-b border-[#DDE3EC] px-5 py-4 dark:border-[#263449]">
              <h3 className="font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">Your Resumes</h3>
              <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                {resumes.length} resume{resumes.length !== 1 ? 's' : ''} analyzed
              </p>
            </div>
            <div className="max-h-96 divide-y divide-[#DDE3EC] overflow-y-auto dark:divide-[#263449]">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner />
                </div>
              ) : resumes.length === 0 ? (
                <div className="p-8 text-center text-[#7F8CA0] dark:text-[#718096]">
                  <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p className="text-sm">No resumes uploaded yet</p>
                </div>
              ) : (
                resumes.map((resume) => {
                  const score = resume.analysisResult?.overallScore || 0;
                  const isSelected = selectedResume?.id === resume.id;
                  return (
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
                      className={`flex w-full min-w-0 items-center justify-between px-4 py-3 text-left transition-colors sm:px-5 ${
                        isSelected
                          ? 'border-l-2 border-[#6D5EF9] bg-[#EEECFF]/60 dark:bg-[#1D1B49]/50'
                          : 'hover:bg-[#F1F4F8]/60 dark:hover:bg-[#172235]/40'
                      }`}
                    >
                      <div className="flex flex-1 min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F4F8] text-xs font-bold text-[#5F6F84] dark:bg-[#172235] dark:text-[#AAB7CA]">
                          {DOMAINS.find((d) => d.id === resume.domainId)?.icon ?? '📋'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-display text-sm font-semibold text-[#142033] dark:text-[#F4F7FB]">
                            {resume.fileName}
                          </p>
                          <p className="truncate text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                            {resume.domainName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className={`font-display text-base font-bold ${
                            score >= 75
                              ? 'text-[#059669] dark:text-[#34D399]'
                              : score >= 50
                              ? 'text-[#B45309] dark:text-[#FBBF24]'
                              : 'text-[#E11D48] dark:text-[#FB7185]'
                          }`}>
                            {score}%
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteResume(resume.id);
                            }}
                            aria-label={`Delete ${resume.fileName}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#7F8CA0] transition-colors hover:bg-rose-500/10 hover:text-[#E11D48] dark:text-[#718096] dark:hover:text-[#FB7185]"
                            title="Delete resume"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Analysis Details */}
          <div className="min-w-0 rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6 lg:col-span-2">
            {selectedResume?.analysisResult ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="mb-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-all font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB] sm:break-words sm:text-xl">
                        {selectedResume.fileName}
                      </h3>
                      <p className="break-words text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                        {selectedResume.domainName} • Uploaded {format(new Date(selectedResume.uploadedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className={`shrink-0 font-display text-2xl font-bold sm:text-3xl ${
                      selectedResume.analysisResult.overallScore >= 75
                        ? 'text-[#059669] dark:text-[#34D399]'
                        : selectedResume.analysisResult.overallScore >= 50
                        ? 'text-[#B45309] dark:text-[#FBBF24]'
                        : 'text-[#E11D48] dark:text-[#FB7185]'
                    }`}>
                      {selectedResume.analysisResult.overallScore}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Award className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                    <span className="rounded-md bg-[#EEECFF] px-2 py-0.5 font-semibold text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                      {EXPERIENCE_LABELS[selectedResume.analysisResult.experienceLevel] || selectedResume.analysisResult.experienceLevel}
                    </span>
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <div className="mb-2.5 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#059669] dark:text-[#34D399]" />
                    <h4 className="font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">Strengths</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedResume.analysisResult.strengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-relaxed text-[#142033] dark:text-[#F4F7FB]">
                        <span className="shrink-0 font-bold text-[#059669] dark:text-[#34D399]">✓</span>
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <div className="mb-2.5 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#B45309] dark:text-[#FBBF24]" />
                    <h4 className="font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">Areas for Improvement</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedResume.analysisResult.weaknesses.map((weakness, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-[#142033] dark:text-[#F4F7FB]">
                        <span className="shrink-0 font-bold text-[#B45309] dark:text-[#FBBF24]">!</span>
                        <span>{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-display text-xs font-bold text-[#142033] dark:text-[#F4F7FB]">
                      Skills Found ({selectedResume.analysisResult.skillsFound.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedResume.analysisResult.skillsFound.slice(0, 10).map((skill) => (
                        <span key={skill} className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-[#059669] dark:text-[#34D399]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 font-display text-xs font-bold text-[#142033] dark:text-[#F4F7FB]">
                      Skills Needed ({selectedResume.analysisResult.skillsNeeded.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedResume.analysisResult.skillsNeeded.slice(0, 10).map((skill) => (
                        <span key={skill} className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-[#B45309] dark:text-[#FBBF24]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <div className="mb-2.5 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                    <h4 className="font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">Improvement Suggestions</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedResume.analysisResult.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3.5 sm:p-4 ${PRIORITY_COLORS[suggestion.priority]}`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="shrink-0 text-lg">{suggestion.icon || '💡'}</span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h5 className="break-words font-display text-xs font-bold">{suggestion.title}</h5>
                              <span className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider dark:bg-black/30">
                                {suggestion.priority}
                              </span>
                            </div>
                            <p className="break-words text-xs leading-relaxed opacity-90">{suggestion.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedResume ? (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-[#7F8CA0] dark:text-[#718096]">
                <BarChart3 className="mb-3 h-12 w-12 opacity-30" />
                <p className="font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">Analysis not available</p>
                <p className="mt-1 text-xs">This resume was loaded, but no saved analysis was found.</p>
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-[#7F8CA0] dark:text-[#718096]">
                <BarChart3 className="mb-3 h-12 w-12 opacity-30" />
                <p className="font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">No Resume Selected</p>
                <p className="mt-1 text-xs">Upload a resume or select one from the list to view analysis.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
