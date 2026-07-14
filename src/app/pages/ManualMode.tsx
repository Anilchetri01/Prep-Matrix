import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Filter,
  Layers3,
  Search,
  Shuffle,
  Sparkles,
} from 'lucide-react';

import { Footer } from '../components/Footer';
import { InterviewLaunchOverlay } from '../components/InterviewLaunchOverlay';
import { Navbar } from '../components/Navbar';
import {
  ALLOWED_QUESTION_COUNTS,
  DIFFICULTY_LEVELS,
  DOMAIN_CATEGORIES,
  DOMAINS,
  DifficultyLevel,
  MAX_QUESTIONS_PER_LEVEL,
} from '../data/questions';

const DIFFICULTY_META: Record<
  DifficultyLevel,
  {
    title: string;
    description: string;
    icon: typeof BookOpen;
  }
> = {
  beginner: {
    title: 'Beginner',
    description: 'Fundamentals, definitions, and entry-level workflows.',
    icon: BookOpen,
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Practical scenarios, troubleshooting, and role workflows.',
    icon: Layers3,
  },
  advanced: {
    title: 'Advanced',
    description: 'Architecture, optimization, strategy, and complex trade-offs.',
    icon: Brain,
  },
};

export function ManualMode() {
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('beginner');
  const [questionCount, setQuestionCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInterviewSplash, setShowInterviewSplash] = useState(false);
  const launchTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    },
    [],
  );

  const categoryCounts = useMemo(
    () =>
      DOMAIN_CATEGORIES.reduce<Record<string, number>>((counts, category) => {
        counts[category.id] =
          category.id === 'all'
            ? DOMAINS.length
            : DOMAINS.filter((domain) => domain.category === category.id).length;
        return counts;
      }, {}),
    [],
  );

  const filteredDomains = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return DOMAINS.filter((domain) => {
      const matchesCategory = selectedCategory === 'all' || domain.category === selectedCategory;
      const matchesSearch =
        !normalizedQuery ||
        domain.name.toLowerCase().includes(normalizedQuery) ||
        domain.description.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const selectedDomainDetails = DOMAINS.find((domain) => domain.id === selectedDomain);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (
      selectedDomain &&
      categoryId !== 'all' &&
      DOMAINS.find((domain) => domain.id === selectedDomain)?.category !== categoryId
    ) {
      setSelectedDomain('');
    }
  };

  const handleStart = () => {
    if (!selectedDomain) {
      toast.warning('Please select a domain first');
      return;
    }

    setShowInterviewSplash(true);
    launchTimerRef.current = window.setTimeout(() => {
      navigate(
        `/interview?domain=${selectedDomain}&difficulty=${selectedDifficulty}&count=${questionCount}`,
      );
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
            <div className="min-w-0 max-w-3xl">
              <div className="mb-2 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 sm:mb-3 sm:tracking-[0.18em]">
                <Shuffle className="h-3.5 w-3.5" />
                Manual Mode
              </div>
              <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Curated interview practice across every career path.
              </h1>
              <p className="mt-2 line-clamp-2 max-w-2xl break-words text-sm leading-6 text-slate-600 dark:text-slate-300 sm:mt-3 sm:line-clamp-none sm:text-base">
                Choose a question count, difficulty, and professional domain. Each session uses randomized, non-repeating questions from the standardized manual question bank.
              </p>
            </div>

            <div className="hidden w-full grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-950/60 sm:grid sm:min-w-[320px] lg:w-auto">
              {[
                { label: 'Domains', value: DOMAINS.length },
                { label: 'Per Level', value: MAX_QUESTIONS_PER_LEVEL },
                { label: 'Session Max', value: 20 },
              ].map((item) => (
                <div key={item.label} className="min-w-0 rounded-lg bg-white p-3 text-center shadow-sm dark:bg-white/5">
                  <p className="text-xl font-bold text-slate-950 dark:text-white">{item.value}</p>
                  <p className="mt-0.5 break-words text-[11px] font-medium uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 lg:mt-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
          <aside className="min-w-0 space-y-4">
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                Session Setup
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Number of Questions
                  </label>
                  <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
                    {ALLOWED_QUESTION_COUNTS.map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        aria-pressed={questionCount === count}
                        className={`min-h-11 rounded-xl border px-2 py-2.5 text-sm font-bold transition-all sm:px-3 sm:py-3 ${
                          questionCount === count
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Difficulty Level
                  </label>
                  <div className="mt-3 space-y-2">
                    {DIFFICULTY_LEVELS.map((level) => {
                      const meta = DIFFICULTY_META[level];
                      const Icon = meta.icon;
                      const active = selectedDifficulty === level;

                      return (
                        <button
                          key={level}
                          onClick={() => setSelectedDifficulty(level)}
                          aria-pressed={active}
                          className={`min-h-11 w-full rounded-xl border p-3 text-left transition-all ${
                            active
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm dark:bg-indigo-500/15'
                              : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-white/10 dark:bg-white/5'
                          }`}
                        >
                          <div className="flex min-w-0 gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                active
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block break-words text-sm font-bold text-slate-950 dark:text-white">
                                {meta.title}
                              </span>
                              <span className="mt-0.5 block break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {meta.description}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Selected Interview</p>
              <div className="mt-4 min-w-0 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
                {selectedDomainDetails ? (
                  <div className="min-w-0">
                    <div className="mb-3 inline-flex h-11 min-w-11 max-w-full items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-bold text-white">
                      {selectedDomainDetails.icon}
                    </div>
                    <p className="break-words text-lg font-bold text-slate-950 dark:text-white">
                      {selectedDomainDetails.name}
                    </p>
                    <p className="mt-1 line-clamp-3 break-words text-sm leading-5 text-slate-600 dark:text-slate-300">
                      {selectedDomainDetails.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Select a domain to prepare your dedicated manual interview.
                  </p>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={!selectedDomain || showInterviewSplash}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700"
              >
                {showInterviewSplash ? 'Preparing session...' : 'Start Manual Interview'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Filter className="h-4 w-4 text-indigo-500" />
                  Browse Domains
                </div>
                <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                  {filteredDomains.length} domains available for the selected filters.
                </p>
              </div>

              <div className="relative w-full min-w-0 xl:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search domains..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {DOMAIN_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`min-w-0 rounded-xl border px-3 py-2 text-left text-sm font-semibold leading-snug transition-colors sm:px-3.5 ${
                    selectedCategory === category.id
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                  }`}
                >
                  {category.label}
                  <span className="ml-1.5 text-xs opacity-75">{categoryCounts[category.id] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid max-h-[42rem] min-w-0 grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDomains.map((domain) => {
                const active = selectedDomain === domain.id;

                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={`min-h-[142px] w-full min-w-0 rounded-xl border p-3.5 text-left transition-all sm:p-4 ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10 dark:bg-indigo-500/15'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg px-2.5 text-sm font-bold ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {domain.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-[17px] font-semibold leading-snug text-slate-950 dark:text-white">
                          {domain.name}
                        </span>
                        <span className="mt-1.5 line-clamp-3 block break-words text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                          {domain.description}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredDomains.length === 0 && (
              <div className="py-12 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No domains found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try a different search term or category.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />
      <InterviewLaunchOverlay visible={showInterviewSplash} />
    </div>
  );
}
