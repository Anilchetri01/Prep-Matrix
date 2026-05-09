import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

import type { AdminUser, User } from '../app/types';
import { STORAGE_BUCKETS, supabase } from '../lib/supabaseClient';
import {
  assertNoError,
  buildStoragePath,
  extractStoragePathFromPublicUrl,
  getAuthProvider,
  getAuthUserAvatarUrl,
  getAuthUserEmail,
  getAuthUserFullName,
  getAuthenticatedAuthUser,
  getRandomAvatarColor,
  makeFallbackUsername,
  mapProfileToUser,
  normalizeSkills,
  runLoggedOperation,
  ServiceError,
  type ProfileRow,
} from './serviceUtils';
import { aiInterviewStatsService, type UserInterviewStats } from './aiInterviewStatsService';

type PublicCandidateRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  job_title: string | null;
  bio: string | null;
  location: string | null;
  education: string | null;
  experience_level: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  skills: string[] | null;
  total_interviews: number;
  average_score: number;
  best_score: number;
};

type AdminUserRow = ProfileRow & {
  total_interviews: number;
  average_score: number;
};

function mergeInterviewSummary(args: {
  aiStats?: UserInterviewStats;
  manualAverageScore: number;
  manualBestScore?: number;
  manualTotalInterviews: number;
}) {
  const aiStats = args.aiStats;
  const aiCount = aiStats?.count || 0;
  const totalInterviews = args.manualTotalInterviews + aiCount;
  const scoreSum = args.manualAverageScore * args.manualTotalInterviews + (aiStats?.scoreSum || 0);

  return {
    averageScore: totalInterviews > 0 ? Math.round(scoreSum / totalInterviews) : 0,
    bestScore: Math.max(args.manualBestScore || 0, aiStats?.bestScore || 0),
    totalInterviews,
  };
}

type ProfileProvisionPayload = {
  avatar_color: string;
  avatar_url: string | null;
  email: string;
  full_name: string;
  id: string;
  role: 'user';
  skills: string[];
  username: string;
};

function isGoogleAvatarUrl(value: string | null | undefined) {
  return Boolean(value && /(^https:\/\/lh\d+\.googleusercontent\.com\/|googleusercontent\.com\/)/i.test(value));
}

function isMissingRpcError(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(
    error &&
      (error.code === 'PGRST202' ||
        error.code === '42883' ||
        /function .*ensure_user_profile|could not find the function/i.test(error.message || '')),
  );
}

function toSyntheticProfileRow(payload: ProfileProvisionPayload): ProfileRow {
  const now = new Date().toISOString();

  return {
    id: payload.id,
    email: payload.email,
    full_name: payload.full_name,
    username: payload.username,
    avatar_url: payload.avatar_url,
    avatar_color: payload.avatar_color,
    job_title: null,
    bio: null,
    phone: null,
    location: null,
    education: null,
    experience_level: null,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    skills: payload.skills,
    role: payload.role,
    created_at: now,
    updated_at: now,
  };
}

export interface ProfileUpdateInput {
  name?: string;
  username?: string;
  avatarColor?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  education?: string | null;
  experienceLevel?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  skills?: string[] | string;
  profilePicture?: string | null;
}

