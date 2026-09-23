# Document 03 — Software Architecture Document (SAD)

**Project**: PrepMatrix  
**Document Version**: 1.0.0  
**Status**: Production Baseline  
**Auditor**: Senior Software Architect / Forensic Code Reviewer  
**Standard**: 4+1 Architectural View Model Adapted  
**Last Updated**: September 24, 2026  

---

## 1. Architecture Overview

PrepMatrix is engineered as a modern, decoupled **Single Page Application (SPA)** with serverless proxy capabilities and a managed **Backend-as-a-Service (BaaS)** persistence layer.

The architectural pattern centers on client-side state orchestration:
- The user interface is built on **React 18** and **TypeScript**, bundled via **Vite 6** using modern ES modules.
- Client-side routing is handled declaratively by **React Router v7** with lazy-loaded route boundaries.
- Authentication, relational PostgreSQL data, and binary object storage are provided by **Supabase**.
- Generative AI capabilities are decoupled from the browser via an intermediary **Vercel Serverless Function** proxy (`/api/gemini`), shielding upstream Google Gemini API keys while providing timeout guarding and automated exponential backoff retries.
- Client-side heuristic fallbacks ensure zero-downtime offline practice even when upstream AI services or custom database functions are unavailable.

---

## 2. High-Level Architecture Diagrams

### 2.1 System Context Diagram (C4 Level 1)

```mermaid
flowchart TD
    User["Candidate / Administrator"]
    
    subgraph ClientLayer ["Client Browser Environment"]
        SPA["PrepMatrix Web Application<br/>(React 18 + Vite 6 + Tailwind CSS)"]
        WebSpeech["Web Speech API<br/>(TTS SpeechSynthesis & STT SpeechRecognition)"]
        MediaDevices["WebRTC MediaStream API<br/>(Live Camera Mirror)"]
        LocalStore["Browser Storage<br/>(localStorage / sessionStorage)"]
        PDFJS["pdfjs-dist & jsPDF<br/>(Client-Side PDF Engine)"]
    end

    subgraph EdgeLayer ["Edge Infrastructure (Vercel)"]
        EdgeRouter["Vercel Edge Router<br/>(Static Assets & SPA Fallback)"]
        GeminiProxy["Serverless Gemini Proxy<br/>(/api/gemini)"]
    end

    subgraph BackendLayer ["Backend-as-a-Service (Supabase)"]
        SupaAuth["Supabase GoTrue Auth"]
        Postgres["PostgreSQL 15 Database<br/>(RLS & Automated Triggers)"]
        SupaStorage["Supabase Storage<br/>(Buckets: avatars, resumes)"]
    end

    subgraph ExternalServices ["External Third-Party APIs"]
        GoogleOAuth["Google OAuth 2.0 Identity"]
        GeminiAPI["Google Gemini 2.5 Flash API"]
        EmailJSAPI["EmailJS REST API"]
    end

    User -->|Interacts via Browser| SPA
    SPA --> WebSpeech
    SPA --> MediaDevices
    SPA --> LocalStore
    SPA --> PDFJS

    SPA -->|Fetches Static Assets & Routes| EdgeRouter
    SPA -->|POST /api/gemini| GeminiProxy
    GeminiProxy -->|Authenticated HTTPS| GeminiAPI

    SPA -->|Auth Sessions & PKCE| SupaAuth
    SupaAuth -->|OAuth Verification| GoogleOAuth
    SPA -->|PostgREST REST & RPCs| Postgres
    SPA -->|Direct S3-Compatible Upload| SupaStorage
    SPA -->|Feedback Messages| EmailJSAPI
```

### 2.2 Component Architecture (C4 Level 2)

