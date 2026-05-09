import React, { useState } from 'react';
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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <AppLogo variant="dark" className="h-9 w-9" />
            <span className="font-semibold text-gray-900 dark:text-white hidden sm:block text-lg">
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
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                <div className="hidden lg:block text-left">
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
              className="hidden xl:flex p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 space-y-1">
          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
              <UserAvatar
                name={user.name}
                color={user.avatarColor}
                imageUrl={avatarUrl(user)}
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              {user.role === 'admin' && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  Admin
                </span>
              )}
            </div>
          )}

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              {...item}
              onClick={() => setMobileOpen(false)}
            />
          ))}

          <button
            onClick={openLogoutDialog}
            aria-label="Open sign out confirmation"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

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