class ProfileService {
  private async findProfile(userId: string) {
    return runLoggedOperation(
      'profileService',
      'findProfile',
      { userId },
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle<ProfileRow>();

        assertNoError(error, 'Unable to load your profile.');
        return data;
      },
    );
  }

  private async getFreshAuthUser(fallbackAuthUser: SupabaseAuthUser) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    assertNoError(error, 'Unable to verify your session.');
    return user || fallbackAuthUser;
  }

  private async findProfileByEmail(email: string) {
    return runLoggedOperation(
      'profileService',
      'findProfileByEmail',
      { email },
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle<ProfileRow>();

        assertNoError(error, 'Unable to check your profile.');
        return data;
      },
    );
  }

  private async provisionProfileWithRpc(
    authUser: SupabaseAuthUser,
    payload: ProfileProvisionPayload,
    provider: string,
  ) {
    const { data, error } = await supabase.rpc('ensure_user_profile', {
      profile_avatar_url: payload.avatar_url,
      profile_email: payload.email,
      profile_full_name: payload.full_name,
      profile_id: authUser.id,
      profile_provider: provider,
    });

    if (isMissingRpcError(error)) {
      console.warn('[profileService] ensure_user_profile RPC is not installed; using client fallback.');
      return null;
    }

    assertNoError(error, 'Unable to create your profile.');

    const row = Array.isArray(data) ? data[0] : data;
    return row ? (row as ProfileRow) : null;
  }

  private async createProfile(
    authUser: SupabaseAuthUser,
    defaults?: { fullName?: string; email?: string },
  ) {
    const email = getAuthUserEmail(authUser) || defaults?.email || '';
    if (!email) {
      throw new ServiceError('Your Google account did not provide an email address.');
    }

    const fullName =
      getAuthUserFullName(authUser) ||
      defaults?.fullName ||
      email.split('@')[0] ||
      'User';
    const avatarUrl = getAuthUserAvatarUrl(authUser);
    const provider = getAuthProvider(authUser);
    const payload: ProfileProvisionPayload = {
      id: authUser.id,
      email,
      full_name: fullName,
      username: makeFallbackUsername(email, authUser.id),
      avatar_url: avatarUrl,
      avatar_color: getRandomAvatarColor(),
      role: 'user',
      skills: [],
    };

    console.log('[profileService] createProfile:payload', {
      authUserId: authUser.id,
      email,
      provider,
      hasAvatar: Boolean(avatarUrl),
    });

    const rpcProfile = await this.provisionProfileWithRpc(authUser, payload, provider);
    if (rpcProfile) {
      return rpcProfile;
    }

    const { error } = await supabase
      .from('profiles')
      .insert(payload);

    if (!error) {
      try {
        const createdProfile = await this.findProfile(authUser.id);
        return createdProfile || toSyntheticProfileRow(payload);
      } catch (readError) {
        console.warn('[profileService] Profile was inserted but could not be re-read.', readError);
        return toSyntheticProfileRow(payload);
      }
    }

    if (error?.code === '23505') {
      const existingProfile = await this.findProfile(authUser.id);
      if (existingProfile) {
        return existingProfile;
      }

      const emailProfile = await this.findProfileByEmail(email);
      if (emailProfile && emailProfile.id !== authUser.id) {
        throw new ServiceError(
          'A PrepMatrix profile already exists for this email. Please sign in with the original method for that account.',
          error,
        );
      }
    }

    assertNoError(error, 'Unable to create your profile.');
    throw new ServiceError('Unable to create your profile.');
  }

  async ensureProfile(
    authUser: SupabaseAuthUser,
    defaults?: { fullName?: string; email?: string },
  ) {
    return runLoggedOperation(
      'profileService',
      'ensureProfile',
      {
        authUserId: authUser.id,
        email: authUser.email || defaults?.email || '',
      },
      async () => {
        const currentAuthUser = await this.getFreshAuthUser(authUser);
        let existingProfile: ProfileRow | null = null;
        try {
          existingProfile = await this.findProfile(currentAuthUser.id);
        } catch (error) {
          console.warn('[profileService] Unable to read profile before provisioning.', error);
        }
        const email = getAuthUserEmail(currentAuthUser) || defaults?.email || '';
        const metadataFullName = getAuthUserFullName(currentAuthUser);
        const metadataAvatarUrl = getAuthUserAvatarUrl(currentAuthUser);

        if (existingProfile) {
          const profilePatch: Partial<ProfileRow> = {};

          if (!existingProfile.email && email) {
            profilePatch.email = email;
          }

          if (!existingProfile.full_name && (metadataFullName || defaults?.fullName)) {
            profilePatch.full_name = metadataFullName || defaults?.fullName || null;
          }

          if (
            metadataAvatarUrl &&
            (!existingProfile.avatar_url || isGoogleAvatarUrl(existingProfile.avatar_url))
          ) {
            profilePatch.avatar_url = metadataAvatarUrl;
          }

          if (Object.keys(profilePatch).length === 0) {
            return mapProfileToUser(existingProfile, authUser);
          }

          const { data, error } = await supabase
            .from('profiles')
            .update(profilePatch)
            .eq('id', authUser.id)
            .select('*')
            .single<ProfileRow>();

          assertNoError(error, 'Unable to update your profile.');
          return mapProfileToUser(data, currentAuthUser);
        }

        const createdProfile = await this.createProfile(currentAuthUser, defaults);
        return mapProfileToUser(createdProfile, currentAuthUser);
      },
    );
  }

  async getCurrentProfile() {
    return runLoggedOperation(
      'profileService',
      'getCurrentProfile',
      undefined,
      async () => {
        const authUser = await getAuthenticatedAuthUser();
        return this.ensureProfile(authUser);
      },
    );
  }

  async updateProfile(updates: ProfileUpdateInput) {
    return runLoggedOperation(
      'profileService',
      'updateProfile',
      updates,
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const payload = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: updates.name?.trim() || null,
          username: updates.username?.trim() || null,
          avatar_url: updates.profilePicture || null,
          avatar_color: updates.avatarColor || null,
          job_title: updates.jobTitle?.trim() || null,
          bio: updates.bio?.trim() || null,
          phone: updates.phoneNumber?.trim() || null,
          location: updates.location?.trim() || null,
          education: updates.education?.trim() || null,
          experience_level: updates.experienceLevel?.trim() || null,
          linkedin_url: updates.linkedinUrl?.trim() || null,
          github_url: updates.githubUrl?.trim() || null,
          portfolio_url: updates.portfolioUrl?.trim() || null,
          skills: normalizeSkills(updates.skills),
        };

        const { data, error } = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' })
          .select('*')
          .single<ProfileRow>();

        assertNoError(error, 'Unable to update your profile.');
        return mapProfileToUser(data, authUser);
      },
    );
  }

  async uploadAvatar(file: File) {
    return runLoggedOperation(
      'profileService',
      'uploadAvatar',
      { file },
      async () => {
        const authUser = await getAuthenticatedAuthUser();
        const storagePath = buildStoragePath(authUser.id, file.name);

        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKETS.avatars)
          .upload(storagePath, file, {
            cacheControl: '3600',
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        assertNoError(error, 'Unable to upload your avatar.');

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKETS.avatars).getPublicUrl(storagePath);

        console.log('[profileService] uploadAvatar:storageResponse', {
          path: data?.path || storagePath,
          publicUrl,
        });

        return publicUrl;
      },
    );
  }

  async deleteAvatar(publicUrl: string | null | undefined) {
    return runLoggedOperation(
      'profileService',
      'deleteAvatar',
      { publicUrl },
      async () => {
        const storagePath = extractStoragePathFromPublicUrl(
          publicUrl,
          STORAGE_BUCKETS.avatars,
        );

        if (!storagePath) return;

        const { error } = await supabase.storage
          .from(STORAGE_BUCKETS.avatars)
          .remove([storagePath]);

        assertNoError(error, 'Unable to remove your avatar.');
      },
    );
  }

  async getPublicCandidates(): Promise<
    Array<User & { totalInterviews: number; averageScore: number; bestScore: number }>
  > {
    return runLoggedOperation(
      'profileService',
      'getPublicCandidates',
      undefined,
      async () => {
        const { data, error } = await supabase.rpc('get_public_candidates');

        assertNoError(error, 'Unable to load candidates.');

        const aiStats = await aiInterviewStatsService.getCompletedStats();

        return ((data as PublicCandidateRow[] | null) || []).map((candidate) => {
          const summary = mergeInterviewSummary({
            aiStats: aiStats.users[candidate.id],
            manualAverageScore: candidate.average_score || 0,
            manualBestScore: candidate.best_score || 0,
            manualTotalInterviews: candidate.total_interviews || 0,
          });

          return {
            id: candidate.id,
            email: '',
            name: candidate.full_name || 'User',
            role: 'user',
            createdAt: Date.now(),
            avatarColor: candidate.avatar_color || undefined,
            bio: candidate.bio || undefined,
            jobTitle: candidate.job_title || undefined,
            username: candidate.username || undefined,
            location: candidate.location || undefined,
            skills: candidate.skills || [],
            experienceLevel:
              (candidate.experience_level as User['experienceLevel']) || undefined,
            education: candidate.education || undefined,
            linkedinUrl: candidate.linkedin_url || undefined,
            githubUrl: candidate.github_url || undefined,
            portfolioUrl: candidate.portfolio_url || undefined,
            profilePicture: candidate.avatar_url || undefined,
            totalInterviews: summary.totalInterviews,
            averageScore: summary.averageScore,
            bestScore: summary.bestScore,
          };
        });
      },
    );
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return runLoggedOperation(
      'profileService',
      'getAdminUsers',
      undefined,
      async () => {
        const { data, error } = await supabase.rpc('admin_list_users');

        assertNoError(error, 'Unable to load admin users.');

        const aiStats = await aiInterviewStatsService.getCompletedStats();

        return ((data as AdminUserRow[] | null) || []).map((row) => {
          const summary = mergeInterviewSummary({
            aiStats: aiStats.users[row.id],
            manualAverageScore: row.average_score || 0,
            manualTotalInterviews: row.total_interviews || 0,
          });

          return {
            ...mapProfileToUser(row),
            totalInterviews: summary.totalInterviews,
            averageScore: summary.averageScore,
          };
        });
      },
    );
  }

  async updateUserRole(userId: string, role: 'admin' | 'user') {
    return runLoggedOperation(
      'profileService',
      'updateUserRole',
      { userId, role },
      async () => {
        const { data, error } = await supabase.rpc('admin_update_user_role', {
          new_role: role,
          target_user_id: userId,
        });

        assertNoError(error, 'Unable to update the user role.');

        const updatedProfile = (data as ProfileRow[] | ProfileRow | null) || null;
        const row = Array.isArray(updatedProfile) ? updatedProfile[0] : updatedProfile;

        if (!row) {
          throw new Error('The updated profile was not returned by Supabase.');
        }

        return mapProfileToUser(row);
      },
    );
  }

  async deleteUser(userId: string) {
    return runLoggedOperation(
      'profileService',
      'deleteUser',
      { userId },
      async () => {
        const { data, error } = await supabase.rpc('admin_delete_user', {
          target_user_id: userId,
        });

        assertNoError(error, 'Unable to delete the user.');
        return { success: Boolean(data ?? true) };
      },
    );
  }
}

export const profileService = new ProfileService();