```mermaid
flowchart LR
    subgraph UIComponents ["Presentation Layer (React)"]
        Routes["React Router v7 (/routes.tsx)"]
        Pages["15 Page Components<br/>(Dashboard, ManualMode, AIInterview, etc.)"]
        RadixUI["Radix Primitives & Tailwind UI"]
        Navigation["Navbar, Footer, Mobile Drawer"]
    end

    subgraph StateContexts ["Application State & Providers"]
        AuthContext["AuthContext<br/>(Session Lifecycle & User Role)"]
        SettingsContext["SettingsContext<br/>(Theme, Sound, Voice)"]
    end

    subgraph ClientDomainLogic ["Domain Logic & Engines"]
        ManualEngine["Manual Question Engine<br/>(questions.ts, questionBank.ts)"]
        HeuristicScorer["Heuristic Scoring Engine<br/>(evaluation.ts)"]
        AIEngine["AI Resume Interview Engine<br/>(AIInterviewPage, geminiClient)"]
        ATSAnalyzer["Resume ATS Analyzer<br/>(resumeAnalyzer.ts)"]
        GesturePhysics["Drawer Spring Physics<br/>(drawerGesturePhysics.ts)"]
    end

    subgraph ServiceLayer ["API & Service Abstraction Layer"]
        APIClient["APIClient Facade (api.ts)"]
        AuthService["authService.ts"]
        InterviewService["interviewService.ts"]
        AIInterviewService["aiInterviewService.ts"]
        ProfileService["profileService.ts"]
        ResumeService["resumeService.ts"]
        LeaderboardService["leaderboardService.ts"]
    end

    Routes --> Pages
    Pages --> UIComponents
    Pages --> StateContexts
    Pages --> ClientDomainLogic
    Pages --> ServiceLayer
    ServiceLayer --> APIClient
```

---

## 3. Frontend Architecture

### 3.1 Directory Organization
```
Frontend/PrepMatrix/src/
├── app/
│   ├── components/         # Reusable presentation components
│   │   ├── ui/             # Radix UI and Tailwind design primitives
│   │   ├── Navbar.tsx      # Main desktop/tablet navigation header
│   │   ├── Footer.tsx      # Application footer with EmailJS contact form
│   │   ├── ProtectedRoute.tsx # Route guards (ProtectedRoute & AdminRoute)
│   │   ├── useMobileSwipeDrawer.ts # High-performance gesture hook
│   │   └── drawerGesturePhysics.ts # Spring physics and vector algorithms
│   ├── constants/          # Static branding and design tokens
│   ├── contexts/           # React Context providers (AuthContext, SettingsContext)
│   ├── data/               # Static question banks and domain configurations
│   ├── modules/            # Isolated domain modules (aiMode)
│   ├── pages/              # 15 Route page components
│   ├── routes.tsx          # React Router v7 browser router configuration
│   ├── types/              # TypeScript interface definitions
│   └── utils/              # Client-side domain utilities (evaluation, speech, api)
├── lib/
│   ├── browserStorage.ts   # Safe localStorage/sessionStorage wrapper
│   └── supabaseClient.ts   # Configured Supabase JavaScript SDK client
└── services/               # Data access and business service classes
```

### 3.2 State Management Paradigm
PrepMatrix avoids heavy third-party global state managers (like Redux or Zustand) in favor of targeted, highly cohesive **React Contexts** combined with component-level state and browser storage synchronization:
1. **`AuthContext`**: Manages global session state (`user`, `authStatus`, `isAuthenticated`, `isLoading`). Subscribes to Supabase `onAuthStateChange` events and enforces automatic recovery when sessions become invalid.
2. **`SettingsContext`**: Manages user visual and auditory preferences (`darkMode`, `soundEnabled`, `voiceEnabled`). Syncs directly with `localStorage` and toggles the `dark` class on the HTML root element without hydration flicker.
3. **Module-Level State**: Active interview session state (current question, elapsed timers, interim transcripts, answer history) is maintained in parent page controllers (`Interview.tsx` and `AIInterviewPage.tsx`) and backed by Supabase or `aiInterviewLocalStore`.

### 3.3 Mobile Gesture Architecture (Spring Physics)
The mobile navigation drawer implements a native-feeling gesture system based on damped harmonic oscillation:
- **State Machine**: Transitions from `idle` -> `tracking` -> `settling` -> `open/closed`.
- **Directional Locking**: Vector angle analysis prevents horizontal gestures from firing when the user scrolls vertically through navigation links.
- **Physical Constants**:
  - Spring Stiffness ($k$): `380`
  - Spring Damping ($c$): `34`
  - Spring Mass ($m$): `1`
  - Boundary Resistance Factor: `0.18` (rubber-banding overshoot past 0px or -340px)
- **Settling Convergence**: Guarantees sub-350ms settling with zero oscillation, verified by automated unit tests (`scripts/testMobileDrawerGesture.mjs`).

---

## 4. Backend & Serverless Architecture

### 4.1 Serverless AI Proxy (`/api/gemini`)
To prevent client-side exposure of Google Gemini API keys and provide resilient upstream handling, all LLM communication routes through a serverless function:

