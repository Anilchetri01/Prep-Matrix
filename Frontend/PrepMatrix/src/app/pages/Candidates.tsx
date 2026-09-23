import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { User } from '../types';
import { Navbar } from '../components/Navbar';
import { PageHeader } from '../components/PageHeader';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Search, X, Github, Linkedin, Globe, MapPin, GraduationCap, Briefcase, Trophy, Star, Users } from 'lucide-react';

type PublicUser = User & { totalInterviews: number; averageScore: number; bestScore: number };

function UserAvatarDisplay({
  user,
  size = 56,
}: {
  user: Pick<User, 'name' | 'avatarColor' | 'profilePicture'>;
  size?: number;
}) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (user.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.name}
        className="rounded-full object-cover shadow-md"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: user.avatarColor ?? '#6D5EF9',
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const isHigh = score >= 75;
  const isMid = score >= 50;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#DDE3EC] dark:bg-[#263449]">
        <div
          className={`h-full rounded-full ${isHigh ? 'bg-[#059669] dark:bg-[#34D399]' : isMid ? 'bg-[#B45309] dark:bg-[#FBBF24]' : 'bg-[#E11D48] dark:bg-[#FB7185]'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${isHigh ? 'text-[#059669] dark:text-[#34D399]' : isMid ? 'text-[#B45309] dark:text-[#FBBF24]' : 'text-[#E11D48] dark:text-[#FB7185]'}`}>
        {score}%
      </span>
    </div>
  );
}

