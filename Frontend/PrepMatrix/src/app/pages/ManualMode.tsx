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
import { PageHeader } from '../components/PageHeader';
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
    <div className="min-h-screen bg-[#F7F8FC] text-[#142033] dark:bg-[#070B14] dark:text-[#F4F7FB]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
        <PageHeader
          eyebrow="Curated Question Bank"
          eyebrowIcon={Shuffle}
          title="Curated interview practice across every career path."
          description="Choose question count, difficulty, and professional domain. Each session uses randomized, non-repeating questions from the standardized manual question bank."
          action={
            <div className="hidden grid-cols-3 gap-2 rounded-xl border border-[#DDE3EC] bg-[#F1F4F8] p-1.5 dark:border-[#263449] dark:bg-[#172235]/60 sm:grid sm:min-w-[300px]">
              {[
                { label: 'Domains', value: DOMAINS.length },
                { label: 'Per Level', value: MAX_QUESTIONS_PER_LEVEL },
                { label: 'Session Max', value: 20 },
              ].map((item) => (
                <div key={item.label} className="min-w-0 rounded-lg bg-white p-2 text-center shadow-xs dark:bg-[#101827]">
                  <p className="font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB]">{item.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7F8CA0] dark:text-[#718096]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          }
        />

        <section className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 lg:mt-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
          <aside className="min-w-0 space-y-4">
            <div className="min-w-0 rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
                <CheckCircle2 className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                Session Setup
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#5F6F84] dark:text-[#AAB7CA]">
                    Number of Questions
                  </label>
                  <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:gap-2">
                    {ALLOWED_QUESTION_COUNTS.map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        aria-pressed={questionCount === count}
                        className={`min-h-10 rounded-xl border text-xs font-bold transition-all sm:text-sm ${
                          questionCount === count
                            ? 'border-2 border-[#6D5EF9] bg-[#EEECFF] text-[#5B4BE7] shadow-sm dark:bg-[#1D1B49] dark:text-[#F4F7FB]'
                            : 'border-[#DDE3EC] bg-[#F1F4F8] text-[#5F6F84] hover:border-[#8174FF]/40 dark:border-[#263449] dark:bg-[#172235] dark:text-[#AAB7CA]'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#5F6F84] dark:text-[#AAB7CA]">
                    Difficulty Level
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {DIFFICULTY_LEVELS.map((level) => {
                      const meta = DIFFICULTY_META[level];
                      const Icon = meta.icon;
                      const active = selectedDifficulty === level;

                      return (
                        <button
                          key={level}
                          onClick={() => setSelectedDifficulty(level)}
                          aria-pressed={active}
                          className={`w-full rounded-xl border p-3 text-left transition-all ${
                            active
                              ? 'border-2 border-[#6D5EF9] bg-[#EEECFF] shadow-sm dark:bg-[#1D1B49]'
                              : 'border-[#DDE3EC] bg-white hover:border-[#8174FF]/40 dark:border-[#263449] dark:bg-[#101827]'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                active
                                  ? 'bg-[#6D5EF9] text-white'
                                  : 'bg-[#F1F4F8] text-[#5F6F84] dark:bg-[#172235] dark:text-[#AAB7CA]'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
                                {meta.title}
                              </span>
                              <span className="block truncate text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
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

            <div className="min-w-0 rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5">
              <p className="font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">Selected Interview</p>
              <div className="mt-3 min-w-0 rounded-xl bg-[#F7F8FC] p-3.5 dark:bg-[#172235]/40">
                {selectedDomainDetails ? (
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#6D5EF9] px-2.5 text-xs font-bold text-white">
                      {selectedDomainDetails.icon}
                    </div>
                    <p className="font-display break-words text-base font-bold text-[#142033] dark:text-[#F4F7FB]">
                      {selectedDomainDetails.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                      {selectedDomainDetails.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-[#7F8CA0] dark:text-[#718096]">
                    Select a domain from the list on the right to start your interview.
                  </p>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={!selectedDomain || showInterviewSplash}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6D5EF9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#8174FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#DDE3EC] disabled:text-[#7F8CA0] dark:disabled:bg-[#263449] dark:disabled:text-[#718096]"
              >
                {showInterviewSplash ? 'Preparing session...' : 'Start Manual Interview'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-[14px] border border-[#DDE3EC] bg-white p-4 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
                  <Filter className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                  Browse Domains
                </div>
                <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                  {filteredDomains.length} domains available for the selected category.
                </p>
              </div>

              <div className="relative w-full min-w-0 xl:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F8CA0] dark:text-[#718096]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search domains..."
                  className="min-h-11 w-full rounded-xl border border-[#DDE3EC] bg-[#F1F4F8] py-2.5 pl-10 pr-4 text-sm text-[#142033] outline-none transition focus:border-[#8174FF] focus:ring-2 focus:ring-[#8174FF]/20 dark:border-[#263449] dark:bg-[#172235] dark:text-[#F4F7FB]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {DOMAIN_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`min-w-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategory === category.id
                      ? 'border-[#6D5EF9] bg-[#6D5EF9] text-white'
                      : 'border-[#DDE3EC] bg-[#F1F4F8] text-[#5F6F84] hover:border-[#8174FF]/40 hover:text-[#142033] dark:border-[#263449] dark:bg-[#172235] dark:text-[#AAB7CA] dark:hover:text-[#F4F7FB]'
                  }`}
                >
                  {category.label}
                  <span className="ml-1 text-[11px] opacity-75">{categoryCounts[category.id] ?? 0}</span>
                </button>
              ))}
            </div>

            {/* Denser, lighter list tiles per report recommendation */}
            <div className="mt-4 grid max-h-[44rem] min-w-0 grid-cols-1 gap-2 overflow-y-auto p-1 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDomains.map((domain) => {
                const active = selectedDomain === domain.id;

                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      active
                        ? 'border-2 border-[#6D5EF9] bg-[#EEECFF] shadow-xs dark:bg-[#1D1B49]'
                        : 'border border-[#DDE3EC] bg-white hover:border-[#8174FF]/60 hover:bg-[#F1F4F8] dark:border-[#263449] dark:bg-[#101827] dark:hover:bg-[#172235]'
                    }`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        active
                          ? 'bg-[#6D5EF9] text-white'
                          : 'bg-[#F1F4F8] text-[#5F6F84] dark:bg-[#172235] dark:text-[#AAB7CA]'
                      }`}
                    >
                      {domain.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm font-bold text-[#142033] dark:text-[#F4F7FB]">
                        {domain.name}
                      </span>
                      <span className="block truncate text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                        {domain.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredDomains.length === 0 && (
              <div className="py-12 text-center">
                <Sparkles className="mx-auto h-7 w-7 text-[#7F8CA0] dark:text-[#718096]" />
                <p className="mt-2 text-xs font-bold text-[#142033] dark:text-[#F4F7FB]">No domains found</p>
                <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
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