```mermaid
sequenceDiagram
    autonumber
    actor Browser as Candidate Client (React)
    participant LocalProxy as Vite Middleware (Dev) / Vercel Edge (Prod)
    participant ServerProxy as geminiProxy.js
    participant Upstream as Google Gemini 2.5 Flash API

    Browser->>LocalProxy: POST /api/gemini (JSON payload)
    LocalProxy->>ServerProxy: handleGeminiProxyRequest(req)
    Note over ServerProxy: Validate JSON, resolve model, normalize contents
    ServerProxy->>Upstream: POST https://generativelanguage.googleapis.com/...
    
    alt Upstream Responds 200 OK
        Upstream-->>ServerProxy: JSON response payload
        ServerProxy-->>Browser: HTTP 200 { candidates: [...] }
    else Upstream Fails with 429, 500, or 503
        Upstream-->>ServerProxy: HTTP 429 / 500 / 503
        Note over ServerProxy: Retry 1: Wait 1000ms
        ServerProxy->>Upstream: Retry Request 1
        Note over ServerProxy: Retry 2: Wait 2000ms
        ServerProxy->>Upstream: Retry Request 2
        ServerProxy-->>Browser: HTTP 200 or Structured Error Payload
    else Network Timeout (>12s or >30s total)
        Note over ServerProxy: AbortController aborts upstream
        ServerProxy-->>Browser: HTTP 504 Gateway Timeout
    end
```

### 4.2 Supabase BaaS Integration Layer
- **PostgREST Client**: Standard CRUD operations on `profiles`, `interview_sessions`, `interviews`, `history`, `resumes`, and `resume_analysis`.
- **Database Functions & RPC**: Remote procedure calls (`ensure_user_profile`, `get_public_candidates`, `admin_list_users`, `admin_update_user_role`, `admin_delete_user`, `admin_platform_stats`, `get_leaderboard`).
- **Binary Asset Storage**: S3-compatible endpoints for user avatar images and uploaded PDF resumes.

---

## 5. Data Architecture

