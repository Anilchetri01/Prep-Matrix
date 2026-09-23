# PrepMatrix - Supabase Backend

This directory contains the database schema, migrations, security policies, and triggers required to power PrepMatrix.

## Structure

```
supabase/
├── migrations/
│   └── 20260701000000_initial_schema.sql  # Timestamped SQL migration
├── schema.sql                             # Full consolidated PostgreSQL schema
└── README.md                              # Backend documentation and guide
```

## Database Tables

1. **`profiles`**: Stores user profile information (email, full name, avatar, target role, years of experience, skills, social links).
2. **`interview_sessions`**: Tracks active and past interview sessions (domain, difficulty, mode: manual/ai/resume, questions, answers/transcripts, evaluation metrics, scores).
3. **`interviews`**: Public summaries of completed interview sessions used for leaderboard scoring and user history aggregates.
4. **`history`**: Audit trail of user actions and activity timeline.
5. **`resumes`**: Metadata, extracted text, and skills parsed from user resumes.
6. **`resume_analysis`**: AI ATS analysis, strength breakdowns, improvement points, and recommended roles.

## Security & Row Level Security (RLS)

All tables have Row Level Security enabled. Users can only query, insert, and update their own records (`auth.uid() = user_id`), except for `interviews` which allows read access for the global leaderboard.

## Applying Schema

### Option 1: Supabase Web Console
1. Navigate to your Supabase project dashboard at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor**.
3. Paste the contents of `schema.sql` and click **Run**.

### Option 2: Supabase CLI
```bash
# Initialize and link project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

## Authentication Configuration

1. In Supabase Dashboard -> **Authentication** -> **URL Configuration**:
   - Site URL: `https://your-domain.vercel.app` (or `http://localhost:5173` for development)
   - Redirect URLs: `http://localhost:5173/**`, `https://your-domain.vercel.app/**`
2. Under **Authentication** -> **Providers**, enable **Google** (if using Google OAuth) and configure OAuth Client ID and Secret.
