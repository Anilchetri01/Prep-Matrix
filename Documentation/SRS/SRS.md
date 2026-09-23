# Software Requirements Specification (SRS)

## PrepMatrix Platform Architecture & System Specifications

---

### 1. Introduction

#### 1.1 Purpose
This document provides a comprehensive technical description of the PrepMatrix platform. It specifies functional and non-functional requirements, software architecture, data models, interfaces, constraints, and operational design to guide engineers and maintainers.

#### 1.2 Scope
PrepMatrix consists of:
1. **Frontend Web Application**: A Single-Page Application (SPA) built with React 18, Vite, React Router 7, and Tailwind CSS v4.
2. **Backend & Database Services**: A PostgreSQL database and authentication engine hosted on Supabase, secured with Row Level Security (RLS).
3. **AI Proxy Service**: A secure serverless proxy (Vercel API route + local Vite dev middleware) providing authenticated, rate-limited communication with Google Gemini API (`gemini-2.5-flash`).
4. **Automated CI/CD**: GitHub Actions workflow verifying code compilation, question bank data structures, and gesture physics tests.

---

### 2. Overall Architecture & System Decomposition

```
[ Client Browser (React 18 / Vite SPA) ]
          │                          │
          │ (Auth / Supabase JS)     │ (HTTP POST /api/gemini)
          ▼                          ▼
[ Supabase Cloud (PostgreSQL) ]    [ Serverless / Vite Proxy ]
  - Auth Service (JWT)               - Request validation & timeouts
  - Row Level Security (RLS)         - Rate limit & retry backoff
  - Tables: profiles, interviews,    - Secure server-side GEMINI_API_KEY
    sessions, resumes, history       │
                                     ▼
                           [ Google Gemini API ]
                             - gemini-2.5-flash
```

---

### 3. Detailed Component Specifications

#### 3.1 Frontend (`Frontend/PrepMatrix`)
- **Framework**: React 18.3.1 with Vite 6.4.2 build system.
- **Routing**: React Router 7 (`react-router`) with protected route wrappers (`ProtectedRoute.tsx`).
- **Styling & Design System**: Tailwind CSS v4, custom CSS variables for light/dark themes, Radix UI primitives.
- **State Management**:
  - `AuthContext`: Provides user authentication state, session listener, login/logout actions.
  - `SettingsContext`: Manages appearance, dark/light mode preference, sound/haptic toggles.
- **Client-Side Utilities**:
  - `pdfjs-dist`: Extracts text content from candidate resumes directly in the browser without requiring external document-parsing servers.
  - `jspdf`: Generates professional PDF interview evaluation reports on demand.
  - `drawerGesturePhysics`: Calculates velocity, drag resistance, and momentum snap points for mobile bottom navigation.

#### 3.2 AI Proxy Layer (`Frontend/PrepMatrix/server` & `api`)
- **Entry Points**:
  - Production: `api/gemini.js` (Vercel Serverless Function).
  - Local Dev: Vite middleware in `vite.config.ts` hooking `/api/gemini`.
- **Core Engine**: `server/geminiProxy.js`
  - Validates request payload schemas.
  - Injects server-side `GEMINI_API_KEY`.
  - Implements 3-tier exponential backoff retries (1s, 2s, 4s) for HTTP 429 and 5xx errors.
  - Enforces per-request timeout (12s) and total operation timeout (30s).

#### 3.3 Database & Security Layer (`Backend/supabase`)
- **Engine**: PostgreSQL 15+ managed via Supabase.
- **Access Model**: All tables (`profiles`, `interview_sessions`, `interviews`, `resumes`, `resume_analysis`, `history`) enforce strict Row-Level Security.
- **Data Isolation**: Policies verify `auth.uid() = user_id`, guaranteeing users cannot read or mutate records belonging to other candidates.
- **Automatic Sync**: PostgreSQL triggers on `auth.users` automatically populate candidate profile records upon signup or OAuth callback.

---

### 4. Data Models & Entity-Relationship Details

#### 4.1 `profiles`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, FK `auth.users(id)` | User unique identifier |
| `email` | `text` | Indexed | User email address |
| `full_name` | `text` | | Candidate display name |
| `avatar_url` | `text` | | Profile avatar link |
| `target_role` | `text` | | Primary career track (e.g. Frontend Engineer) |
| `experience_years` | `numeric` | Default 0 | Years of experience |
| `skills` | `jsonb` | Default `[]` | Array of skill strings |
| `social_links` | `jsonb` | Default `{}` | Key-value pairs of social profile URLs |

#### 4.2 `interview_sessions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Session identifier |
| `user_id` | `uuid` | FK `profiles(id)` | Session owner |
| `domain` | `text` | Indexed | Target domain name |
| `difficulty` | `text` | | beginner, intermediate, advanced |
| `mode` | `text` | Default `'manual'` | manual, ai, resume |
| `status` | `text` | Default `'in_progress'` | in_progress, completed, abandoned |
| `score` | `numeric` | Default 0 | Final or in-progress score |
| `questions` | `jsonb` | | Array of question objects |
| `transcripts` | `jsonb` | | User responses and transcripts |
| `metrics` | `jsonb` | | Granular accuracy, clarity, and depth metrics |

#### 4.3 `resumes` & `resume_analysis`
- Stores raw parsed resume text, ATS score (0-100), key strengths, identified gaps, and targeted role recommendations.

---

### 5. External Interface Requirements

#### 5.1 Google Gemini AI API
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Default Model**: `gemini-2.5-flash`
- **Protocol**: HTTPS POST with JSON payload.
- **Authentication**: `x-goog-api-key` header supplied exclusively by the serverless proxy.

#### 5.2 Supabase API
- **Protocol**: HTTPS REST (`/rest/v1/`) and Realtime WebSockets (`/realtime/v1/`).
- **Auth**: Bearer token (`access_token` JWT) and public `apikey` anon token.

---

### 6. Non-Functional Requirements & System Attributes

#### 6.1 Security Requirements
1. **Zero Secret Leakage**: The client bundle must never include `GEMINI_API_KEY`.
2. **Input Sanitization**: All candidate input is sanitized before inclusion in AI prompt contexts.
3. **Database Guardrails**: Direct database queries use parameterized Supabase client calls preventing SQL injection.

#### 6.2 Reliability & Fault Tolerance
1. **Fallback Question Banks**: If Gemini AI is unavailable, users can seamlessly practice using the pre-compiled offline manual question bank (97+ domains).
2. **Local Session Recovery**: Active interview states are persisted in `localStorage` to prevent loss of progress during accidental browser refreshes.

#### 6.3 Usability & Mobile Ergonomics
1. **Touch Targets**: Minimum touch target size of 44x44 CSS pixels across all buttons and inputs.
2. **Responsive Breakpoints**: Seamless scaling across Small Mobile (320px), Standard Mobile (360px-430px), Tablet (768px-1024px), and Desktop (>1024px).