### 5.1 Database Entity Relationship (ER) Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1 (id = auth.users.id)"
    PROFILES ||--o{ INTERVIEW_SESSIONS : "user_id"
    PROFILES ||--o{ INTERVIEWS : "user_id"
    PROFILES ||--o{ HISTORY : "user_id"
    PROFILES ||--o{ RESUMES : "user_id"
    PROFILES ||--o{ RESUME_ANALYSIS : "user_id"
    INTERVIEW_SESSIONS ||--o| INTERVIEWS : "session_id"
    RESUMES ||--o{ RESUME_ANALYSIS : "resume_id"

    PROFILES {
        uuid id PK
        text email
        text full_name
        text avatar_url
        text role
        text target_role
        numeric experience_years
        jsonb skills
        jsonb social_links
        text preferred_theme
        timestamptz created_at
        timestamptz updated_at
    }

    INTERVIEW_SESSIONS {
        uuid id PK
        uuid user_id FK
        text domain
        text difficulty
        text mode
        text title
        text status
        numeric score
        jsonb questions
        jsonb transcripts
        jsonb metrics
        jsonb feedback
        integer duration_seconds
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
    }

    INTERVIEWS {
        uuid id PK
        uuid user_id FK
        uuid session_id FK
        text domain
        text mode
        numeric score
        integer questions_count
        integer duration_seconds
        timestamptz completed_at
        timestamptz created_at
    }

    RESUMES {
        uuid id PK
        uuid user_id FK
        text file_name
        text file_url
        integer file_size
        text parsed_text
        jsonb extracted_skills
        text experience_summary
        timestamptz created_at
        timestamptz updated_at
    }

    RESUME_ANALYSIS {
        uuid id PK
        uuid resume_id FK
        uuid user_id FK
        numeric overall_score
        numeric ats_score
        jsonb strengths
        jsonb improvements
        jsonb recommended_roles
        jsonb full_analysis
        timestamptz created_at
    }

    HISTORY {
        uuid id PK
        uuid user_id FK
        text action
        jsonb details
        timestamptz created_at
    }
```

---

## 6. Authentication & Session Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant Browser as Browser Client
    participant AuthContext as AuthContext.tsx
    participant SupaAuth as Supabase GoTrue Auth
    participant DB as PostgreSQL public.profiles

    User->>Browser: Enters Email & Password
    Browser->>SupaAuth: signInWithPassword({ email, password })
    SupaAuth-->>Browser: Session Token { access_token, refresh_token, user }
    Browser->>AuthContext: onAuthStateChange('SIGNED_IN')
    AuthContext->>DB: ensureProfile(user)
    alt Profile Exists
        DB-->>AuthContext: Returns profile row
    else Profile Missing
        DB-->>AuthContext: Trigger handle_new_user() created profile
    end
    AuthContext->>Browser: setAuthStatus('authenticated')
    Browser->>User: Renders Dashboard (/dashboard)
```

---

## 7. AI System Architecture

### 7.1 Multi-Layer AI Resilience Flow

```mermaid
flowchart TD
    Start([Candidate Uploads Resume]) --> ParsePDF[Client-side PDF Extraction via pdfjs-dist]
    ParsePDF --> Truncate[Normalize & Truncate Text to 7,000 Chars]
    Truncate --> SendProxy[Dispatch POST /api/gemini via Proxy]
    
    SendProxy --> CheckProxy{Proxy Online & Key Valid?}
    CheckProxy -->|Yes| GeminiAPI[Google Gemini 2.5 Flash]
    
    GeminiAPI --> CheckGemini{Upstream Response OK?}
    CheckGemini -->|Yes| ParseJSON[Parse Strict JSON Schema]
    CheckGemini -->|429/500/503| ProxyRetry[Proxy Exponential Backoff: 1s, 2s, 4s]
    ProxyRetry --> GeminiAPI
    
    CheckProxy -->|No / Timeout / 504| FallbackEngine[Client Fallback Question Generator]
    CheckGemini -->|Exhausted Retries| FallbackEngine
    
    FallbackEngine --> RegexDetect[Infer Domain & Skills via Regex Matchers]
    RegexDetect --> GenFallback[Generate Resume-Aware Fallback Questions]
    
    ParseJSON --> RenderInterview[Render Immersive Interview Shell]
    GenFallback --> RenderInterview
```

---

## 8. Deployment Architecture

```mermaid
flowchart TD
    subgraph GitHubRepo ["GitHub Repository (main branch)"]
        GitCommit[Git Push / Commit]
        GHActions[GitHub Actions CI Pipeline]
    end

    subgraph CIEnvironment ["CI Runner (Ubuntu Latest)"]
        NodeSetup[Node.js 20 Setup]
        ValidateQuestions[npm run validate:manual-questions<br/>(97 domains / 5,820 Qs)]
        TestGestures[npm run test:gestures<br/>(9 Spring Physics Suites)]
        BuildCheck[npm run build<br/>(Vite Rollup Compilation)]
    end

    subgraph VercelEdge ["Vercel Production Edge Deployment"]
        EdgeCDN[Vercel Global Edge Network]
        ServerlessFn[Vercel Serverless Function: /api/gemini]
        SPAFallback[Rewrite /.* -> /index.html]
        AssetCache[Immutable Asset Caching: /assets/*]
    end

    GitCommit --> GHActions
    GHActions --> NodeSetup
    NodeSetup --> ValidateQuestions
    ValidateQuestions --> TestGestures
    TestGestures --> BuildCheck
    
    BuildCheck -->|Successful Push to Main| VercelEdge
    VercelEdge --> EdgeCDN
    VercelEdge --> ServerlessFn
    VercelEdge --> SPAFallback
    VercelEdge --> AssetCache
```

---

## 9. Architectural Risks & Technical Debt

1. **Monolithic Bundle Warning**: Vite compilation produces a single `index-*.js` chunk of **1.56 MB** (> 500 kB recommended threshold). Rollup `manualChunks` splitting is required for Recharts, PDF.js, and Lucide.
2. **Missing Remote Migrations**: Custom PostgreSQL RPCs called by client services (`admin_list_users`, `admin_update_user_role`, `admin_delete_user`, `admin_platform_stats`, `get_public_candidates`, `get_leaderboard`) are missing from source control.
3. **Database Schema Divergence**: `interview_sessions` column names in `schema.sql` differ from the write payload generated by `interviewService.ts` and `aiInterviewService.ts`.
4. **Client-Side Authorization Vulnerability**: Route gating for `/admin` depends solely on React Router client evaluation (`AdminRoute`), which could be bypassed in devtools if Supabase RPCs do not strictly enforce database-level caller roles.
5. **Hardcoded Third-Party Credentials**: `Footer.tsx` embeds EmailJS keys directly in the component rather than sourcing them from environment variables.
6. **Live Deployment Desynchronization**: The deployed website at `https://prep-matrix.vercel.app` runs an older Next.js quiz platform rather than the current Vite SPA codebase.
