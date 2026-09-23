# PrepMatrix - CI/CD Pipeline & Operations Guide

This guide provides instructions for managing, operating, and configuring the automated CI/CD pipeline for **PrepMatrix** using **GitHub Actions**, **Supabase**, and **Vercel**.

---

## 1. Pipeline Overview

The PrepMatrix CI/CD architecture is built on automated GitHub Actions for backend verification & deployment, paired with Vercel's native Git integration for frontend hosting:

| Pipeline / Service | Mechanism | Triggers | Responsibilities |
| --- | --- | --- | --- |
| **CI Quality Gate** | `.github/workflows/ci.yml` | Pull Requests & Pushes to `main` | Validates Question Bank integrity, runs gesture physics tests, verifies the production build, checks migration files, and validates Supabase Edge Functions with Deno. |
| **Supabase CI/CD** | `.github/workflows/supabase.yml` | Push to `main` (`Backend/supabase/**`) or manual `workflow_dispatch` | Links to Supabase, applies pending PostgreSQL migrations (`supabase db push`), synchronizes function secrets, and deploys Edge Functions (`supabase functions deploy`). |
| **Vercel Frontend Hosting** | Native Vercel Git Integration | Pull Requests & Pushes to `main` | Automatically builds and deploys preview environments on PRs, and creates production deployments on merge to `main`. |

---

## 2. GitHub Secrets Setup

To enable automated Supabase migrations and Edge Functions deployments, configure the following secrets in your GitHub repository:

**Path**: GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**

### A. Supabase Secrets

| Secret Name | Where to Find | Description |
| --- | --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard -> **Account** -> **Access Tokens** -> **Generate new token** | Personal Access Token allowing CLI authentication. |
| `SUPABASE_PROJECT_ID` | Supabase Dashboard -> Project -> **Project Settings** -> **General** -> **Reference ID** | 20-character reference ID of your target Supabase project. |
| `SUPABASE_DB_PASSWORD` | Set when creating the Supabase project (or Database Settings) | Database password required for direct PostgreSQL connections and project linking. |

### B. Application Runtime Secrets (Optional / Edge Functions)

| Secret Name | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key automatically synced to Supabase Edge Functions. |
| `GEMINI_MODEL` | *(Optional)* Model override (defaults to `gemini-2.5-flash`). |
| `VITE_SUPABASE_URL` | *(Optional)* Public project URL used in CI build validation. |
| `VITE_SUPABASE_ANON_KEY` | *(Optional)* Public anonymous key used in CI build validation. |

---

## 3. Supabase Migrations Workflow

### Adding a New Migration
1. Create a new SQL file inside `Backend/supabase/migrations/` using timestamped naming:
   ```bash
   YYYYMMDDHHMMSS_brief_description.sql
   ```
   *Example*: `20260715000000_add_interview_bookmarks.sql`

2. Ensure all table creations enable Row Level Security (RLS) and define necessary indexes:
   ```sql
   create table if not exists public.interview_bookmarks (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references public.profiles(id) on delete cascade,
     session_id uuid references public.interview_sessions(id) on delete cascade,
     created_at timestamptz default now()
   );

   alter table public.interview_bookmarks enable row level security;

   create policy "Users can view own bookmarks"
     on public.interview_bookmarks for select
     using (auth.uid() = user_id);
   ```

3. Commit and push:
   - When a Pull Request is opened, `.github/workflows/ci.yml` validates that migration files are properly formatted.
   - When merged to `main`, `.github/workflows/supabase.yml` applies migrations to the production database via `supabase db push`.

---

## 4. Supabase Edge Functions Workflow

Edge Functions reside in `Backend/supabase/functions/` and are built for Deno.

### Directory Structure
```
Backend/supabase/functions/
├── _shared/
│   └── cors.ts              # Standard CORS headers
├── gemini-proxy/
│   └── index.ts             # Secure proxy for Gemini AI requests
├── health-check/
│   └── index.ts             # Diagnostic and uptime verification
└── deno.json                # Deno compiler and linter settings
```

### Adding a New Edge Function
1. Create a new directory under `Backend/supabase/functions/<function-name>/`
2. Create `index.ts`:
   ```typescript
   import { corsHeaders } from '../_shared/cors.ts';

   Deno.serve(async (req: Request) => {
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders });
     }
     return new Response(JSON.stringify({ message: 'Hello from Edge' }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   });
   ```
3. Register the function in `Backend/supabase/config.toml`:
   ```toml
   [functions.my-function]
   verify_jwt = true
   ```
4. Merge to `main`: GitHub Actions will deploy all Edge Functions automatically.

---

## 5. Vercel Frontend Hosting (Native Git Integration)

Vercel is linked directly to your GitHub repository and handles frontend builds automatically:

### Preview Deployments (Pull Requests)
- Every PR touching the frontend automatically triggers a Vercel preview build.
- Vercel automatically comments the preview deployment URL directly on your pull request.

### Production Deployments (`main` Branch)
- Pushing or merging into `main` automatically triggers an optimized production deployment on Vercel.
- Environment variables configured in Vercel Dashboard (Settings -> Environment Variables) are automatically injected during build time.

---

## 6. Manual Triggers & Rollback Strategies

### Manual Workflow Dispatch
You can manually run Supabase migrations or deploy Edge Functions without making a code commit:
1. Navigate to **Actions** in your GitHub repository.
2. Select **Supabase CI/CD (Migrations & Edge Functions)** from the list.
3. Click **Run workflow** -> Choose the branch and select whether to run migrations, deploy functions, or both.

### Rollback Strategy

#### Rolling Back Vercel Frontend
1. Open **Vercel Dashboard** -> Project -> **Deployments**.
2. Find the last known stable deployment.
3. Click `...` -> **Promote to Production** (instant zero-downtime rollback).

#### Rolling Back Supabase Database Migrations
1. Never drop production tables directly without backups.
2. Write a compensating revert migration script (e.g., `20260716000000_revert_feature.sql`).
3. Commit and push the revert migration to `main`, allowing GitHub Actions to execute the migration safely.
