import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  ClipboardList,
  FileText,
  User,
  LogOut,
  Play,
  Square,
  Check,
  CheckCircle2,
  ExternalLink,
  Palette,
  Sliders,
  HardDrive,
  Info,
} from 'lucide-react';

import { Navbar, UserAvatar, LogoutConfirmationDialog } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { textToSpeech } from '../utils/speech';
import { APP_NAME } from '../constants/branding';
import { APP_VERSION } from '../../lib/browserStorage';

// ── Accessible Switch Component ───────────────────────────────────────────────

function Switch({
  checked,
  onChange,
  label,
  id,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#101827] disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-[#6D5EF9]' : 'bg-[#DDE3EC] dark:bg-[#263449]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

export function Settings() {
  const { user, logout } = useAuth();
  const { settings, updateSettings, toggleDarkMode, toggleSound, toggleVoice } = useSettings();
  const navigate = useNavigate();

  const [isSpeakingTest, setIsSpeakingTest] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported('speechSynthesis' in window);
    }

    return () => {
      textToSpeech.cancel();
    };
  }, []);

  const handleTestVoice = () => {
    if (!speechSupported) {
      toast.error('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeakingTest) {
      textToSpeech.cancel();
      setIsSpeakingTest(false);
      toast.info('Voice test cancelled.');
      return;
    }

    setIsSpeakingTest(true);
    toast.info('Playing sample interview question audio...');

    textToSpeech.speak(
      'Welcome to PrepMatrix. Voice audio is working properly for your interview preparation.',
      () => {
        setIsSpeakingTest(false);
        toast.success('Voice test completed.');
      },
    );
  };

  const handleThemeSelect = (dark: boolean) => {
    if (settings.darkMode !== dark) {
      updateSettings({ darkMode: dark });
      toast.success(dark ? 'Switched to Dark theme' : 'Switched to Light theme');
    }
  };

  const handleLogout = async () => {
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

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#142033] dark:bg-[#070B14] dark:text-[#F4F7FB]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Page Header */}
        <PageHeader
          eyebrow="Preferences & Configuration"
          eyebrowIcon={Sliders}
          title="Settings"
          description="Customize your visual theme, voice narration, sound feedback, and interview preparation preferences."
        />

        <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
          {/* ── Section 1: Theme & Appearance ────────────────────────────── */}
          <section
            aria-labelledby="theme-heading"
            className="rounded-[14px] border border-[#DDE3EC] bg-white p-5 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-[#DDE3EC] pb-4 dark:border-[#263449]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                <Palette className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="theme-heading" className="font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB]">
                  Theme & Appearance
                </h2>
                <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">
                  Select your preferred interface style and display contrast.
                </p>
              </div>
            </div>

            {/* Visual Theme Selection Cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Light Theme Card */}
              <button
                type="button"
                onClick={() => handleThemeSelect(false)}
                aria-pressed={!settings.darkMode}
                className={`relative flex flex-col items-start rounded-xl border p-4.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 ${
                  !settings.darkMode
                    ? 'border-[#6D5EF9] bg-[#EEECFF]/30 shadow-sm ring-1 ring-[#6D5EF9] dark:border-[#8174FF] dark:bg-[#1D1B49]/40'
                    : 'border-[#DDE3EC] bg-white hover:border-[#CBD5E1] hover:bg-[#F7F8FC] dark:border-[#263449] dark:bg-[#101827] dark:hover:border-[#374967] dark:hover:bg-[#172235]/40'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sun className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-[#142033] dark:text-[#F4F7FB]">Light Theme</span>
                  </div>
                  {!settings.darkMode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6D5EF9] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>

                {/* Light preview thumbnail */}
                <div className="mt-3.5 w-full rounded-lg border border-[#DDE3EC] bg-[#F7F8FC] p-2.5">
                  <div className="h-2 w-16 rounded-full bg-[#6D5EF9]/80" />
                  <div className="mt-2 flex gap-1.5">
                    <div className="h-10 flex-1 rounded bg-white border border-[#E2E8F0] shadow-xs" />
                    <div className="h-10 flex-1 rounded bg-white border border-[#E2E8F0] shadow-xs" />
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                  Crisp white surfaces with dark navy typography and standard light contrast.
                </p>
              </button>

              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => handleThemeSelect(true)}
                aria-pressed={settings.darkMode}
                className={`relative flex flex-col items-start rounded-xl border p-4.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] focus-visible:ring-offset-2 ${
                  settings.darkMode
                    ? 'border-[#6D5EF9] bg-[#1D1B49]/40 shadow-sm ring-1 ring-[#6D5EF9] dark:border-[#8174FF]'
                    : 'border-[#DDE3EC] bg-white hover:border-[#CBD5E1] hover:bg-[#F7F8FC] dark:border-[#263449] dark:bg-[#101827] dark:hover:border-[#374967] dark:hover:bg-[#172235]/40'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                      <Moon className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-[#142033] dark:text-[#F4F7FB]">Dark Theme</span>
                  </div>
                  {settings.darkMode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6D5EF9] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>

                {/* Dark preview thumbnail */}
                <div className="mt-3.5 w-full rounded-lg border border-[#263449] bg-[#070B14] p-2.5">
                  <div className="h-2 w-16 rounded-full bg-[#8174FF]" />
                  <div className="mt-2 flex gap-1.5">
                    <div className="h-10 flex-1 rounded bg-[#101827] border border-[#263449]" />
                    <div className="h-10 flex-1 rounded bg-[#101827] border border-[#263449]" />
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                  Deep midnight palette with soft contrast, gentle on eyes during long sessions.
                </p>
              </button>
            </div>

            {/* Quick Toggle Row */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[#F7F8FC] p-4 dark:bg-[#172235]/50">
              <div className="flex items-center gap-3 pr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#5F6F84] shadow-xs dark:bg-[#101827] dark:text-[#AAB7CA]">
                  {settings.darkMode ? <Moon className="h-4 w-4 text-[#8174FF]" /> : <Sun className="h-4 w-4 text-amber-500" />}
                </div>
                <div>
                  <label htmlFor="dark-mode-toggle" className="text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] cursor-pointer">
                    Dark Mode
                  </label>
                  <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                    {settings.darkMode ? 'Dark theme is currently active' : 'Light theme is currently active'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-xs font-medium text-[#7F8CA0] sm:inline">
                  {settings.darkMode ? 'ON' : 'OFF'}
                </span>
                <Switch
                  id="dark-mode-toggle"
                  checked={settings.darkMode}
                  onChange={toggleDarkMode}
                  label="Toggle Dark Mode"
                />
              </div>
            </div>
          </section>

          {/* ── Section 2: Voice & Audio ─────────────────────────────────── */}
          <section
            aria-labelledby="audio-heading"
            className="rounded-[14px] border border-[#DDE3EC] bg-white p-5 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-[#DDE3EC] pb-4 dark:border-[#263449]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="audio-heading" className="font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB]">
                  Voice & Audio
                </h2>
                <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">
                  Control question narration and audio feedback for interview practice.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Question Narration Setting */}
              <div className="rounded-xl border border-[#DDE3EC] p-4 transition dark:border-[#263449]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                      {settings.voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-[#7F8CA0]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="voice-narration-toggle" className="text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] cursor-pointer">
                          Read Questions Aloud
                        </label>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            settings.voiceEnabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}
                        >
                          {settings.voiceEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                        Automatically narrate interview questions using browser speech synthesis in AI Mode and Manual Practice.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                    <Switch
                      id="voice-narration-toggle"
                      checked={settings.voiceEnabled}
                      onChange={toggleVoice}
                      label="Toggle Question Narration"
                    />
                  </div>
                </div>

                {/* Test Voice Button */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#DDE3EC] pt-3 dark:border-[#263449]">
                  <div className="flex items-center gap-1.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA]">
                    <Info className="h-3.5 w-3.5 text-[#5B4BE7] dark:text-[#8174FF]" />
                    <span>
                      {speechSupported
                        ? 'Speech synthesis is available in your browser.'
                        : 'Speech synthesis is not supported in this browser.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestVoice}
                    disabled={!speechSupported}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE3EC] bg-white px-3 py-1.5 text-xs font-semibold text-[#142033] shadow-xs transition hover:bg-[#F1F4F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF] disabled:opacity-50 dark:border-[#263449] dark:bg-[#172235] dark:text-[#F4F7FB] dark:hover:bg-[#172235]/80"
                  >
                    {isSpeakingTest ? (
                      <>
                        <Square className="h-3.5 w-3.5 text-[#E11D48]" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 text-[#5B4BE7] dark:text-[#8174FF]" />
                        <span>Test Voice Audio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sound Effects Setting */}
              <div className="rounded-xl border border-[#DDE3EC] p-4 transition dark:border-[#263449]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="sound-effects-toggle" className="text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] cursor-pointer">
                          Sound Feedback & Cues
                        </label>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            settings.soundEnabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}
                        >
                          {settings.soundEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                        Play sound notifications and subtle audio cues during timer alerts and session transitions.
                      </p>
                    </div>
                  </div>

                  <Switch
                    id="sound-effects-toggle"
                    checked={settings.soundEnabled}
                    onChange={toggleSound}
                    label="Toggle Sound Effects"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 3: Interview Experience ──────────────────────────── */}
          <section
            aria-labelledby="interview-pref-heading"
            className="rounded-[14px] border border-[#DDE3EC] bg-white p-5 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-[#DDE3EC] pb-4 dark:border-[#263449]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="interview-pref-heading" className="font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB]">
                  Interview Preferences & Modes
                </h2>
                <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">
                  Quick access to all preparation modalities across 97+ industry domains.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* AI Mock Interview Card */}
              <div className="flex flex-col justify-between rounded-xl border border-[#DDE3EC] bg-[#F7F8FC] p-4 transition hover:border-[#6D5EF9]/40 dark:border-[#263449] dark:bg-[#172235]/40">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                    <span className="font-semibold text-sm text-[#142033] dark:text-[#F4F7FB]">AI Mock Interview</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                    Interactive real-time interview with webcam preview, speech transcription, and instant AI analytics.
                  </p>
                </div>
                <Link
                  to="/ai-mode"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#5B4BE7] shadow-xs transition hover:bg-[#EEECFF] dark:bg-[#101827] dark:text-[#8174FF] dark:hover:bg-[#1D1B49]"
                >
                  <span>Launch AI Mode</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Manual Practice Card */}
              <div className="flex flex-col justify-between rounded-xl border border-[#DDE3EC] bg-[#F7F8FC] p-4 transition hover:border-[#6D5EF9]/40 dark:border-[#263449] dark:bg-[#172235]/40">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                    <span className="font-semibold text-sm text-[#142033] dark:text-[#F4F7FB]">Manual Practice</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                    Self-paced questions across 97+ career domains with 3 difficulty levels and tailored question sets.
                  </p>
                </div>
                <Link
                  to="/manual-mode"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#5B4BE7] shadow-xs transition hover:bg-[#EEECFF] dark:bg-[#101827] dark:text-[#8174FF] dark:hover:bg-[#1D1B49]"
                >
                  <span>Explore Domains</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Resume Analysis Card */}
              <div className="flex flex-col justify-between rounded-xl border border-[#DDE3EC] bg-[#F7F8FC] p-4 transition hover:border-[#6D5EF9]/40 dark:border-[#263449] dark:bg-[#172235]/40">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#5B4BE7] dark:text-[#8174FF]" />
                    <span className="font-semibold text-sm text-[#142033] dark:text-[#F4F7FB]">Resume ATS Analysis</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA]">
                    Automated ATS resume audit, keyword alignment, and personalized skill gap analysis.
                  </p>
                </div>
                <Link
                  to="/resume-analysis"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#5B4BE7] shadow-xs transition hover:bg-[#EEECFF] dark:bg-[#101827] dark:text-[#8174FF] dark:hover:bg-[#1D1B49]"
                >
                  <span>Analyze Resume</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── Section 4: Account & Profile ─────────────────────────────── */}
          <section
            aria-labelledby="account-heading"
            className="rounded-[14px] border border-[#DDE3EC] bg-white p-5 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-[#DDE3EC] pb-4 dark:border-[#263449]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="account-heading" className="font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB]">
                  Account & Profile
                </h2>
                <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">
                  View your account credentials and navigate to profile editing.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#DDE3EC] bg-[#F7F8FC] p-4.5 dark:border-[#263449] dark:bg-[#172235]/40">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  name={user?.name || 'User'}
                  color={user?.avatarColor}
                  imageUrl={user?.avatar_url || user?.profilePicture || ''}
                  size="lg"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base font-semibold text-[#142033] dark:text-[#F4F7FB]">
                      {user?.name || 'Guest User'}
                    </p>
                    {user?.role && (
                      <span className="rounded-full bg-[#EEECFF] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#5F6F84] dark:text-[#AAB7CA] truncate">
                    {user?.email || 'No email associated'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#6D5EF9] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#5B4BE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8174FF]"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Edit Profile & Security</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FB7185]/30 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-[#E11D48] transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] dark:border-[#FB7185]/20 dark:bg-rose-950/30 dark:text-[#FB7185] dark:hover:bg-rose-950/50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── Section 5: Persistence & System Info ──────────────────────── */}
          <section
            aria-labelledby="system-heading"
            className="rounded-[14px] border border-[#DDE3EC] bg-white p-5 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-[#DDE3EC] pb-4 dark:border-[#263449]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEECFF] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
                <HardDrive className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="system-heading" className="font-display text-lg font-bold text-[#142033] dark:text-[#F4F7FB]">
                  Storage & System Information
                </h2>
                <p className="text-xs text-[#5F6F84] dark:text-[#AAB7CA] sm:text-sm">
                  Client persistence status and application environment details.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-[#F7F8FC] p-3 dark:bg-[#172235]/40">
                <span className="text-[#5F6F84] dark:text-[#AAB7CA]">Persistence Strategy</span>
                <span className="font-semibold text-[#142033] dark:text-[#F4F7FB] flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Local + Cloud Sync
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#F7F8FC] p-3 dark:bg-[#172235]/40">
                <span className="text-[#5F6F84] dark:text-[#AAB7CA]">Application Version</span>
                <span className="font-semibold font-mono text-[#142033] dark:text-[#F4F7FB]">{APP_VERSION}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#F7F8FC] p-3 dark:bg-[#172235]/40">
                <span className="text-[#5F6F84] dark:text-[#AAB7CA]">Speech Synthesis</span>
                <span className="font-semibold text-[#142033] dark:text-[#F4F7FB]">
                  {speechSupported ? 'Available' : 'Unsupported'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#F7F8FC] p-3 dark:bg-[#172235]/40">
                <span className="text-[#5F6F84] dark:text-[#AAB7CA]">Product Platform</span>
                <span className="font-semibold text-[#142033] dark:text-[#F4F7FB]">{APP_NAME} Web</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog
        error={logoutError}
        isSigningOut={isSigningOut}
        onConfirm={handleLogout}
        onOpenChange={setLogoutDialogOpen}
        open={logoutDialogOpen}
      />
    </div>
  );
}
