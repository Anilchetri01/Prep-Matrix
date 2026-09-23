# Document 04 — Database Documentation

**Project**: PrepMatrix  
**Document Version**: 1.0.0  
**Database Engine**: PostgreSQL 15+ (Hosted on Supabase)  
**Schema File**: `Backend/supabase/schema.sql`  
**Migration File**: `Backend/supabase/migrations/20260701000000_initial_schema.sql`  
**Auditor**: Senior Software Architect / Database Engineer  
**Last Updated**: September 24, 2026  

---

## 1. Database Overview

PrepMatrix utilizes **Supabase PostgreSQL** as its primary persistence engine. The database manages user profile metadata, active and completed interview sessions, performance score summaries, user activity history, uploaded resume metadata, and ATS analysis results.

### Core Database Capabilities
- **UUID Primary Keys**: Generated via standard PostgreSQL `uuid-ossp` (`gen_random_uuid()` or `uuid_generate_v4()`).
- **Row Level Security (RLS)**: Enforced across 100% of user data tables, restricting queries and modifications strictly to authenticated owners (`auth.uid() = user_id`), with an explicit public read policy for the `interviews` leaderboard table.
- **Automated Triggers**: Trigger functions synchronizing user profile provisioning from `auth.users` upon signup and auto-updating `updated_at` timestamps on row modifications.
- **JSONB Document Storage**: Unstructured payload storage for interview questions, transcripts, evaluation metrics, skills arrays, and full ATS analysis reports.
- **Binary Object Storage**: Paired Supabase Storage buckets (`avatars` and `resumes`) integrated via public and signed URLs.

---

## 2. Table Schemas

### 2.1 Table: `public.profiles`
Stores extended user profile attributes linked 1:1 with Supabase Auth accounts.

| Column | Type | Nullable | Default | Primary Key | Foreign Key | Description |
|---|---|---|---|---|---|---|
| `id` | `uuid` | No | None | Yes | `auth.users(id)` ON DELETE CASCADE | Unique user identifier matching Supabase Auth ID |
| `email` | `text` | Yes | None | No | None | User email address synchronized from auth |
| `full_name` | `text` | Yes | None | No | None | Full display name of the candidate |
| `avatar_url` | `text` | Yes | None | No | None | URL pointing to stored avatar or Google OAuth picture |
| `role` | `text` | Yes | `'candidate'` | No | None | User permission tier (`'candidate'`, `'user'`, `'admin'`) |
| `target_role` | `text` | Yes | None | No | None | Target career aspiration (e.g. "DevOps Engineer") |
| `experience_years` | `numeric` | Yes | `0` | No | None | Self-reported years of industry experience |
| `skills` | `jsonb` | Yes | `'[]'::jsonb` | No | None | JSON array of core candidate skills |
| `social_links` | `jsonb` | Yes | `'{}'::jsonb` | No | None | JSON object containing GitHub, LinkedIn, portfolio URLs |
| `preferred_theme` | `text` | Yes | `'dark'` | No | None | User interface theme preference (`'dark'`, `'light'`) |
| `created_at` | `timestamptz` | Yes | `now()` | No | None | Account creation timestamp |
| `updated_at` | `timestamptz` | Yes | `now()` | No | None | Timestamp of last profile update |

---

### 2.2 Table: `public.interview_sessions`
Tracks active, in-progress, and completed interview practice sessions.

| Column | Type | Nullable | Default | Primary Key | Foreign Key | Description |
|---|---|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Yes | None | Unique session session identifier |
| `user_id` | `uuid` | Yes | None | No | `public.profiles(id)` ON DELETE CASCADE | Reference to the participating candidate |
| `domain` | `text` | No | None | No | None | Domain track (e.g. `'frontend-dev'`, `'devops'`) |
| `difficulty` | `text` | No | None | No | None | Difficulty tier (`'beginner'`, `'intermediate'`, `'advanced'`) |
| `mode` | `text` | Yes | `'manual'` | No | None | Practice mode (`'manual'`, `'ai'`, `'resume'`) |
| `title` | `text` | Yes | None | No | None | Optional human-readable session title |
| `status` | `text` | Yes | `'in_progress'` | No | None | Lifecycle state (`'in_progress'`, `'completed'`, `'abandoned'`) |
| `score` | `numeric` | Yes | `0` | No | None | Overall calculated session score (0-100) |
| `questions` | `jsonb` | Yes | `'[]'::jsonb` | No | None | Array of question objects presented to the candidate |
| `transcripts` | `jsonb` | Yes | `'[]'::jsonb` | No | None | Candidate response answers, transcripts, and per-question scores |
| `metrics` | `jsonb` | Yes | `'{}'::jsonb` | No | None | Time spent, pacing, confidence, and keyword metrics |
| `feedback` | `jsonb` | Yes | `'{}'::jsonb` | No | None | Structured strengths, weaknesses, and improvement suggestions |
| `duration_seconds` | `integer` | Yes | `0` | No | None | Total cumulative duration of session in seconds |
| `started_at` | `timestamptz` | Yes | `now()` | No | None | Timestamp when the first question was rendered |
| `completed_at` | `timestamptz` | Yes | None | No | None | Timestamp when the session was finalized |
| `created_at` | `timestamptz` | Yes | `now()` | No | None | Database record creation timestamp |

