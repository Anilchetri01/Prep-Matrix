# Document 13 — Deployment & DevOps Documentation

**Project**: PrepMatrix  
**Document Version**: 1.0.0  
**Hosting Platform**: Vercel (Edge & Serverless)  
**Database Platform**: Supabase Cloud (PostgreSQL 15+)  
**CI Runner**: GitHub Actions  
**Auditor**: Senior DevOps Engineer / Release Manager  
**Last Updated**: September 24, 2026  

---

## 1. Local Development Setup

### 1.1 Prerequisites
- **Node.js**: Version `20.x` LTS or higher.
- **npm**: Version `10.x` or higher.
- **Git**: Installed and configured.
- **Supabase Account**: A free or pro project at [supabase.com](https://supabase.com/).
- **Google AI Studio Key**: A valid Gemini API key from [aistudio.google.com](https://aistudio.google.com/).

### 1.2 Step-by-Step Local Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Anilchetri01/Prep-Matrix.git
   cd Prep-Matrix
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd Frontend/PrepMatrix
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `Frontend/PrepMatrix/` using `.env.example` as a template:
   ```bash
   cp .env.example .env
   ```
   Populate `.env` with your project credentials:
   ```env
   # Browser Variables (Vite Bundled)
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Serverless Proxy Variables (Local Dev & Vercel Serverless)
   GEMINI_API_KEY=your-actual-gemini-api-key
   GEMINI_MODEL=gemini-2.5-flash
   ```

4. **Run Local Development Server**:
   ```bash
   npm run dev
   ```
   The application will boot at `http://localhost:5173`.  
   *Note*: In development, Vite's custom middleware (`localGeminiProxyPlugin` in `vite.config.ts`) intercepts `/api/gemini` and handles requests locally using `server/geminiProxy.js`, perfectly mirroring Vercel serverless behavior without requiring external CLI emulation.

---

## 2. Production Build & Validation Commands

All commands are run from `Frontend/PrepMatrix`:

```bash
# 1. Validate Question Bank Structure (5,820 questions across 97 domains)
npm run validate:manual-questions

# 2. Run Mobile Navigation Gesture Physics Tests
npm run test:gestures

# 3. Compile Production Bundle
npm run build

# 4. Preview Compiled Production Bundle Locally
npm run preview
```

The production output compiles to `Frontend/PrepMatrix/dist/`.

---

## 3. Vercel Production Deployment

PrepMatrix is designed for deployment on the **Vercel** platform.

### 3.1 Vercel Project Configuration
As verified in `.vercel/project.json`:
- **Project Name**: `prep-matrix`
- **Framework Preset**: Vite
- **Root Directory**: `Frontend/PrepMatrix`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.2 Routing & Edge Caching Configuration (`vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/.*",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      "dest": "/index.html"
    }
  ]
}
```

### 3.3 Production Serverless Functions
- **`/api/gemini`**: Automatically mapped by Vercel from `Frontend/PrepMatrix/api/gemini.js`. It runs as an edge-accessible Node.js serverless function with environment variables securely provisioned in Vercel Project Settings.

---

## 4. Supabase Database Deployment & Migrations

### 4.1 Applying PostgreSQL Schema
1. Log in to the [Supabase Web Console](https://supabase.com/).
2. Select your target project and open the **SQL Editor**.
3. Open `Backend/supabase/schema.sql` from this repository.
4. Paste the full script into the SQL Editor and click **Run**.
5. Ensure the table definitions, indexes, RLS policies, and trigger functions (`handle_new_user`, `set_updated_at`) are created cleanly.

### 4.2 Creating Storage Buckets
In the Supabase Console, navigate to **Storage** and create two buckets:
1. **`avatars`**:
   - Set to **Public**.
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
2. **`resumes`**:
   - Set to **Private** (Authenticated access only).
   - Allowed MIME types: `application/pdf`.

### 4.3 Supabase Authentication URL Configuration
In **Authentication** -> **URL Configuration**:
- **Site URL**: `https://prep-matrix.vercel.app` (or your custom domain).
- **Redirect URLs**:
  - `http://localhost:5173/**`
  - `https://prep-matrix.vercel.app/**`
- **OAuth Providers**: If using Google OAuth, enable Google under **Authentication** -> **Providers** and input your Google Cloud Console OAuth Client ID and Secret.

---

## 5. Continuous Integration (CI/CD Pipeline)

Automated testing and build validation are configured in `.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'Frontend/PrepMatrix/package-lock.json'

      - name: Install Frontend Dependencies
        working-directory: ./Frontend/PrepMatrix
        run: npm ci

      - name: Validate Question Bank Integrity
        working-directory: ./Frontend/PrepMatrix
        run: npm run validate:manual-questions

      - name: Run Gesture Physics Tests
        working-directory: ./Frontend/PrepMatrix
        run: npm run test:gestures

      - name: Build Frontend Application
        working-directory: ./Frontend/PrepMatrix
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build
```

---

## 6. Rollback & Disaster Recovery Procedures

1. **Instant Vercel Rollback**:
   - In the Vercel Project Dashboard, navigate to **Deployments**.
   - Select the previously verified healthy deployment and click **Rollback to this Deployment**.
   - Traffic shifts instantaneously at the edge CDN level.
2. **Database Point-in-Time Recovery**:
   - Supabase Pro/Team tiers provide automated daily backups and WAL-based Point-in-Time Recovery (PITR) up to 7 days.
   - For database schema rollbacks, restore via the Supabase database backups panel or run inverse SQL statements.
