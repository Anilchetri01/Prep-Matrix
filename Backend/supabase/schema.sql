-- ==============================================================================
-- PrepMatrix Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text default 'candidate',
  target_role text,
  experience_years numeric default 0,
  skills jsonb default '[]'::jsonb,
  social_links jsonb default '{}'::jsonb,
  preferred_theme text default 'dark',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index on profiles email
create index if not exists idx_profiles_email on public.profiles(email);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. Interview Sessions Table
-- ------------------------------------------------------------------------------
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  domain text not null,
  difficulty text not null,
  mode text default 'manual', -- 'manual', 'ai', 'resume'
  title text,
  status text default 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  score numeric default 0,
  questions jsonb default '[]'::jsonb,
  transcripts jsonb default '[]'::jsonb,
  metrics jsonb default '{}'::jsonb,
  feedback jsonb default '{}'::jsonb,
  duration_seconds integer default 0,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_interview_sessions_user on public.interview_sessions(user_id);
create index if not exists idx_interview_sessions_domain on public.interview_sessions(domain);
create index if not exists idx_interview_sessions_status on public.interview_sessions(status);

alter table public.interview_sessions enable row level security;

create policy "Users can view own interview sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own interview sessions"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interview sessions"
  on public.interview_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own interview sessions"
  on public.interview_sessions for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. Completed Interviews Summary (for Leaderboard & Analytics)
-- ------------------------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id uuid references public.interview_sessions(id) on delete set null,
  domain text not null,
  mode text not null,
  score numeric default 0,
  questions_count integer default 0,
  duration_seconds integer default 0,
  completed_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_interviews_user on public.interviews(user_id);
create index if not exists idx_interviews_domain on public.interviews(domain);
create index if not exists idx_interviews_score on public.interviews(score desc);

alter table public.interviews enable row level security;

create policy "Public or authenticated users can view interviews for leaderboard"
  on public.interviews for select
  using (true);

create policy "Users can insert own interviews"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interviews"
  on public.interviews for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. User History Table
-- ------------------------------------------------------------------------------
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_history_user on public.history(user_id);

alter table public.history enable row level security;

create policy "Users can view own history"
  on public.history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.history for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. Resumes Table
-- ------------------------------------------------------------------------------
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  file_name text not null,
  file_url text,
  file_size integer,
  parsed_text text,
  extracted_skills jsonb default '[]'::jsonb,
  experience_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_resumes_user on public.resumes(user_id);

alter table public.resumes enable row level security;

create policy "Users can manage own resumes"
  on public.resumes for all
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. Resume Analysis Table
-- ------------------------------------------------------------------------------
create table if not exists public.resume_analysis (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  overall_score numeric default 0,
  ats_score numeric default 0,
  strengths jsonb default '[]'::jsonb,
  improvements jsonb default '[]'::jsonb,
  recommended_roles jsonb default '[]'::jsonb,
  full_analysis jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_resume_analysis_user on public.resume_analysis(user_id);
create index if not exists idx_resume_analysis_resume on public.resume_analysis(resume_id);

alter table public.resume_analysis enable row level security;

create policy "Users can view own resume analysis"
  on public.resume_analysis for select
  using (auth.uid() = user_id);

create policy "Users can insert own resume analysis"
  on public.resume_analysis for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. Automated Triggers & Helper Functions
-- ------------------------------------------------------------------------------

-- Trigger function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger function to update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_resumes_updated_at
  before update on public.resumes
  for each row execute procedure public.set_updated_at();