---

### 2.3 Table: `public.interviews`
Summary table used for global leaderboard rankings, public aggregation, and quick performance lookups.

| Column | Type | Nullable | Default | Primary Key | Foreign Key | Description |
|---|---|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Yes | None | Unique record identifier |
| `user_id` | `uuid` | Yes | None | No | `public.profiles(id)` ON DELETE CASCADE | Reference to the candidate |
| `session_id` | `uuid` | Yes | None | No | `public.interview_sessions(id)` ON DELETE SET NULL | Reference to parent session |
| `domain` | `text` | No | None | No | None | Career domain name or ID |
| `mode` | `text` | No | None | No | None | Mode of interview (`'manual'`, `'ai'`) |
| `score` | `numeric` | Yes | `0` | No | None | Final session score (0-100) |
| `questions_count`| `integer` | Yes | `0` | No | None | Total questions completed in the session |
| `duration_seconds`| `integer`| Yes | `0` | No | None | Total elapsed time in seconds |
| `completed_at` | `timestamptz` | Yes | `now()` | No | None | Completion timestamp |
| `created_at` | `timestamptz` | Yes | `now()` | No | None | Record insertion timestamp |

---

### 2.4 Table: `public.history`
Audit log recording significant user actions and activity timeline milestones.

| Column | Type | Nullable | Default | Primary Key | Foreign Key | Description |
|---|---|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Yes | None | Unique audit event identifier |
| `user_id` | `uuid` | Yes | None | No | `public.profiles(id)` ON DELETE CASCADE | User who triggered the action |
| `action` | `text` | No | None | No | None | Action descriptor (e.g. `'interview_started'`, `'profile_updated'`) |
| `details` | `jsonb` | Yes | `'{}'::jsonb` | No | None | Arbitrary contextual metadata related to the event |
| `created_at` | `timestamptz` | Yes | `now()` | No | None | Timestamp when the action occurred |

---

### 2.5 Table: `public.resumes`
Stores candidate resume files, parsed textual content, and extracted skills.

| Column | Type | Nullable | Default | Primary Key | Foreign Key | Description |
|---|---|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Yes | None | Unique resume record identifier |
| `user_id` | `uuid` | Yes | None | No | `public.profiles(id)` ON DELETE CASCADE | Resume owner |
| `file_name` | `text` | No | None | No | None | Original upload file name |
| `file_url` | `text` | Yes | None | No | None | Public or signed URL in Supabase Storage |
| `file_size` | `integer` | Yes | None | No | None | File size in bytes |
| `parsed_text` | `text` | Yes | None | No | None | Plaintext extracted from PDF |
| `extracted_skills`| `jsonb`| Yes | `'[]'::jsonb` | No | None | JSON array of skills identified during parsing |
| `experience_summary`| `text`| Yes | None | No | None | High-level summary of candidate background |
| `created_at` | `timestamptz` | Yes | `now()` | No | None | Upload timestamp |
| `updated_at` | `timestamptz` | Yes | `now()` | No | None | Last modification timestamp |

---

### 2.6 Table: `public.resume_analysis`
Stores algorithmic and AI-generated ATS analysis scores and recommendations.

| Column | Type | Nullable | Default | Primary Key | Foreign Key | Description |
|---|---|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Yes | None | Unique analysis record identifier |
| `resume_id` | `uuid` | Yes | None | No | `public.resumes(id)` ON DELETE CASCADE | Associated resume record |
| `user_id` | `uuid` | Yes | None | No | `public.profiles(id)` ON DELETE CASCADE | Associated user |
| `overall_score` | `numeric` | Yes | `0` | No | None | Composite ATS readiness score (0-100) |
| `ats_score` | `numeric` | Yes | `0` | No | None | Specific keyword matching score |
| `strengths` | `jsonb` | Yes | `'[]'::jsonb` | No | None | Standout positive resume characteristics |
| `improvements` | `jsonb` | Yes | `'[]'::jsonb` | No | None | Missing skills and formatting weaknesses |
| `recommended_roles`| `jsonb`| Yes | `'[]'::jsonb` | No | None | Suggested job titles aligned with profile |
| `full_analysis` | `jsonb` | Yes | `'{}'::jsonb` | No | None | Complete structured analysis payload |
| `created_at` | `timestamptz` | Yes | `now()` | No | None | Timestamp when analysis was conducted |

---

## 3. Database Indexes

The schema creates performance indexes across foreign keys, filter criteria, and sorting columns:

