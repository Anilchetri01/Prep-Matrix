import React from 'react';

interface GoogleAuthButtonProps {
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.52z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.62-2.25l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.59A9.99 9.99 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.4 14.08a6.01 6.01 0 0 1 0-3.82V7.67H3.06a10.01 10.01 0 0 0 0 8.99l3.34-2.58z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.98c1.47 0 2.79.51 3.82 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.67l3.34 2.59C7.2 7.74 9.4 5.98 12 5.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  disabled = false,
  isLoading = false,
  onClick,
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      aria-label="Continue with Google"
      disabled={disabled || isLoading}
      onClick={onClick}
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 dark:hover:border-indigo-500/60 dark:hover:bg-gray-900 dark:focus:ring-offset-gray-800"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      {isLoading ? (
        <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-indigo-600 animate-spin dark:border-gray-600 dark:border-t-indigo-300" />
      ) : (
        <GoogleLogo />
      )}
      <span className="relative">{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
    </button>
  );
}

export function EmailDivider() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden="true">
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        Or
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
