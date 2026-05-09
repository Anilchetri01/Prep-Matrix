import type {
  AdminStats,
  AdminUser,
  InterviewSession,
  LeaderboardEntry,
  Resume,
  User,
} from '../types';
import { authService } from '../../services/authService';
import { historyService } from '../../services/historyService';
import { interviewService } from '../../services/interviewService';
import { leaderboardService } from '../../services/leaderboardService';
import { profileService, type ProfileUpdateInput } from '../../services/profileService';
import { resumeService } from '../../services/resumeService';
import { ServiceError } from '../../services/serviceUtils';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

function toAPIError(error: unknown) {
  if (error instanceof APIError) return error;
  if (error instanceof ServiceError) return new APIError(400, error.message);
  if (error instanceof Error) return new APIError(500, error.message);
  return new APIError(500, 'An unexpected error occurred.');
}

class APIClient {
  async signup(
    email: string,
    password: string,
    name: string,
    _rememberMe = false,
  ): Promise<{ token: string; user: User }> {
    try {
      const user = await authService.signup(email, password, name);
      return { token: 'supabase-session', user };
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async login(
    email: string,
    password: string,
    _rememberMe = false,
  ): Promise<{ token: string; user: User }> {
    try {
      const user = await authService.login(email, password);
      return { token: 'supabase-session', user };
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await authService.logout();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getMe(): Promise<User> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new APIError(401, 'Not authenticated');
      }
      return user;
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async saveInterview(interview: InterviewSession) {
    try {
      return await interviewService.saveInterview(interview);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getInterviews() {
    try {
      return await interviewService.getInterviews();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getInterview(id: string) {
    try {
      return await interviewService.getInterview(id);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async deleteInterview(id: string) {
    try {
      return await interviewService.deleteInterview(id);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      return await leaderboardService.getLeaderboard();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getPublicUsers() {
    try {
      return await profileService.getPublicCandidates();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getProfile() {
    try {
      return await profileService.getCurrentProfile();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async updateProfile(updates: Partial<User>) {
    try {
      const mappedUpdates: ProfileUpdateInput = {
        avatarColor: updates.avatarColor,
        bio: updates.bio,
        education: updates.education,
        experienceLevel: updates.experienceLevel,
        githubUrl: updates.githubUrl,
        jobTitle: updates.jobTitle,
        linkedinUrl: updates.linkedinUrl,
        location: updates.location,
        name: updates.name,
        phoneNumber: updates.phoneNumber,
        portfolioUrl: updates.portfolioUrl,
        profilePicture: updates.profilePicture,
        skills: updates.skills,
        username: updates.username,
      };

      return await profileService.updateProfile(mappedUpdates);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async uploadAvatar(file: File) {
    try {
      return await profileService.uploadAvatar(file);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async deleteAvatar(publicUrl: string | null | undefined) {
    try {
      await profileService.deleteAvatar(publicUrl);
      return { success: true };
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      return await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    try {
      return await profileService.getAdminUsers();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      return await interviewService.getAdminStats();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async updateUserRole(userId: string, role: 'admin' | 'user') {
    try {
      return await profileService.updateUserRole(userId, role);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async deleteUser(userId: string) {
    try {
      return await profileService.deleteUser(userId);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async saveResume(resume: Resume) {
    try {
      return await resumeService.saveResume(resume);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getResumes() {
    try {
      return await resumeService.getResumes();
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getResume(id: string) {
    try {
      return await resumeService.getResume(id);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async deleteResume(id: string) {
    try {
      return await resumeService.deleteResume(id);
    } catch (error) {
      throw toAPIError(error);
    }
  }

  async getHistory() {
    try {
      return await historyService.getHistory();
    } catch (error) {
      throw toAPIError(error);
    }
  }
}

export const api = new APIClient();
