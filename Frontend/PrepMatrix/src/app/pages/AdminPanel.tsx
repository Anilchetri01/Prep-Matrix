import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { AdminUser, AdminStats } from '../types';
import { Navbar } from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  Users, BarChart2, ShieldCheck, ShieldX, Trash2, RefreshCw,
  Search, TrendingUp, Award, FileText, Star,
} from 'lucide-react';
import { format } from 'date-fns';

function UserAvatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color ?? '#6366F1', fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export function AdminPanel() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const loadData = async (showLoading = true) => {
    if (showLoading && isMountedRef.current) {
      setLoading(true);
    }

    try {
      console.log('[AdminPanel] load:start');
      const [usersData, statsData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
      ]);

      if (!isMountedRef.current) return;

      setUsers(usersData);
      setStats(statsData);
      console.log('[AdminPanel] load:success', {
        statsLoaded: Boolean(statsData),
        users: usersData.length,
      });
    } catch (err: any) {
      console.error('[AdminPanel] load:error', err);
      if (isMountedRef.current) {
        toast.error('Failed to load admin data: ' + err.message);
      }
    } finally {
      if (showLoading && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      void loadData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    if (userId === currentUser?.id) { toast.error("You can't change your own role"); return; }
    if (isMountedRef.current) {
      setActionUserId(userId);
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      console.log('[AdminPanel] roleUpdate:start', { newRole, userId });
      await api.updateUserRole(userId, newRole);

      if (!isMountedRef.current) return;

      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole}`);
      console.log('[AdminPanel] roleUpdate:success', { newRole, userId });
    } catch (err: any) {
      console.error('[AdminPanel] roleUpdate:error', err);
      if (isMountedRef.current) {
        toast.error('Failed to update role: ' + err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setActionUserId(null);
      }
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) { toast.error("You can't delete yourself"); return; }
    if (!confirm(`Delete user "${userName}"? All their data will be permanently removed.`)) return;
    if (isMountedRef.current) {
      setActionUserId(userId);
    }
    try {
      console.log('[AdminPanel] delete:start', { userId, userName });
      await api.deleteUser(userId);

      if (!isMountedRef.current) return;

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User deleted');

      const statsData = await api.getAdminStats();
      if (isMountedRef.current) {
        setStats(statsData);
      }
      console.log('[AdminPanel] delete:success', { userId });
    } catch (err: any) {
      console.error('[AdminPanel] delete:error', err);
      if (isMountedRef.current) {
        toast.error('Failed to delete: ' + err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setActionUserId(null);
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Daily activity chart data
  const activityData = stats
    ? Object.entries(stats.dailyActivity)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
          date: format(new Date(date), 'MMM dd'),
          count,
        }))
    : [];

  // Top domains chart
  const domainData = stats?.topDomains.slice(0, 8) ?? [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" /> Admin Panel
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage users and monitor platform activity
            </p>
          </div>
          <button
            onClick={() => {
              void loadData();
            }}
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-2 border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="Admin sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                role="tab"
                aria-selected={activeTab === id}
                className={`flex min-h-12 min-w-0 items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition-colors sm:px-6 ${
                  activeTab === id
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 p-4 sm:p-6">
              {loading ? (
                <LoadingSpinner message="Loading stats..." />
              ) : stats ? (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    {[
                      { icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Total Users', value: stats.totalUsers },
                      { icon: <FileText className="w-5 h-5 text-green-600" />, bg: 'bg-green-100 dark:bg-green-900/30', label: 'Total Interviews', value: stats.totalInterviews },
                      { icon: <Star className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Platform Avg', value: `${stats.averageScore}%` },
                      { icon: <TrendingUp className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Admins', value: users.filter((u) => u.role === 'admin').length },
                    ].map((s) => (
                      <div key={s.label} className="min-w-0 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/50 sm:p-4">
                        <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                          {s.icon}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                        <p className="break-words text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity chart */}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
                        Daily Activity (Last 7 Days)
                      </h3>
                      {activityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                            <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                            <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-44 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
                          No activity in the last 7 days
                        </div>
                      )}
                    </div>

                    {/* Top domains */}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
                        Top Domains
                      </h3>
                      {domainData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={domainData} layout="vertical">
                            <XAxis type="number" tick={{ fontSize: 10 }} stroke="#6B7280" />
                            <YAxis dataKey="domain" type="category" tick={{ fontSize: 9 }} stroke="#6B7280" width={100} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                            <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-44 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
                          No interview data yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Difficulty breakdown */}
                  {Object.keys(stats.difficultyCounts).length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
                        Difficulty Distribution
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((d) => {
                          const count = stats.difficultyCounts[d] ?? 0;
                          const total = Object.values(stats.difficultyCounts).reduce((a, b) => a + b, 0);
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          const colors: Record<string, string> = {
                            beginner: 'bg-green-500', intermediate: 'bg-blue-500',
                            advanced: 'bg-purple-500', expert: 'bg-red-500',
                          };
                          return (
                            <div key={d} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">{d}</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{count}</p>
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mt-2">
                                <div className={`h-full ${colors[d]} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{pct}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No stats available</p>
              )}
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <div className="space-y-4 p-4 sm:p-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {loading ? (
                <LoadingSpinner message="Loading users..." />
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No users match your search.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((u) => {
                    const isCurrentUser = u.id === currentUser?.id;
                    const isActioning = actionUserId === u.id;
                    return (
                      <div
                        key={u.id}
                        className={`flex min-w-0 flex-col gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${
                          isCurrentUser
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <UserAvatar name={u.name} color={u.avatarColor} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{u.name}</p>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold">You</span>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                              u.role === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{u.email}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            <span>📝 {u.totalInterviews} interviews</span>
                            {u.totalInterviews > 0 && <span>⭐ Avg: {u.averageScore}%</span>}
                            <span>📅 {format(new Date(u.createdAt), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>

                        {!isCurrentUser && (
                          <div className="flex w-full flex-shrink-0 items-center justify-end gap-2 sm:w-auto">
                            <button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              disabled={isActioning}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              aria-label={u.role === 'admin' ? `Remove admin role from ${u.name}` : `Make ${u.name} an admin`}
                              className={`inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                                u.role === 'admin'
                                  ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                              } disabled:opacity-40`}
                            >
                              {isActioning ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : u.role === 'admin' ? (
                                <ShieldX className="w-4 h-4" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              disabled={isActioning}
                              title="Delete user"
                              aria-label={`Delete ${u.name}`}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
