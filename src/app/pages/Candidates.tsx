import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { User } from '../types';
import { Navbar } from '../components/Navbar';
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
        backgroundColor: user.avatarColor ?? '#6366F1',
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${score >= 75 ? 'text-green-600 dark:text-green-400' : score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
        {score}%
      </span>
    </div>
  );
}

function ProfileModal({ user, onClose }: { user: PublicUser; onClose: () => void }) {
  const skills = typeof user.skills === 'string'
    ? (user.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
    : Array.isArray(user.skills)
    ? user.skills
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-start gap-4">
          <UserAvatarDisplay user={user} size={72} />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-xl truncate">{user.name}</h2>
            {user.username && <p className="text-indigo-200 text-sm">@{user.username}</p>}
            {user.jobTitle && (
              <p className="text-indigo-100 text-sm flex items-center gap-1 mt-1">
                <Briefcase className="w-3 h-3" /> {user.jobTitle}
              </p>
            )}
            {user.location && (
              <p className="text-indigo-200 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {user.location}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Interviews', value: user.totalInterviews, icon: '📝' },
              { label: 'Avg Score', value: `${user.averageScore}%`, icon: '⭐' },
              { label: 'Best Score', value: `${user.bestScore}%`, icon: '🏆' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl mb-0.5">{s.icon}</div>
                <p className="font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">About</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{user.bio}</p>
            </div>
          )}

          {/* Education & Experience */}
          {(user.education || user.experienceLevel) && (
            <div className="grid grid-cols-2 gap-3">
              {user.education && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Education</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{user.education}</p>
                  </div>
                </div>
              )}
              {user.experienceLevel && (
                <div className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{user.experienceLevel}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(user.linkedinUrl || user.githubUrl || user.portfolioUrl) && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Links</h4>
              <div className="flex gap-3">
                {user.linkedinUrl && (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {user.githubUrl && (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 hover:underline"
                  >
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {user.portfolioUrl && (
                  <a
                    href={user.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:underline"
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
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Interview Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Total Interviews</span>
                  <span className="font-semibold">{user.totalInterviews}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Average Score</span>
                    <span className="font-semibold">{user.averageScore}%</span>
                  </div>
                  <ScoreBar score={user.averageScore} />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Best Score</span>
                    <span className="font-semibold">{user.bestScore}%</span>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-7 h-7" />
            <h1 className="text-2xl font-bold">Explore Candidates</h1>
          </div>
          <p className="text-indigo-100 text-sm">
            Discover other users on the platform, view their profiles, skills, and interview performance.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {!loading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Showing {filtered.length} of {users.length} candidate{users.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading candidates..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {users.length === 0 ? 'No candidates yet' : 'No results found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {users.length === 0
                ? 'Be the first to create an account and set up your profile!'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((user) => {
              const skills = typeof user.skills === 'string'
                ? (user.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
                : Array.isArray(user.skills)
                ? user.skills
                : [];

              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 flex items-center gap-4">
                    <UserAvatarDisplay user={user} size={52} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{user.name}</h3>
                      {user.username && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">@{user.username}</p>
                      )}
                      {user.jobTitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <Briefcase className="w-3 h-3 flex-shrink-0" />
                          {user.jobTitle}
                        </p>
                      )}
                    </div>
                    {user.totalInterviews > 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${user.averageScore >= 75 ? 'text-green-600 dark:text-green-400' : user.averageScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {user.averageScore}%
                        </p>
                        <p className="text-xs text-gray-400">avg</p>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-3">
                    {/* Bio */}
                    {user.bio ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{user.bio}</p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-600 italic">No bio provided</p>
                    )}

                    {/* Skills preview */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                            +{skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Interview stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {user.totalInterviews} interview{user.totalInterviews !== 1 ? 's' : ''}
                      </span>
                      {user.bestScore > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          Best: {user.bestScore}%
                        </span>
                      )}
                    </div>

                    {/* View Profile button */}
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="w-full mt-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
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
