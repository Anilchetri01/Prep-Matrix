import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

import type { AppSettings, User } from '../app/types';
import { supabase } from '../lib/supabaseClient';

const AVATAR_COLORS = [
  '#6D5EF9',
  '#4F46E5',
  '#3B82F6',
  '#0891B2',
  '#0D9488',
  '#475569',
  '#1E293B',
  '#581C87',
];

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  auth_provider?: string | null;
  job_title: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  education: string | null;
  experience_level: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  skills: string[] | null;
  role: 'admin' | 'user' | null;
  created_at: string;
  updated_at: string;
}

export interface AuthIdentityData {
  avatar_url?: unknown;
  email?: unknown;
  full_name?: unknown;
  name?: unknown;
  picture?: unknown;
}

export class ServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ServiceError';
  }
}

function normalizeLogPayload(payload: unknown) {
  if (payload === undefined) return undefined;

  if (payload instanceof Error) {
    return {
      name: payload.name,
      message: payload.message,
      stack: payload.stack,
      cause: normalizeLogPayload(payload.cause),
    };
  }

  if (typeof File !== 'undefined' && payload instanceof File) {
    return {
      name: payload.name,
      size: payload.size,
      type: payload.type,
    };
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeLogPayload(item));
  }

  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return payload;
  }
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  darkMode: true,
  soundEnabled: true,
  voiceEnabled: true,
};

export function assertNoError(
  error: { message?: string | null } | null | undefined,
  fallbackMessage: string,
) {
  if (error) {
    throw new ServiceError(error.message || fallbackMessage, error);
  }
}

export async function getAuthenticatedAuthUser() {
  return runLoggedOperation(
    'serviceUtils',
    'getAuthenticatedAuthUser',
    undefined,
    async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      assertNoError(error, 'Unable to verify your session.');

      if (!user) {
        throw new ServiceError('You must be signed in to continue.');
      }

      return user;
    },
  );
}

export async function runLoggedOperation<T>(
  scope: string,
  action: string,
  payload: unknown,
  operation: () => Promise<T>,
) {
  const normalizedPayload = normalizeLogPayload(payload);
  console.log(`[${scope}] ${action}:start`, normalizedPayload);

  try {
    const result = await operation();
    console.log(`[${scope}] ${action}:success`, normalizeLogPayload(result));
    return result;
  } catch (error) {
    console.error(`[${scope}] ${action}:error`, {
      error,
      payload: normalizedPayload,
    });
    throw error;
  }
}

export function getRandomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function normalizeSettings(value: unknown): AppSettings {
  const candidate =
    value && typeof value === 'object'
      ? (value as Partial<AppSettings>)
      : DEFAULT_APP_SETTINGS;

  return {
    darkMode: candidate.darkMode ?? DEFAULT_APP_SETTINGS.darkMode,
    soundEnabled: candidate.soundEnabled ?? DEFAULT_APP_SETTINGS.soundEnabled,
    voiceEnabled: candidate.voiceEnabled ?? DEFAULT_APP_SETTINGS.voiceEnabled,
  };
}

export function normalizeSkills(skills: string[] | string | null | undefined) {
  const values = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
    ? skills.split(',')
    : [];

  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function toIsoString(value: number | string | Date | null | undefined) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function toTimestamp(value: string | null | undefined) {
  if (!value) return undefined;
  return new Date(value).getTime();
}

export function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
    .toLowerCase();
}

export function buildStoragePath(userId: string, fileName: string) {
  return `${userId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function extractStoragePathFromPublicUrl(
  publicUrl: string | null | undefined,
  bucket: string,
) {
  if (!publicUrl) return null;

  const marker = `/object/public/${bucket}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
}

export function makeFallbackUsername(email: string | null | undefined, userId: string) {
  const base = (email?.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return `${base || 'user'}-${userId.replace(/-/g, '').slice(0, 12)}`;
}

export function getAuthProvider(authUser?: SupabaseAuthUser | null) {
  const providerFromAppMetadata = authUser?.app_metadata?.provider;
  if (typeof providerFromAppMetadata === 'string' && providerFromAppMetadata.trim()) {
    return providerFromAppMetadata.trim();
  }

  const providerFromIdentity = authUser?.identities?.find((identity) => identity.provider)?.provider;
  return providerFromIdentity || 'email';
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function getPrimaryIdentityData(
  authUser?: SupabaseAuthUser | null,
): AuthIdentityData {
  const provider = getAuthProvider(authUser);
  const identity = authUser?.identities?.find((candidate) => candidate.provider === provider)
    || authUser?.identities?.[0];

  return (identity?.identity_data || {}) as AuthIdentityData;
}

export function getAuthUserEmail(authUser?: SupabaseAuthUser | null) {
  const identityData = getPrimaryIdentityData(authUser);
  return (
    readString(authUser?.email) ||
    readString(authUser?.user_metadata?.email) ||
    readString(identityData.email) ||
    ''
  );
}

export function getAuthUserFullName(authUser?: SupabaseAuthUser | null) {
  const identityData = getPrimaryIdentityData(authUser);
  return (
    readString(authUser?.user_metadata?.full_name) ||
    readString(authUser?.user_metadata?.name) ||
    readString(identityData.full_name) ||
    readString(identityData.name) ||
    null
  );
}

export function getAuthUserAvatarUrl(authUser?: SupabaseAuthUser | null) {
  const identityData = getPrimaryIdentityData(authUser);
  return (
    readString(authUser?.user_metadata?.avatar_url) ||
    readString(authUser?.user_metadata?.picture) ||
    readString(identityData.avatar_url) ||
    readString(identityData.picture) ||
    null
  );
}

export function mapProfileToUser(
  profile: ProfileRow,
  authUser?: SupabaseAuthUser | null,
): User {
  const metadataFullName = getAuthUserFullName(authUser);
  const metadataAvatarUrl = getAuthUserAvatarUrl(authUser);
  const authEmail = getAuthUserEmail(authUser);

  return {
    id: profile.id,
    email: profile.email || authEmail,
    name:
      profile.full_name ||
      metadataFullName ||
      authEmail.split('@')[0] ||
      'User',
    role: profile.role || 'user',
    createdAt: new Date(profile.created_at).getTime(),
    lastLoginAt: toTimestamp(authUser?.last_sign_in_at),
    avatarColor: profile.avatar_color || undefined,
    bio: profile.bio || undefined,
    jobTitle: profile.job_title || undefined,
    username: profile.username || undefined,
    phoneNumber: profile.phone || undefined,
    location: profile.location || undefined,
    skills: profile.skills || [],
    experienceLevel:
      (profile.experience_level as User['experienceLevel']) || undefined,
    education: profile.education || undefined,
    linkedinUrl: profile.linkedin_url || undefined,
    githubUrl: profile.github_url || undefined,
    portfolioUrl: profile.portfolio_url || undefined,
    profilePicture: profile.avatar_url || metadataAvatarUrl || undefined,
    avatar_url: profile.avatar_url || metadataAvatarUrl || undefined,
  };
}
