import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { authService } from '../../services/authService';
import {
  APP_VERSION,
  APP_VERSION_STORAGE_KEY,
  safeSet,
} from '../../lib/browserStorage';
import { clearStoredAuthState, supabase } from '../../lib/supabaseClient';
import { profileService } from '../../services/profileService';
import { User } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, password: string, name: string, rememberMe?: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_BOOTSTRAP_TIMEOUT_MS = 10000;

function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    operation
      .then((result) => {
        window.clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function consumeOAuthErrorFromUrl() {
  if (typeof window === 'undefined') return null;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const error = hashParams.get('error') || searchParams.get('error');
  const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
  const errorDescription =
    hashParams.get('error_description') || searchParams.get('error_description');

  if (!error && !errorCode && !errorDescription) {
    return null;
  }

  const nextSearchParams = new URLSearchParams(window.location.search);
  ['error', 'error_code', 'error_description'].forEach((key) => {
    nextSearchParams.delete(key);
  });

  const nextSearch = nextSearchParams.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
  window.history.replaceState(null, document.title, nextUrl);

  if (error === 'access_denied') {
    return 'Google sign-in was cancelled.';
  }

  return errorDescription?.replace(/\+/g, ' ') || 'Google sign-in could not be completed.';
}

function hasOAuthCallbackParams() {
  if (typeof window === 'undefined') return false;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  return ['access_token', 'refresh_token', 'code', 'provider_token', 'error'].some(
    (key) => hashParams.has(key) || searchParams.has(key),
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const userSignatureRef = useRef<string>('null');
  const recoveryInProgressRef = useRef(false);
  const hydrationRequestRef = useRef(0);
  const sessionEventSeenRef = useRef(false);

  const getUserSignature = (nextUser: User | null) => {
    if (!nextUser) return 'null';

    return JSON.stringify({
      avatarColor: nextUser.avatarColor ?? null,
      email: nextUser.email,
      id: nextUser.id,
      name: nextUser.name,
      profilePicture: nextUser.profilePicture ?? null,
      role: nextUser.role,
      username: nextUser.username ?? null,
    });
  };

  const setUserIfChanged = (nextUser: User | null) => {
    const nextSignature = getUserSignature(nextUser);

    if (userSignatureRef.current === nextSignature) {
      return;
    }

    userSignatureRef.current = nextSignature;
    setUser(nextUser);
  };

  const persistAppVersion = () => {
    safeSet(APP_VERSION_STORAGE_KEY, APP_VERSION);
  };

  const clearClientAuthState = () => {
    clearStoredAuthState();
    persistAppVersion();
  };

  const recoverInvalidSession = async (reason: string, error?: unknown) => {
    if (recoveryInProgressRef.current) {
      return;
    }

    recoveryInProgressRef.current = true;
    console.warn('[AuthContext] session:recover', { reason, error });
    clearClientAuthState();

    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) {
        console.warn('[AuthContext] session:recover:signOutError', signOutError);
      }
    } catch (signOutError) {
      console.warn('[AuthContext] session:recover:signOutException', signOutError);
    } finally {
      recoveryInProgressRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let loadingTimeoutId: number | undefined;

    const finishUnauthenticated = () => {
      if (loadingTimeoutId) window.clearTimeout(loadingTimeoutId);
      sessionEventSeenRef.current = false;
      setUserIfChanged(null);
      setAuthStatus('unauthenticated');
    };

    const finishAuthenticated = (nextUser: User) => {
      if (loadingTimeoutId) window.clearTimeout(loadingTimeoutId);
      sessionEventSeenRef.current = true;
      setUserIfChanged(nextUser);
      setAuthStatus('authenticated');
    };

    const hydrateSession = (session: Session | null, source: string) => {
      const requestId = ++hydrationRequestRef.current;

      window.setTimeout(() => {
        void (async () => {
          if (!isMounted || requestId !== hydrationRequestRef.current) return;

          if (!session?.user) {
            if (sessionEventSeenRef.current) {
              console.log('[AuthContext] hydrate:skipNullAfterSessionEvent', { source });
              return;
            }

            console.log('[AuthContext] hydrate:noSession', { source });
            finishUnauthenticated();
            return;
          }

          const sessionExpiresAt = session.expires_at ? session.expires_at * 1000 : null;
          if (!session.access_token || (sessionExpiresAt && sessionExpiresAt <= Date.now())) {
            console.warn('[AuthContext] hydrate:invalidSession', { source });
            await recoverInvalidSession(`invalid_session:${source}`);
            if (isMounted && requestId === hydrationRequestRef.current) {
              finishUnauthenticated();
            }
            return;
          }

          try {
            const currentUser = await profileService.ensureProfile(session.user);
            if (!isMounted || requestId !== hydrationRequestRef.current) return;

            finishAuthenticated(currentUser);
            console.log('[AuthContext] hydrate:success', {
              source,
              userId: currentUser.id,
            });
          } catch (error) {
            console.error('[AuthContext] hydrate:error', { error, source });
            if (isMounted && requestId === hydrationRequestRef.current) {
              const message = error instanceof Error ? error.message : 'Please try again.';
              toast.error(`Your session was restored, but your profile could not be loaded. ${message}`);
              finishUnauthenticated();
            }
          }
        })();
      }, 0);
    };

    loadingTimeoutId = window.setTimeout(() => {
      if (!isMounted) return;
      console.warn('[AuthContext] bootstrap:timeout');
      finishUnauthenticated();
    }, AUTH_BOOTSTRAP_TIMEOUT_MS);

    const bootstrap = async () => {
      try {
        console.log('[AuthContext] bootstrap:start');
        const oauthErrorMessage = consumeOAuthErrorFromUrl();
        const shouldWaitForOAuthCallback = !oauthErrorMessage && hasOAuthCallbackParams();
        if (oauthErrorMessage) {
          toast.error(oauthErrorMessage);
        }

        persistAppVersion();

        const {
          data: { session },
          error: sessionError,
        } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
          'Session initialization timed out.',
        );

        if (sessionError) {
          await recoverInvalidSession('getSession_error', sessionError);
          if (isMounted) finishUnauthenticated();
          return;
        }

        if (!session && shouldWaitForOAuthCallback) {
          console.warn('[AuthContext] bootstrap:waitingForOAuthCallback');
          return;
        }

        hydrateSession(session, 'getSession');
      } catch (error) {
        console.error('[AuthContext] bootstrap:error', error);
        await recoverInvalidSession('bootstrap_exception', error);
        if (isMounted) finishUnauthenticated();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      console.log('[AuthContext] authStateChange:event', {
        event,
        userId: session?.user?.id ?? null,
      });

      if (event === 'SIGNED_OUT') {
        clearClientAuthState();
        finishUnauthenticated();
        return;
      }

      if (session?.user) {
        sessionEventSeenRef.current = true;
      }

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        if (event === 'INITIAL_SESSION' && !session?.user && hasOAuthCallbackParams()) {
          console.warn('[AuthContext] authStateChange:waitingForOAuthCallback');
          return;
        }

        hydrateSession(session, event);
      }
    });

    bootstrap();

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, _rememberMe = false) => {
    const nextUser = await authService.login(email, password);
    setUserIfChanged(nextUser);
    setAuthStatus('authenticated');
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    _rememberMe = false,
  ) => {
    const nextUser = await authService.signup(email, password, name);
    setUserIfChanged(nextUser);
    setAuthStatus('authenticated');
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const logout = async () => {
    await authService.logout();
    setUserIfChanged(null);
    setAuthStatus('unauthenticated');
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    signInWithGoogle,
    logout,
    updateUser: (updates) => {
      setUser((previousUser) => {
        const nextUser = previousUser ? { ...previousUser, ...updates } : null;
        userSignatureRef.current = getUserSignature(nextUser);
        return nextUser;
      });
    },
    isAuthenticated: authStatus === 'authenticated' && Boolean(user),
    isLoading: authStatus === 'loading',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
