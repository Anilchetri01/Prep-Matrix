import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import type { User as AppUser } from '../types';
import { AppLogo } from './AppLogo';
import { APP_NAME } from '../constants/branding';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  LayoutDashboard,
  History,
  Trophy,
  User,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Menu,
  X,
  FileText,
  Users,
  Sparkles,
  ClipboardList,
  LoaderCircle,
} from 'lucide-react';

// ── User Avatar ────────────────────────────────────────────────────────────────

function UserAvatar({
  color,
  imageUrl,
  name,
  size = 'sm',
}: {
  color?: string;
  imageUrl?: string;
  name: string;
  size?: 'sm' | 'lg';
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const sizeClasses = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-base';

  return (
    <Avatar
      className={`${sizeClasses} shrink-0 rounded-full border border-white/10 shadow`}
    >
      <AvatarImage src={imageUrl || ''} alt="User avatar" className="object-cover" />
      <AvatarFallback
        className="font-bold text-white"
        style={{ backgroundColor: color ?? '#6366F1' }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// ── Nav Link ──────────────────────────────────────────────────────────────────

function NavLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────

function LogoutConfirmationDialog({
  error,
  isSigningOut,
  onConfirm,
  onOpenChange,
  open,
}: {
  error: string | null;
  isSigningOut: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const confirmButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          confirmButtonRef.current?.focus();
        }}
        className="max-w-[calc(100%-1.5rem)] overflow-hidden rounded-xl border-slate-200/80 bg-white/95 p-0 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl duration-150 data-[state=closed]:scale-[0.98] data-[state=open]:scale-100 dark:border-white/10 dark:bg-slate-950/95 dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.46)] sm:max-w-[23rem]"
      >
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-white/35" />
        <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <DialogHeader className="gap-0 text-left">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-gradient-to-b from-red-50 to-white text-red-600 shadow-[0_0_28px_rgba(248,113,113,0.16)] dark:border-red-300/15 dark:from-red-400/15 dark:to-red-500/5 dark:text-red-200 dark:shadow-[0_0_28px_rgba(248,113,113,0.14)]">
              <LogOut className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 pr-7">
              <DialogTitle className="text-[1.0625rem] font-semibold leading-7 tracking-normal text-slate-950 dark:text-white">
                Sign Out?
              </DialogTitle>
              <DialogDescription className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                Are you sure you want to sign out of PrepMatrix?
              </DialogDescription>
            </div>
          </DialogHeader>

          {error && (
            <p
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200"
              role="alert"
            >
              {error}
            </p>
          )}

          <DialogFooter className="mt-5 gap-2.5 sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSigningOut}
              aria-label="Cancel sign out"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.03)] dark:focus:ring-indigo-300/70 dark:focus:ring-offset-slate-950"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isSigningOut}
              aria-label="Confirm sign out"
              className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-md bg-gradient-to-b from-red-500 to-red-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(220,38,38,0.24)] transition-all duration-150 hover:from-red-400 hover:to-red-500 hover:shadow-[0_12px_28px_rgba(220,38,38,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500/35 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-75 dark:shadow-[0_10px_24px_rgba(127,29,29,0.28)] dark:hover:shadow-[0_12px_28px_rgba(127,29,29,0.34)] dark:focus:ring-red-300/80 dark:focus:ring-offset-slate-950"
            >
              {isSigningOut && (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { settings, toggleDarkMode, toggleVoice } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const avatarUrl = (currentUser: AppUser | null) =>
    currentUser?.avatar_url || currentUser?.profilePicture || '';

  const openLogoutDialog = () => {
    setMobileOpen(false);
    setLogoutError(null);
    setLogoutDialogOpen(true);
  };

  const handleLogoutDialogOpenChange = (open: boolean) => {
    if (isSigningOut) return;

    setLogoutDialogOpen(open);
    if (!open) {
      setLogoutError(null);
    }
  };

  const confirmLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setLogoutError(null);

    try {
      await logout();
      setLogoutDialogOpen(false);
      navigate('/login');
    } catch {
      setLogoutError('Unable to sign out right now. Please try again.');
      setIsSigningOut(false);
    }
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/manual-mode', icon: ClipboardList, label: 'Manual Mode' },
    { to: '/ai-mode', icon: Sparkles, label: 'AI Mode' },
    { to: '/resume-analysis', icon: FileText, label: 'Resume Analysis' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/candidates', icon: Users, label: 'Candidates' },
    { to: '/profile', icon: User, label: 'Profile' },
    ...(user?.role === 'admin'
      ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin' }]
      : []),
  ];

  const primaryItems = navItems.slice(0, 4);
  const exploreItems = navItems.slice(4, 7);
  const accountItems = navItems.slice(7);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between sm:h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <AppLogo variant="dark" className="h-9 w-9" />
            <span className="hidden text-lg font-semibold text-gray-900 dark:text-white sm:block xl:hidden 2xl:block">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            {/* Voice toggle */}
            <button
              onClick={toggleVoice}
              title={settings.voiceEnabled ? 'Disable voice' : 'Enable voice'}
              aria-label={settings.voiceEnabled ? 'Disable voice' : 'Enable voice'}
              aria-pressed={settings.voiceEnabled}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {settings.voiceEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              title={settings.darkMode ? 'Light mode' : 'Dark mode'}
              aria-label={settings.darkMode ? 'Use light theme' : 'Use dark theme'}
              aria-pressed={settings.darkMode}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {settings.darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User avatar → profile */}
            {user && (
              <Link to="/profile" className="hidden xl:flex items-center gap-2 pl-1">
                <UserAvatar
                  name={user.name}
                  color={user.avatarColor}
                  imageUrl={avatarUrl(user)}
                />
                <div className="hidden text-left 2xl:block">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight capitalize">
                    {user.role}
                  </p>
                </div>
              </Link>
            )}

            {/* Logout (desktop) */}
            <button
              onClick={openLogoutDialog}
              title="Sign out"
              aria-label="Open sign out confirmation"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 xl:flex"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 xl:hidden"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          id="mobile-navigation"
          className="!bottom-0 !left-auto !right-0 !top-0 z-[60] flex h-[100dvh] w-[min(92vw,360px)] max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-r-0 bg-white p-0 shadow-2xl dark:bg-gray-950 xl:hidden [&_[data-slot=dialog-close]]:hidden"
        >
          <DialogHeader className="border-b border-gray-200 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] text-left dark:border-gray-800">
            <div className="flex items-start justify-between gap-3">
              {user ? (
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    name={user.name}
                    color={user.avatarColor}
                    imageUrl={avatarUrl(user)}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-base text-gray-950 dark:text-white">
                      {user.name}
                    </DialogTitle>
                    <DialogDescription className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </DialogDescription>
                  </div>
                </div>
              ) : (
                <DialogTitle>Navigation</DialogTitle>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
            {[
              { label: 'Practice', items: primaryItems },
              { label: 'Explore', items: exploreItems },
              { label: 'Account', items: accountItems },
            ].map((group) => (
              group.items.length > 0 && (
                <div key={group.label} className="mb-5 last:mb-0">
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </nav>

          <div className="border-t border-gray-200 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-gray-800">
            <button
              onClick={openLogoutDialog}
              aria-label="Open sign out confirmation"
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <LogoutConfirmationDialog
        error={logoutError}
        isSigningOut={isSigningOut}
        onConfirm={confirmLogout}
        onOpenChange={handleLogoutDialogOpenChange}
        open={logoutDialogOpen}
      />
    </header>
  );
}

export { UserAvatar };