```sql
-- Profiles email index for lookups during login/recovery
create index if not exists idx_profiles_email on public.profiles(email);

-- Interview Sessions indexes for user history and dashboard queries
create index if not exists idx_interview_sessions_user on public.interview_sessions(user_id);
create index if not exists idx_interview_sessions_domain on public.interview_sessions(domain);
create index if not exists idx_interview_sessions_status on public.interview_sessions(status);

-- Leaderboard query optimization (score descending)
create index if not exists idx_interviews_user on public.interviews(user_id);
create index if not exists idx_interviews_domain on public.interviews(domain);
create index if not exists idx_interviews_score on public.interviews(score desc);

-- Audit history index
create index if not exists idx_history_user on public.history(user_id);

-- Resume lookup indexes
create index if not exists idx_resumes_user on public.resumes(user_id);
create index if not exists idx_resume_analysis_user on public.resume_analysis(user_id);
create index if not exists idx_resume_analysis_resume on public.resume_analysis(resume_id);
```

---

## 4. Row-Level Security (RLS) Policies

All database tables have Row-Level Security enabled (`alter table ... enable row level security;`).

| Table Name | Policy Name | Command | Target Role | Permissive USING Expression | WITH CHECK Expression |
|---|---|---|---|---|---|
| `profiles` | "Users can view own profile" | `SELECT` | `authenticated` | `auth.uid() = id` | N/A |
| `profiles` | "Users can update own profile" | `UPDATE` | `authenticated` | `auth.uid() = id` | N/A |
| `profiles` | "Users can insert own profile" | `INSERT` | `authenticated` | N/A | `auth.uid() = id` |
| `interview_sessions` | "Users can view own interview sessions" | `SELECT` | `authenticated` | `auth.uid() = user_id` | N/A |
| `interview_sessions` | "Users can insert own interview sessions" | `INSERT` | `authenticated` | N/A | `auth.uid() = user_id` |
| `interview_sessions` | "Users can update own interview sessions" | `UPDATE` | `authenticated` | `auth.uid() = user_id` | N/A |
| `interview_sessions` | "Users can delete own interview sessions" | `DELETE` | `authenticated` | `auth.uid() = user_id` | N/A |
| `interviews` | "Public or authenticated users can view interviews for leaderboard" | `SELECT` | `public`, `authenticated` | `true` | N/A |
| `interviews` | "Users can insert own interviews" | `INSERT` | `authenticated` | N/A | `auth.uid() = user_id` |
| `interviews` | "Users can update own interviews" | `UPDATE` | `authenticated` | `auth.uid() = user_id` | N/A |
| `history` | "Users can view own history" | `SELECT` | `authenticated` | `auth.uid() = user_id` | N/A |
| `history` | "Users can insert own history" | `INSERT` | `authenticated` | N/A | `auth.uid() = user_id` |
| `resumes` | "Users can manage own resumes" | `ALL` | `authenticated` | `auth.uid() = user_id` | N/A |
| `resume_analysis` | "Users can view own resume analysis" | `SELECT` | `authenticated` | `auth.uid() = user_id` | N/A |
| `resume_analysis` | "Users can insert own resume analysis" | `INSERT` | `authenticated` | N/A | `auth.uid() = user_id` |

---

## 5. Automated Triggers & Functions

### 5.1 Profile Auto-Provisioning Trigger
When a user registers via email/password or Google OAuth, Supabase GoTrue inserts a row into `auth.users`. The trigger automatically synchronizes profile creation:

```sql
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 5.2 Updated Timestamp Trigger
Automatically updates the `updated_at` column whenever a row is modified:

```sql
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
```

---

## 6. Documented RPC Procedures & Gaps

The TypeScript frontend codebase invokes several stored procedures (`supabase.rpc(...)`) that exist on the live Supabase instance but are **omitted from the repository SQL migrations**:

| Procedure Name | Invoked In | Parameters | Purpose | Status in Repository SQL |
|---|---|---|---|---|
| `ensure_user_profile` | `profileService.ts` | `{ user_id, user_email, ... }` | Ensures profile exists with fallback username | **Missing from SQL** (Handled by client fallback) |
| `get_public_candidates` | `profileService.ts` | None | Retrieves public directory of candidates with stats | **Missing from SQL** |
| `get_leaderboard` | `leaderboardService.ts` | `{ limit_count: integer }` | Calculates top rankings across completed sessions | **Missing from SQL** |
| `admin_list_users` | `profileService.ts` | None | Lists all user accounts with practice counts for admin | **Missing from SQL** |
| `admin_update_user_role`| `profileService.ts` | `{ target_user_id, new_role }` | Updates user role between 'admin' and 'user' | **Missing from SQL** |
| `admin_delete_user` | `profileService.ts` | `{ target_user_id }` | Deletes user from auth and public tables | **Missing from SQL** |
| `admin_platform_stats` | `interviewService.ts` | None | Aggregates daily activity and difficulty stats | **Missing from SQL** |

---

## 7. Storage Buckets

PrepMatrix configures two primary storage buckets via Supabase Storage:

1. **`avatars`**:
   - Access: Public read access enabled.
   - Storage Path Pattern: `${userId}/${timestamp}-${sanitizedFileName}`.
   - Purpose: Stores user profile photos and custom uploaded avatar graphics.
2. **`resumes`**:
   - Access: Authenticated user read/write access.
   - Storage Path Pattern: `${userId}/${timestamp}-${sanitizedFileName}`.
   - Purpose: Stores uploaded original PDF resume documents for download and ATS re-analysis.
