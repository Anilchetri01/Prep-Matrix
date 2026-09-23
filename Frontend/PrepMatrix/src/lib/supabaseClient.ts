import { createClient, type SupportedStorage } from '@supabase/supabase-js';

import { safeRemove } from './browserStorage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const STORAGE_KEY = 'ai-interview-simulator-auth';
const LEGACY_STORAGE_KEYS = [
  STORAGE_KEY,
  `sb-fvvsronnfenmrabzmuvn-auth-token`,
  'supabase.auth.token',
];

const isBrowser = typeof window !== 'undefined';

function removeLegacyAuthCookie(key = STORAGE_KEY) {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(key)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

const browserAuthStorage: SupportedStorage = {
  getItem(key) {
    if (!isBrowser) return null;

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('[supabaseClient] Failed to read auth storage key. Clearing stored session.', {
        error,
        key,
      });

      try {
        window.localStorage.removeItem(key);
      } catch (removeError) {
        console.warn('[supabaseClient] Failed to remove unreadable auth storage key.', {
          error: removeError,
          key,
        });
      }

      return null;
    }
  },
  setItem(key, value) {
    if (!isBrowser) return;

    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[supabaseClient] Failed to persist auth session.', { error, key });
    }
  },
  removeItem(key) {
    if (!isBrowser) return;

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('[supabaseClient] Failed to remove auth session.', { error, key });
    }
  },
};

export function clearStoredAuthState() {
  removeLegacyAuthCookie();

  if (typeof window === 'undefined') {
    return;
  }

  LEGACY_STORAGE_KEYS.forEach((key) => {
    safeRemove(key);

    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('[supabaseClient] Failed to remove auth sessionStorage key.', {
        error,
        key,
      });
    }
  });
}

if (isBrowser) {
  removeLegacyAuthCookie();
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: browserAuthStorage,
    storageKey: STORAGE_KEY,
  },
});

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  resumes: 'resumes',
} as const;