function ProfileModal({ user, onClose }: { user: PublicUser; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const skills = typeof user.skills === 'string'
    ? (user.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
    : Array.isArray(user.skills)
    ? user.skills
    : [];

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-profile-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div ref={modalRef} className="relative flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden border border-[#DDE3EC] bg-white shadow-2xl dark:border-[#263449] dark:bg-[#101827] sm:h-auto sm:max-h-[85vh] sm:rounded-[14px]">
        {/* Header */}
        <div className="flex min-w-0 items-start gap-3 border-b border-[#DDE3EC] bg-[#F1F4F8] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-[#263449] dark:bg-[#172235] sm:gap-4 sm:p-6">
          <UserAvatarDisplay user={user} size={72} />
          <div className="flex-1 min-w-0">
            <h2 id="candidate-profile-title" className="truncate font-display text-xl font-bold text-[#142033] dark:text-[#F4F7FB]">{user.name}</h2>
            {user.username && <p className="text-xs text-[#5B4BE7] dark:text-[#8174FF]">@{user.username}</p>}
            {user.jobTitle && (
              <p className="mt-1 flex items-center gap-1 text-sm text-[#5F6F84] dark:text-[#AAB7CA]">
                <Briefcase className="w-3.5 h-3.5" /> {user.jobTitle}
              </p>
            )}
            {user.location && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[#7F8CA0] dark:text-[#718096]">
                <MapPin className="w-3 h-3" /> {user.location}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close candidate profile"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5F6F84] transition-colors hover:bg-black/5 hover:text-[#142033] dark:text-[#AAB7CA] dark:hover:bg-white/10 dark:hover:text-[#F4F7FB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Interviews', value: user.totalInterviews, icon: Trophy },
              { label: 'Avg Score', value: `${user.averageScore}%`, icon: Star },
              { label: 'Best Score', value: `${user.bestScore}%`, icon: Users },
            ].map((s) => (
              <div key={s.label} className="min-w-0 rounded-[10px] border border-[#DDE3EC] bg-[#F1F4F8] p-2.5 text-center dark:border-[#263449] dark:bg-[#172235] sm:p-3">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="break-words font-display font-bold text-[#142033] dark:text-[#F4F7FB]">{s.value}</p>
                <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#5F6F84] dark:text-[#AAB7CA]">About</h4>
              <p className="text-sm text-[#142033] dark:text-[#F4F7FB]">{user.bio}</p>
            </div>
          )}

          {/* Education & Experience */}
          {(user.education || user.experienceLevel) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {user.education && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-[#6D5EF9] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Education</p>
                    <p className="text-sm font-medium text-[#142033] dark:text-[#F4F7FB]">{user.education}</p>
                  </div>
                </div>
              )}
              {user.experienceLevel && (
                <div className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-[#6D5EF9] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">Experience</p>
                    <p className="text-sm font-medium text-[#142033] dark:text-[#F4F7FB]">{user.experienceLevel}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6F84] dark:text-[#AAB7CA] mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-[#EEECFF] px-2.5 py-1 text-xs font-medium text-[#6D5EF9] dark:bg-[#1D1B49] dark:text-[#8E82FA]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(user.linkedinUrl || user.githubUrl || user.portfolioUrl) && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6F84] dark:text-[#AAB7CA] mb-2">Links</h4>
              <div className="flex flex-wrap gap-3">
                {user.linkedinUrl && (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#5B4BE7] dark:text-[#8174FF] hover:underline"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {user.githubUrl && (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA] hover:underline"
                  >
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {user.portfolioUrl && (
                  <a
                    href={user.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#6D5EF9] dark:text-[#8E82FA] hover:underline"
                  >
                    <Globe className="w-4 h-4" /> Portfolio
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Interview history (scores only) */}
          {user.totalInterviews > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#5F6F84] dark:text-[#AAB7CA] uppercase tracking-wide mb-2">
                Interview Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-[#5F6F84] dark:text-[#AAB7CA]">
                  <span>Total Interviews</span>
                  <span className="font-semibold text-[#142033] dark:text-[#F4F7FB]">{user.totalInterviews}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-[#5F6F84] dark:text-[#AAB7CA] mb-1">
                    <span>Average Score</span>
                    <span className="font-semibold text-[#142033] dark:text-[#F4F7FB]">{user.averageScore}%</span>
                  </div>
                  <ScoreBar score={user.averageScore} />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-[#5F6F84] dark:text-[#AAB7CA] mb-1">
                    <span>Best Score</span>
                    <span className="font-semibold text-[#142033] dark:text-[#F4F7FB]">{user.bestScore}%</span>
                  </div>
                  <ScoreBar score={user.bestScore} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Candidates() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const loadCandidates = async () => {
    try {
      console.log('[Candidates] load:start');
      const data = await api.getPublicUsers();

      if (!isMountedRef.current) return;

      setUsers(data);
      console.log('[Candidates] load:success', { count: data.length });
    } catch (error: any) {
      console.error('[Candidates] load:error', error);
      if (isMountedRef.current) {
        toast.error(error?.message || 'Unable to load candidates.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      void loadCandidates();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.username?.toLowerCase().includes(q) ?? false) ||
      (u.jobTitle?.toLowerCase().includes(q) ?? false) ||
      (u.bio?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F8FC] dark:bg-[#070B14]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <PageHeader
          title="Explore Candidates"
          eyebrow="Community Directory"
          description="Discover other users on the platform, view their profiles, skills, and interview performance."
        />

        {/* Search */}
        <div className="rounded-[14px] border border-[#DDE3EC] bg-white p-4 dark:border-[#263449] dark:bg-[#101827]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8CA0] dark:text-[#718096]" />
            <input
              type="text"
              placeholder="Search by name, username, job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#DDE3EC] bg-[#F1F4F8] pl-10 pr-4 text-sm text-[#142033] placeholder-[#7F8CA0] focus:border-[#5B4BE7] focus:outline-none focus:ring-2 focus:ring-[#6D5EF9]/20 dark:border-[#263449] dark:bg-[#172235] dark:text-[#F4F7FB] dark:placeholder-[#718096] dark:focus:border-[#8174FF]"
            />
          </div>
          {!loading && (
            <p className="mt-2 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
              Showing {filtered.length} of {users.length} candidate{users.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading candidates..." />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-[#7F8CA0] dark:text-[#718096]" />
            <h3 className="font-display font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1">
              {users.length === 0 ? 'No candidates yet' : 'No results found'}
            </h3>
            <p className="text-sm text-[#5F6F84] dark:text-[#AAB7CA]">
              {users.length === 0
                ? 'Be the first to create an account and set up your profile!'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((user) => {
              const skills = typeof user.skills === 'string'
                ? (user.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
                : Array.isArray(user.skills)
                ? user.skills
                : [];

              return (
                <div
                  key={user.id}
                  className="overflow-hidden rounded-[14px] border border-[#DDE3EC] bg-white transition-colors hover:border-[#6D5EF9]/40 dark:border-[#263449] dark:bg-[#101827] dark:hover:border-[#6D5EF9]/40"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3.5 border-b border-[#DDE3EC] bg-[#F1F4F8]/50 p-4 dark:border-[#263449] dark:bg-[#172235]/40">
                    <UserAvatarDisplay user={user} size={48} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-base font-bold text-[#142033] dark:text-[#F4F7FB]">{user.name}</h3>
                      {user.username && (
                        <p className="text-xs text-[#5B4BE7] dark:text-[#8174FF]">@{user.username}</p>
                      )}
                      {user.jobTitle && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          {user.jobTitle}
                        </p>
                      )}
                    </div>
                    {user.totalInterviews > 0 && (
                      <div className="shrink-0 text-right">
                        <p className={`font-display text-sm font-bold ${
                          user.averageScore >= 75
                            ? 'text-[#059669] dark:text-[#34D399]'
                            : user.averageScore >= 50
                            ? 'text-[#B45309] dark:text-[#FBBF24]'
                            : 'text-[#E11D48] dark:text-[#FB7185]'
                        }`}>
                          {user.averageScore}%
                        </p>
                        <p className="text-xs text-[#7F8CA0] dark:text-[#718096]">avg</p>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="space-y-3 p-4">
                    {/* Bio */}
                    {user.bio ? (
                      <p className="line-clamp-2 text-xs leading-5 text-[#5F6F84] dark:text-[#AAB7CA]">{user.bio}</p>
                    ) : (
                      <p className="text-xs italic text-[#7F8CA0] dark:text-[#718096]">No bio provided</p>
                    )}

                    {/* Skills preview */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-[#EEECFF] px-2 py-0.5 text-xs font-medium text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="rounded-md bg-[#F1F4F8] px-2 py-0.5 text-xs text-[#5F6F84] dark:bg-[#172235] dark:text-[#AAB7CA]">
                            +{skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Interview stats */}
                    <div className="flex items-center gap-3 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-[#5B4BE7] dark:text-[#8174FF]" />
                        {user.totalInterviews} interview{user.totalInterviews !== 1 ? 's' : ''}
                      </span>
                      {user.bestScore > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-[#FBBF24]" />
                          Best: {user.bestScore}%
                        </span>
                      )}
                    </div>

                    {/* View Profile button - restrained secondary */}
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="mt-1 h-10 w-full rounded-[10px] border border-[#DDE3EC] bg-[#F1F4F8] text-xs font-semibold text-[#142033] transition-colors hover:border-[#6D5EF9] hover:bg-[#EEECFF] hover:text-[#5B4BE7] dark:border-[#263449] dark:bg-[#172235] dark:text-[#F4F7FB] dark:hover:border-[#8174FF] dark:hover:bg-[#1D1B49] dark:hover:text-[#8174FF]"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Profile Modal */}
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
