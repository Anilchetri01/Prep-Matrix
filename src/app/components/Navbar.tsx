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
      className={`${sizeClasses} shrink-0 rounded-full border border-[#DDE3EC] shadow-sm dark:border-[#263449]`}
    >
      <AvatarImage src={imageUrl || ''} alt={`${name}'s avatar`} className="object-cover" />
      <AvatarFallback
        className="font-bold text-white"
        style={{ backgroundColor: color || '#6D5EF9' }}
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
  isMobile,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isMobile?: boolean;
}) {
  const location = useLocation();
  const active =
    location.pathname === to ||
    location.pathname.startsWith(to + '/') ||
    (to === '/history' && location.pathname.startsWith('/results/')) ||
    (to === '/ai-mode' && location.pathname.startsWith('/interview/')) ||
    (to === '/dashboard' && location.pathname === '/');

  const baseClasses = isMobile
    ? 'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#101827]'
    : 'flex min-h-10 2xl:min-h-11 shrink-0 items-center gap-2 2xl:gap-2.5 rounded-lg px-2.5 py-1.5 2xl:px-3 2xl:py-2 text-xs 2xl:text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#101827]';

  const activeClasses = isMobile
    ? 'relative bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF] before:absolute before:bottom-2 before:left-1 before:top-2 before:w-0.5 before:rounded-full before:bg-[#6D5EF9]'
    : 'relative bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF] after:absolute after:bottom-0 after:left-2.5 after:right-2.5 2xl:after:left-3 2xl:after:right-3 after:h-0.5 after:rounded-full after:bg-[#6D5EF9]';

  const inactiveClasses =
    'text-[#5F6F84] hover:bg-[#F1F4F8] hover:text-[#142033] dark:text-[#AAB7CA] dark:hover:bg-[#172235] dark:hover:text-[#F4F7FB]';

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
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
        className="max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[14px] border border-[#DDE3EC] bg-white/95 p-0 text-[#142033] shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl duration-150 data-[state=closed]:scale-[0.98] data-[state=open]:scale-100 dark:border-[#263449] dark:bg-[#101827]/95 dark:text-[#F4F7FB] dark:shadow-[0_24px_80px_rgba(0,0,0,0.46)] sm:max-w-[23rem] [&_[data-slot=dialog-close]]:text-[#5F6F84] [&_[data-slot=dialog-close]]:hover:bg-[#F1F4F8] [&_[data-slot=dialog-close]]:hover:text-[#142033] dark:[&_[data-slot=dialog-close]]:text-[#AAB7CA] dark:[&_[data-slot=dialog-close]]:hover:bg-[#172235] dark:[&_[data-slot=dialog-close]]:hover:text-[#F4F7FB]"
      >
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#DDE3EC] to-transparent dark:via-[#263449]" />
        <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <DialogHeader className="gap-0 text-left">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#FB7185]/30 bg-gradient-to-b from-rose-50 to-white text-[#E11D48] shadow-[0_0_28px_rgba(251,113,133,0.16)] dark:border-[#FB7185]/20 dark:from-rose-950/30 dark:to-transparent dark:text-[#FB7185] dark:shadow-[0_0_28px_rgba(251,113,133,0.14)]">
              <LogOut className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 pr-7">
              <DialogTitle className="font-display text-[1.0625rem] font-semibold leading-7 tracking-normal text-[#142033] dark:text-[#F4F7FB]">
                Sign Out?
              </DialogTitle>
              <DialogDescription className="text-sm leading-5 text-[#5F6F84] dark:text-[#AAB7CA]">
                Are you sure you want to sign out of PrepMatrix?
              </DialogDescription>
            </div>
          </DialogHeader>

          {error && (
            <p
              className="mt-4 rounded-md border border-[#FB7185]/30 bg-rose-50 px-3 py-2 text-sm leading-5 text-[#E11D48] dark:border-[#FB7185]/20 dark:bg-rose-950/20 dark:text-[#FB7185]"
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
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#DDE3EC] bg-white px-4 text-sm font-medium text-[#142033] shadow-sm transition-all hover:bg-[#F1F4F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-55 dark:border-[#263449] dark:bg-[#172235] dark:text-[#F4F7FB] dark:hover:bg-[#172235]/80 dark:focus-visible:ring-offset-[#101827]"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isSigningOut}
              aria-label="Confirm sign out"
              className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-[10px] bg-[#E11D48] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#E11D48]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-75 dark:bg-[#FB7185] dark:text-[#070B14] dark:hover:bg-[#FB7185]/90 dark:focus-visible:ring-offset-[#101827]"
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
    <header className="sticky top-0 z-50 border-b border-[#DDE3EC] bg-white/90 backdrop-blur-md dark:border-[#263449] dark:bg-[#101827]/90">
      <div className="mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between sm:h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <AppLogo variant="dark" className="h-9 w-9" />
            <span className="hidden font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB] sm:block xl:hidden 2xl:block">
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
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#5F6F84] transition-colors hover:bg-[#F1F4F8] hover:text-[#142033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#AAB7CA] dark:hover:bg-[#172235] dark:hover:text-[#F4F7FB] dark:focus-visible:ring-offset-[#101827]"
            >
              {settings.voiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              title={settings.darkMode ? 'Light mode' : 'Dark mode'}
              aria-label={settings.darkMode ? 'Use light theme' : 'Use dark theme'}
              aria-pressed={settings.darkMode}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#5F6F84] transition-colors hover:bg-[#F1F4F8] hover:text-[#142033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#AAB7CA] dark:hover:bg-[#172235] dark:hover:text-[#F4F7FB] dark:focus-visible:ring-offset-[#101827]"
            >
              {settings.darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* User avatar → profile */}
            {user && (
              <Link
                to="/profile"
                className="hidden xl:flex items-center gap-2 rounded-lg p-1 pl-1.5 transition-colors hover:bg-[#F1F4F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-[#172235] dark:focus-visible:ring-offset-[#101827]"
              >
                <UserAvatar
                  name={user.name}
                  color={user.avatarColor}
                  imageUrl={avatarUrl(user)}
                />
                <div className="hidden text-left 2xl:block">
                  <p className="text-xs font-semibold text-[#142033] dark:text-[#F4F7FB] leading-tight">
                    {user.name}
                  </p>
                  <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] leading-tight capitalize">
                    {user.role}
                  </p>
                </div>
              </Link>
            )}

            {/* Logout (desktop) */}
            {user && (
              <button
                onClick={openLogoutDialog}
                title="Sign out"
                aria-label="Open sign out confirmation"
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#5F6F84] transition-colors hover:bg-rose-50 hover:text-[#E11D48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#AAB7CA] dark:hover:bg-rose-950/20 dark:hover:text-[#FB7185] dark:focus-visible:ring-offset-[#101827] xl:flex"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#5F6F84] transition-colors hover:bg-[#F1F4F8] hover:text-[#142033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#AAB7CA] dark:hover:bg-[#172235] dark:hover:text-[#F4F7FB] dark:focus-visible:ring-offset-[#101827] xl:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          id="mobile-navigation"
          className="!bottom-0 !left-auto !right-0 !top-0 z-[60] flex h-[100dvh] w-[min(92vw,360px)] max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-r-0 border-l border-[#DDE3EC] bg-white p-0 shadow-2xl dark:border-[#263449] dark:bg-[#101827] xl:hidden [&_[data-slot=dialog-close]]:hidden"
        >
          <DialogHeader className="border-b border-[#DDE3EC] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] text-left dark:border-[#263449]">
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
                    <DialogTitle className="truncate font-display text-base font-semibold text-[#142033] dark:text-[#F4F7FB]">
                      {user.name}
                    </DialogTitle>
                    <DialogDescription className="truncate text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                      {user.email}
                    </DialogDescription>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <DialogTitle className="font-display text-base font-semibold text-[#142033] dark:text-[#F4F7FB]">
                    Navigation
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                    PrepMatrix menu
                  </DialogDescription>
                </div>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#5F6F84] transition-colors hover:bg-[#F1F4F8] hover:text-[#142033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#AAB7CA] dark:hover:bg-[#172235] dark:hover:text-[#F4F7FB] dark:focus-visible:ring-offset-[#101827]"
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
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7F8CA0] dark:text-[#718096]">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink key={item.to} {...item} isMobile onClick={() => setMobileOpen(false)} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </nav>

          {user && (
            <div className="border-t border-[#DDE3EC] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-[#263449]">
              <button
                onClick={openLogoutDialog}
                aria-label="Open sign out confirmation"
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#E11D48] transition-colors hover:bg-rose-50 hover:text-[#E11D48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#FB7185] dark:hover:bg-rose-950/20 dark:hover:text-[#FB7185] dark:focus-visible:ring-offset-[#101827]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
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
