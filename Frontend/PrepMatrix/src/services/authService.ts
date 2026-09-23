import type { AuthChangeEvent, Subscription } from '@supabase/supabase-js';

import type { AppSettings, User } from '../app/types';
import { supabase } from '../lib/supabaseClient';
import { profileService } from './profileService';
import {
  assertNoError,
  DEFAULT_APP_SETTINGS,
  getAuthenticatedAuthUser,
  normalizeSettings,
  runLoggedOperation,
  ServiceError,
} from './serviceUtils';

const AUTH_REQUEST_TIMEOUT_MS = 10000;
const OAUTH_START_TIMEOUT_MS = 8000;
const DASHBOARD_PATH = '/dashboard';

function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new ServiceError(timeoutMessage));
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

async function assertAuthEndpointReachable(authUrl: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), OAUTH_START_TIMEOUT_MS);

  try {
    const probeUrl = new URL('/auth/v1/health', authUrl).toString();

    await fetch(probeUrl, {
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal,
    });
  } catch (error) {
    const isAbortError = error instanceof DOMException && error.name === 'AbortError';

    throw new ServiceError(
      isAbortError
        ? 'Supabase auth did not respond. Check the project URL, project status, or network/DNS settings.'
        : 'Unable to reach Supabase auth. Check your internet connection or Supabase project URL.',
      error,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

class AuthService {
  async signInWithGoogle() {
    return runLoggedOperation(
      'authService',
      'signInWithGoogle',
      undefined,
      async () => {
        if (typeof window === 'undefined') {
          throw new ServiceError('Google sign-in is only available in the browser.');
        }

        const redirectTo = `${window.location.origin}${DASHBOARD_PATH}`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });

        assertNoError(error, 'Unable to start Google sign-in.');

        if (!data.url) {
          throw new ServiceError('Unable to create the Google sign-in URL.');
        }

        await assertAuthEndpointReachable(data.url);
        window.location.assign(data.url);
      },
    );
  }

  async signup(email: string, password: string, fullName: string) {
    return runLoggedOperation(
      'authService',
      'signup',
      { email, fullName },
      async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              app_settings: DEFAULT_APP_SETTINGS,
              full_name: fullName,
            },
          },
        });

        assertNoError(error, 'Unable to create your account.');

        if (!data.user) {
          throw new ServiceError('Your account could not be created.');
        }

        if (!data.session) {
          throw new ServiceError(
            'Account created. Please verify your email address before signing in.',
          );
        }

        return profileService.ensureProfile(data.user, { email, fullName });
      },
    );
  }

  async login(email: string, password: string) {
    return runLoggedOperation(
      'authService',
      'login',
      { email },
      async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        assertNoError(error, 'Unable to sign in.');

        if (!data.user) {
          throw new ServiceError('Your account could not be loaded.');
        }

        return profileService.ensureProfile(data.user, { email });
      },
    );
  }

  async logout() {
    return runLoggedOperation(
      'authService',
      'logout',
      undefined,
      async () => {
        const { error } = await supabase.auth.signOut();
        assertNoError(error, 'Unable to sign out.');
      },
    );
  }

  async getCurrentUser(): Promise<User | null> {
    return runLoggedOperation(
      'authService',
      'getCurrentUser',
      undefined,
      async () => {
        const {
          data: { session },
          error,
        } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_REQUEST_TIMEOUT_MS,
          'Unable to load your session right now.',
        );

        assertNoError(error, 'Unable to load your session.');

        if (!session?.user) return null;

        return profileService.ensureProfile(session.user);
      },
    );
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return runLoggedOperation(
      'authService',
      'changePassword',
      { currentPasswordProvided: Boolean(currentPassword), newPasswordLength: newPassword.length },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        if (!authUser.email) {
          throw new ServiceError('Your account email is missing.');
        }

        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: currentPassword,
        });

        assertNoError(reauthError, 'Your current password is incorrect.');

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        assertNoError(updateError, 'Unable to update your password.');
        return { success: true };
      },
    );
  }

  async getSettings(): Promise<AppSettings | null> {
    return runLoggedOperation(
      'authService',
      'getSettings',
      undefined,
      async () => {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        assertNoError(error, 'Unable to load your preferences.');
        if (!user?.user_metadata?.app_settings) {
          return null;
        }
        return normalizeSettings(user.user_metadata.app_settings);
      },
    );
  }

  async updateSettings(settings: AppSettings) {
    return runLoggedOperation(
      'authService',
      'updateSettings',
      settings,
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { data, error } = await supabase.auth.updateUser({
          data: {
            ...authUser.user_metadata,
            app_settings: settings,
          },
        });

        assertNoError(error, 'Unable to save your preferences.');
        return normalizeSettings(data.user?.user_metadata?.app_settings);
      },
    );
  }

  subscribeToAuthChanges(callback: (user: User | null) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        console.log('[authService] authStateChange:event', {
          event,
          userId: session?.user?.id ?? null,
        });

        window.setTimeout(() => {
          if (!session?.user) {
            callback(null);
            return;
          }

          void (async () => {
            try {
              const profile = await profileService.ensureProfile(session.user);
              callback(profile);
            } catch (error) {
              console.error('Unable to hydrate the authenticated user.', error);
              callback(null);
            }
          })();
        }, 0);
      },
    );

    return subscription as Subscription;
  }
}

export const authService = new AuthService();
