import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { InterviewSession } from '../types';
import { aiInterviewService } from '../modules/aiMode/services/aiInterviewService';
import type { AIInterviewSession } from '../modules/aiMode/types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  User, Mail, Briefcase, FileText, Lock, Eye, EyeOff,
  Save, ShieldCheck, Calendar, TrendingUp, Trophy, MapPin,
  Phone, GraduationCap, Link as LinkIcon, Github, Linkedin,
  Globe, Camera, Tag, Award, Upload, Trash2, Image,
} from 'lucide-react';
import { format } from 'date-fns';

interface ProfileForm {
  name: string;
  username: string;
  bio: string;
  jobTitle: string;
  phoneNumber: string;
  location: string;
  education: string;
  experienceLevel: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  skills: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#3B82F6', '#14B8A6', '#F97316', '#84CC16',
];

function UserAvatar({
  name,
  color,
  imageUrl,
  size = 80,
}: {
  name: string;
  color?: string;
  imageUrl?: string | null;
  size?: number;
}) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="rounded-full object-cover shadow-xl"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shadow-xl"
      style={{ width: size, height: size, backgroundColor: color ?? '#6366F1', fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export function Profile() {
  const { user, updateUser } = useAuth();
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [aiInterviews, setAiInterviews] = useState<AIInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'stats'>('profile');
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture ?? null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  const profileForm = useForm<ProfileForm>({
    defaultValues: { 
      name: user?.name ?? '', 
      username: user?.username ?? '', 
      bio: user?.bio ?? '', 
      jobTitle: user?.jobTitle ?? '', 
      phoneNumber: user?.phoneNumber ?? '', 
      location: user?.location ?? '', 
      education: user?.education ?? '', 
      experienceLevel: user?.experienceLevel ?? '', 
      linkedinUrl: user?.linkedinUrl ?? '', 
      githubUrl: user?.githubUrl ?? '', 
      portfolioUrl: user?.portfolioUrl ?? '', 
      skills: Array.isArray(user?.skills) ? user.skills.join(', ') : '', 
    },
  });

  const passwordForm = useForm<PasswordForm>();
  const newPwd = passwordForm.watch('newPassword', '');

  useEffect(() => {
    isMountedRef.current = true;

    const load = async () => {
      try {
        console.log('[Profile] load:start');
        const [profileData, interviewData, aiInterviewData] = await Promise.all([
          api.getProfile(),
          api.getInterviews(),
          aiInterviewService.listSessions().catch((error) => {
            console.warn('[Profile] AI interview stats unavailable', error);
            return [] as AIInterviewSession[];
          }),
        ]);

        if (!isMountedRef.current) return;

        updateUser(profileData);
        setInterviews(interviewData);
        setAiInterviews(aiInterviewData);
        setSelectedColor(profileData.avatarColor ?? AVATAR_COLORS[0]);
        setProfilePicture(profileData.profilePicture ?? null);
        setSelectedAvatarFile(null);
        setAvatarMarkedForRemoval(false);
        profileForm.reset({
          name: profileData.name ?? '',
          username: profileData.username ?? '',
          bio: profileData.bio ?? '',
          jobTitle: profileData.jobTitle ?? '',
          phoneNumber: profileData.phoneNumber ?? '',
          location: profileData.location ?? '',
          education: profileData.education ?? '',
          experienceLevel: profileData.experienceLevel ?? '',
          linkedinUrl: profileData.linkedinUrl ?? '',
          githubUrl: profileData.githubUrl ?? '',
          portfolioUrl: profileData.portfolioUrl ?? '',
          skills: Array.isArray(profileData.skills)
            ? profileData.skills.join(', ')
            : '',
        });
        console.log('[Profile] load:success', {
          aiInterviews: aiInterviewData.length,
          interviews: interviewData.length,
          userId: profileData.id,
        });
      } catch (error: any) {
        console.error('[Profile] load:error', error);
        toast.error(error?.message || 'Unable to load your profile.');
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };
    void load();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaveProfile = async (data: ProfileForm) => {
    console.log('[Profile] save:start', data);
    setSavingProfile(true);
    let uploadedAvatarUrl: string | null = null;

    try {
      if (!user) {
        throw new Error('You must be signed in to update your profile.');
      }

      let nextAvatarUrl = user?.profilePicture ?? null;
      let previousAvatarUrlToDelete: string | null = null;

      if (selectedAvatarFile) {
        uploadedAvatarUrl = await api.uploadAvatar(selectedAvatarFile);
        nextAvatarUrl = uploadedAvatarUrl;
        previousAvatarUrlToDelete = user.profilePicture ?? null;
      } else if (avatarMarkedForRemoval && user?.profilePicture) {
        nextAvatarUrl = null;
        previousAvatarUrlToDelete = user.profilePicture;
      }

      const updated = await api.updateProfile({
        name: data.name,
        username: data.username,
        bio: data.bio,
        jobTitle: data.jobTitle,
        phoneNumber: data.phoneNumber,
        location: data.location,
        education: data.education,
        experienceLevel: data.experienceLevel,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
        skills: (data.skills || '')
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        avatarColor: selectedColor,
        profilePicture: nextAvatarUrl ?? undefined,
      });

      if (previousAvatarUrlToDelete) {
        try {
          await api.deleteAvatar(previousAvatarUrlToDelete);
        } catch (avatarDeleteError) {
          console.error('[Profile] save:avatarCleanup:error', avatarDeleteError);
          toast.warning('Profile saved, but old avatar cleanup failed.');
        }
      }

      if (!isMountedRef.current) return;

      updateUser(updated);
      setProfilePicture(updated.profilePicture ?? null);
      setSelectedAvatarFile(null);
      setAvatarMarkedForRemoval(false);
      profileForm.reset({
        name: updated.name ?? '',
        username: updated.username ?? '',
        bio: updated.bio ?? '',
        jobTitle: updated.jobTitle ?? '',
        phoneNumber: updated.phoneNumber ?? '',
        location: updated.location ?? '',
        education: updated.education ?? '',
        experienceLevel: updated.experienceLevel ?? '',
        linkedinUrl: updated.linkedinUrl ?? '',
        githubUrl: updated.githubUrl ?? '',
        portfolioUrl: updated.portfolioUrl ?? '',
        skills: Array.isArray(updated.skills) ? updated.skills.join(', ') : '',
      });
      console.log('[Profile] save:success', { userId: updated.id });
      toast.success('Profile updated!');
    } catch (err: any) {
      console.error('[Profile] save:error', err);
      if (uploadedAvatarUrl) {
        api.deleteAvatar(uploadedAvatarUrl).catch((cleanupError) => {
          console.error('[Profile] save:uploadCleanup:error', cleanupError);
        });
      }
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      if (isMountedRef.current) {
        setSavingProfile(false);
      }
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    console.log('[Profile] passwordChange:start');
    setSavingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      await api.changePassword(data.currentPassword, data.newPassword);
      console.log('[Profile] passwordChange:success');
      if (isMountedRef.current) {
        setPasswordSuccess('Password changed successfully.');
        passwordForm.reset();
      }
      toast.success('Password changed successfully.');
    } catch (err: any) {
      console.error('[Profile] passwordChange:error', err);
      if (isMountedRef.current) {
        setPasswordError(err?.message || 'Failed to update password');
      }
      toast.error(err?.message || 'Failed to update password');
    } finally {
      if (isMountedRef.current) {
        setSavingPassword(false);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setSelectedAvatarFile(file);
      setAvatarMarkedForRemoval(false);
      setProfilePicture(base64);
      toast.success('Photo selected! Save profile to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedAvatarFile(null);
    setAvatarMarkedForRemoval(true);
    setProfilePicture(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Photo removed. Save profile to apply.');
  };

  const completedManual = interviews.filter((i) => i.status === 'completed');
  const completedAi = aiInterviews.filter((i) => i.status === 'completed');
  const completed = [
    ...completedManual.map((interview) => ({
      difficulty: interview.difficulty,
      domainName: interview.domainName,
      id: interview.id,
      score: interview.score ?? 0,
      startTime: interview.endTime ?? interview.startTime,
    })),
    ...completedAi.map((interview) => ({
      difficulty: interview.difficulty,
      domainName: interview.analysis.domain,
      id: interview.id,
      score: interview.overallScore ?? 0,
      startTime: interview.endedAt ?? interview.startedAt ?? interview.createdAt,
    })),
  ];
  const scoredCompleted = completed.filter((i) => i.score > 0);
  const avgScore = scoredCompleted.length > 0
    ? Math.round(scoredCompleted.reduce((s, i) => s + i.score, 0) / scoredCompleted.length)
    : 0;
  const bestScore = scoredCompleted.length > 0 ? Math.max(...scoredCompleted.map((i) => i.score)) : 0;

  // Domain breakdown
  const domainMap: Record<string, { count: number; totalScore: number }> = {};
  completed.forEach((i) => {
    if (!domainMap[i.domainName]) domainMap[i.domainName] = { count: 0, totalScore: 0 };
    domainMap[i.domainName].count++;
    domainMap[i.domainName].totalScore += i.score;
  });
  const domainData = Object.entries(domainMap)
    .map(([name, { count, totalScore }]) => ({
      name: name.length > 14 ? name.slice(0, 14) + '…' : name,
      avgScore: Math.round(totalScore / count),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
  ] as const;

  if (!user) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <Navbar />

      <main className="mx-auto w-full min-w-0 max-w-4xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Profile card header */}
        <div className="min-w-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shadow-lg sm:p-6 sm:shadow-xl">
          <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
            <UserAvatar
              name={user.name}
              color={selectedColor}
              imageUrl={profilePicture}
              size={80}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {user.role === 'admin' && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="mt-0.5 break-all text-sm text-indigo-200 sm:break-normal">{user.email}</p>
              {user.jobTitle && (
                <p className="text-indigo-100 text-sm flex items-center gap-1 justify-center sm:justify-start mt-1">
                  <Briefcase className="w-3 h-3" /> {user.jobTitle}
                </p>
              )}
              <p className="text-indigo-300 text-xs flex items-center gap-1 justify-center sm:justify-start mt-2">
                <Calendar className="w-3 h-3" />
                Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 text-center sm:flex sm:w-auto sm:gap-6">
              <div>
                <p className="text-2xl font-bold">{completed.length}</p>
                <p className="text-indigo-200 text-xs">Interviews</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore}%</p>
                <p className="text-indigo-200 text-xs">Avg Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{bestScore}%</p>
                <p className="text-indigo-200 text-xs">Best Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
          <div className="grid grid-cols-3 border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="Profile sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                role="tab"
                aria-selected={activeTab === id}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-semibold transition-colors sm:min-h-12 sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                  activeTab === id
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5 p-4 sm:p-6">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
                  {/* Preview */}
                  <div className="relative flex-shrink-0">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-indigo-200 dark:border-indigo-700"
                      />
                    ) : (
                      <UserAvatar name={user.name} color={selectedColor} size={80} />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Upload profile picture"
                      className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-indigo-600 shadow-md transition-colors hover:bg-indigo-700 dark:border-gray-800"
                    >
                      <Camera className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Buttons */}
                  <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                    >
                      <Upload className="w-4 h-4" />
                      {profilePicture ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {profilePicture && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Photo
                      </button>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      JPG, PNG or GIF · Max 2MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Avatar color */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#5F6F84] dark:text-[#AAB7CA]">
                  Avatar Color <span className="normal-case text-[#7F8CA0] dark:text-[#718096]">(used when no photo)</span>
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Use ${color} avatar color`}
                      aria-pressed={selectedColor === color}
                      className="w-7 h-7 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6D5EF9]"
                      style={{
                        backgroundColor: color,
                        transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: selectedColor === color ? '0 0 0 2px #fff, 0 0 0 4px #6D5EF9' : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Profile Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-name"
                      type="text"
                      autoComplete="name"
                      {...profileForm.register('name', {
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Full name must be at least 2 characters' },
                        validate: (v) => (v && v.trim().length >= 2) || 'Full name cannot be empty or whitespace',
                      })}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                  {profileForm.formState.errors.name && (
                    <p role="alert" className="text-xs text-[#FB7185] mt-1">
                      {profileForm.formState.errors.name.message || 'Full name is required (min 2 characters)'}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="profile-username" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-username"
                      type="text"
                      autoComplete="username"
                      {...profileForm.register('username', {
                        required: 'Username is required',
                        minLength: { value: 2, message: 'Username must be at least 2 characters' },
                        validate: (v) => (v && v.trim().length >= 2) || 'Username cannot be empty or whitespace',
                      })}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                  {profileForm.formState.errors.username && (
                    <p role="alert" className="text-xs text-[#FB7185] mt-1">
                      {profileForm.formState.errors.username.message || 'Username is required (min 2 characters)'}
                    </p>
                  )}
                </div>

                {/* Job Title */}
                <div>
                  <label htmlFor="profile-jobTitle" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-jobTitle"
                      type="text"
                      placeholder="e.g. Software Engineer"
                      {...profileForm.register('jobTitle')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="sm:col-span-2">
                  <label htmlFor="profile-bio" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    rows={3}
                    placeholder="A short bio about yourself..."
                    {...profileForm.register('bio')}
                    className="w-full min-h-[88px] p-3 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors resize-none"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="profile-phoneNumber" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-phoneNumber"
                      type="text"
                      autoComplete="tel"
                      placeholder="e.g. +1234567890"
                      {...profileForm.register('phoneNumber')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="profile-location" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-location"
                      type="text"
                      placeholder="e.g. New York, USA"
                      {...profileForm.register('location')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Education */}
                <div>
                  <label htmlFor="profile-education" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Education
                  </label>
                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-education"
                      type="text"
                      placeholder="e.g. Bachelor's in Computer Science"
                      {...profileForm.register('education')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label htmlFor="profile-experienceLevel" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Experience Level
                  </label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-experienceLevel"
                      type="text"
                      placeholder="e.g. Junior Developer"
                      {...profileForm.register('experienceLevel')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label htmlFor="profile-linkedinUrl" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    LinkedIn URL
                  </label>
                  <div className="relative">
                    <Linkedin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-linkedinUrl"
                      type="text"
                      placeholder="e.g. https://linkedin.com/in/username"
                      {...profileForm.register('linkedinUrl')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* GitHub URL */}
                <div>
                  <label htmlFor="profile-githubUrl" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    GitHub URL
                  </label>
                  <div className="relative">
                    <Github className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-githubUrl"
                      type="text"
                      placeholder="e.g. https://github.com/username"
                      {...profileForm.register('githubUrl')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Portfolio URL */}
                <div>
                  <label htmlFor="profile-portfolioUrl" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Portfolio URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-portfolioUrl"
                      type="text"
                      placeholder="e.g. https://portfolio.com/username"
                      {...profileForm.register('portfolioUrl')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="sm:col-span-2">
                  <label htmlFor="profile-skills" className="block text-sm font-semibold text-[#142033] dark:text-[#F4F7FB] mb-1.5">
                    Skills
                  </label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8CA0] dark:text-[#718096]" />
                    <input
                      id="profile-skills"
                      type="text"
                      placeholder="e.g. JavaScript, React, Node.js"
                      {...profileForm.register('skills')}
                      className="w-full h-11 pl-10 pr-4 border border-[#DDE3EC] dark:border-[#263449] rounded-xl text-sm bg-[#F1F4F8] dark:bg-[#172235] text-[#142033] dark:text-[#F4F7FB] placeholder-[#7F8CA0] dark:placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#8174FF]/20 focus:border-[#8174FF] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6D5EF9] hover:bg-[#8174FF] px-6 py-2.5 font-semibold text-white shadow-sm transition-colors disabled:opacity-60 sm:w-auto"
              >
                {savingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-5 p-4 sm:p-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                Choose a strong password with at least 8 characters including uppercase, lowercase, and a number.
              </div>

              {/* Current password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    {...passwordForm.register('currentPassword', { required: 'Required' })}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    {...passwordForm.register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    {...passwordForm.register('confirmPassword', {
                      required: 'Required',
                      validate: (v) => v === newPwd || 'Passwords do not match',
                    })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
              >
                {savingPassword ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {savingPassword ? 'Changing...' : 'Change Password'}
              </button>

              {passwordSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {passwordSuccess}
                </p>
              )}

              {passwordError && (
                <p className="text-sm text-red-500">
                  {passwordError}
                </p>
              )}
            </form>
          )}

          {/* ── Stats Tab ── */}
          {activeTab === 'stats' && (
            <div className="space-y-6 p-4 sm:p-6">
              {loading ? (
                <LoadingSpinner message="Loading stats..." />
              ) : completed.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  No interview data yet. Complete an interview to see your stats!
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    {[
                      { label: 'Total', value: completed.length, icon: '📝' },
                      { label: 'Avg Score', value: `${avgScore}%`, icon: '⭐' },
                      { label: 'Best Score', value: `${bestScore}%`, icon: '🏆' },
                      { label: 'Domains', value: Object.keys(domainMap).length, icon: '🎯' },
                    ].map((s) => (
                      <div key={s.label} className="min-w-0 rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-700/50 sm:p-4">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {domainData.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
                        Performance by Domain
                      </h3>
                      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        Strongest recent domain: {domainData[0].name} at {domainData[0].avgScore}% across {domainData[0].count} session{domainData[0].count === 1 ? '' : 's'}.
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={domainData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#6B7280" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#6B7280" width={90} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                            formatter={(v: any) => [`${v}%`, 'Avg Score']}
                          />
                          <Bar dataKey="avgScore" fill="#6366F1" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recent */}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {[...completed]
                        .sort((a, b) => b.startTime - a.startTime)
                        .slice(0, 5)
                        .map((i) => (
                          <div key={i.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{i.domainName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{i.difficulty} · {format(new Date(i.startTime), 'MMM dd')}</p>
                            </div>
                            <span className={`font-bold ${(i.score ?? 0) >= 75 ? 'text-green-600' : (i.score ?? 0) >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
                              {i.score}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
