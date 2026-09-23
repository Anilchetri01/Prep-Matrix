# Document 19 — System Discovery Report & Baseline

**Project**: PrepMatrix  
**Document Version**: 1.0.0  
**Inspection Date**: September 24, 2026  
**Auditor**: Senior Software Architect / Forensic Code Reviewer  
**Classification**: System State Baseline & Repository Audit  

---

## 1. Executive Summary

PrepMatrix is an interactive, multi-domain interview preparation SaaS web platform. This document establishes the empirical baseline of the application as reverse-engineered directly from source code, configuration files, automated test suites, database definitions, and deployed web assets as of September 2026.

The application provides two complementary practice workflows:
1. **Manual Interview Mode**: A deterministic, offline-capable interview runner offering exactly **97 career domains** across 15 categories, 3 difficulty tiers (Beginner, Intermediate, Advanced), selectable question counts (5, 10, 15, 20), automated scoring heuristics (keyword matching with synonyms, relevance cosine similarity, structure analysis), and Web Speech API integration.
2. **AI Interview Mode**: An adaptive, resume-driven multimodal interview simulator powered by **Google Gemini 2.5 Flash** via a serverless proxy architecture. It features client-side PDF resume parsing via `pdfjs-dist`, dynamic question generation based on parsed resume text, live camera preview, real-time speech-to-text response capture, structured JSON answer evaluation, and downloadable PDF report generation via `jspdf`.

---

## 2. Repository Overview & Topology

```
c:\Users\anilc\Documents\Prep-Matrix\
├── .git/                               # Git version control metadata
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions CI workflow (validate, test, build)
├── .vercel/
│   ├── project.json                    # Linked Vercel project configuration
│   └── README.txt                      # Vercel project notes
├── Backend/
│   └── supabase/
│       ├── migrations/
│       │   └── 20260701000000_initial_schema.sql # Initial PostgreSQL schema migration
│       ├── schema.sql                  # Consolidated PostgreSQL schema & triggers
│       └── README.md                   # Supabase database deployment guide
├── Documentation/
│   ├── PRD/
│   │   └── PRD.md                      # Legacy PRD draft
│   ├── SRS/
│   │   └── SRS.md                      # Legacy SRS draft
│   ├── PrepMatrix_Complete_Documentation_Master_Prompt.md # Master engineering prompt
│   └── README.md                       # Documentation folder index
├── Frontend/
│   └── PrepMatrix/                     # React 18 + Vite 6 Single Page Application
│       ├── api/
│       │   └── gemini.js               # Vercel serverless function entrypoint for Gemini API
│       ├── public/                     # Static web assets, branding SVGs, favicons
│       ├── scripts/
│       │   ├── testMobileDrawerGesture.mjs # 9 automated gesture physics test suites
│       │   └── validateManualQuestionBank.mjs # Question bank integrity validator
│       ├── server/
│       │   └── geminiProxy.js          # Core resilient Gemini API proxy logic (retries, timeouts)
│       ├── src/                        # Core React source tree (app, lib, services, styles)
│       ├── index.html                  # HTML5 application shell
│       ├── package.json                # Frontend package dependencies and build scripts
│       ├── package-lock.json           # Deterministic npm dependency lockfile
│       ├── postcss.config.mjs          # PostCSS processor configuration
│       ├── vercel.json                 # Vercel deployment routing, immutable asset headers & SPA fallback
│       └── vite.config.ts              # Vite 6 compiler config with local Gemini proxy middleware
├── .gitignore                          # Git file exclusion rules
├── README.md                           # Root project documentation
└── desktop.ini                         # Windows directory configuration
```

---

## 3. Technology Inventory

| Category | Technology | Version | Purpose in PrepMatrix | Verification Source |
|---|---|---|---|---|
| **Runtime / Language** | TypeScript | `~5.x` | Static typing across frontend modules and types | `Frontend/PrepMatrix/package.json` |
| **Language** | JavaScript (ESM) | ES2022+ | Scripts and serverless proxy modules | `Frontend/PrepMatrix/server/geminiProxy.js` |
| **Frontend Framework** | React | `18.3.1` | Component UI hierarchy and lifecycle management | `Frontend/PrepMatrix/package.json` |
| **Frontend DOM** | React DOM | `18.3.1` | Browser DOM rendering and portal mounting | `Frontend/PrepMatrix/package.json` |
| **Client Routing** | React Router | `7.13.0` | Browser URL routing, lazy-loaded routes, navigation guards | `src/app/routes.tsx` |
| **Build Tooling** | Vite | `6.4.2` | Fast HMR dev server and Rollup production compilation | `Frontend/PrepMatrix/vite.config.ts` |
| **Styling Framework** | Tailwind CSS | `4.1.12` | Modern utility CSS system with Vite plugin integration | `Frontend/PrepMatrix/package.json` |
| **UI Primitives** | Radix UI | Various | Accessible dialogs, tooltips, tabs, dropdowns, avatars | `src/app/components/ui/*` |
| **Motion & Animation** | Motion (Framer) | `12.23.24` | Animation orchestration and gesture transitions | `Frontend/PrepMatrix/package.json` |
| **Icons** | Lucide React | `0.487.0` | SVG icons across dashboard, navigation, and badges | `Frontend/PrepMatrix/package.json` |
| **Database / BaaS** | Supabase PostgreSQL | `15+` | Relational storage for profiles, sessions, resumes, history | `Backend/supabase/schema.sql` |
| **Authentication** | Supabase Auth | `@supabase/supabase-js 2.101.1` | Email/password auth, Google OAuth, session token lifecycle | `src/services/authService.ts` |
| **Cloud Storage** | Supabase Storage | `@supabase/supabase-js 2.101.1` | Storage buckets for `avatars` and `resumes` | `src/lib/supabaseClient.ts` |
| **AI / LLM Upstream** | Google Gemini API | `v1beta` | Generative question synthesis and response evaluation | `Frontend/PrepMatrix/server/geminiProxy.js` |
| **Default AI Model** | Gemini 2.5 Flash | `gemini-2.5-flash` | Low-latency structured JSON evaluation and question generation | `Frontend/PrepMatrix/server/geminiProxy.js` |
| **PDF Processing** | pdfjs-dist | `5.6.205` | Client-side resume PDF text and layout extraction | `src/app/modules/aiMode/utils/resumeTextExtractor.ts` |
| **PDF Generation** | jsPDF | `4.2.1` | Client-side generation of interview result summary PDFs | `src/app/modules/aiMode/utils/generateInterviewReportPdf.ts` |
| **Data Visualization**| Recharts | `2.15.2` | Performance trend charts, score distributions, radar charts | `src/app/pages/Dashboard.tsx`, `Results.tsx` |
| **Toast Notifications**| Sonner | `2.0.3` | Non-blocking user feedback toasts | `src/app/contexts/AuthContext.tsx` |
| **Email Service** | EmailJS | `4.4.1` | Contact and feedback message forwarding via browser | `src/app/components/Footer.tsx` |
| **Hosting Platform** | Vercel | N/A | Production edge hosting, serverless functions, SPA fallback | `Frontend/PrepMatrix/vercel.json` |
| **Continuous Integration** | GitHub Actions | `v4` | Automated linting, question validation, gesture test, build | `.github/workflows/ci.yml` |

---

## 4. Feature Inventory Matrix

| Feature ID | Feature Name | Target User | Implementation Status | Code Location | Database Entity | Verification Status |
|---|---|---|---|---|---|---|
| **FEAT-001** | Email / Password Authentication | All Candidates | Implemented | `src/app/pages/Login.tsx`, `Signup.tsx`, `authService.ts` | `auth.users`, `public.profiles` | Verified from code |
| **FEAT-002** | Google OAuth Authentication | All Candidates | Implemented | `src/app/components/GoogleAuthButton.tsx`, `authService.ts` | `auth.users`, `public.profiles` | Verified from code |
| **FEAT-003** | Auto Profile Provisioning Trigger | All Candidates | Implemented | `Backend/supabase/schema.sql` (`handle_new_user`) | `public.profiles` | Verified from code |
| **FEAT-004** | User Profile Management | Candidate | Implemented | `src/app/pages/Profile.tsx`, `profileService.ts` | `public.profiles` | Verified from code |
| **FEAT-005** | Avatar Image Upload | Candidate | Implemented | `src/app/pages/Profile.tsx`, `profileService.ts` | Supabase Storage (`avatars`) | Verified from code |
| **FEAT-006** | Manual Practice Domain Catalog | Candidate | Implemented | `src/app/pages/ManualMode.tsx`, `domains.config.ts` | Static Config (97 domains) | Verified from code & script |
| **FEAT-007** | Manual Question Bank Execution | Candidate | Implemented | `src/app/pages/Interview.tsx`, `questions.ts` | `public.interview_sessions` | Verified from code & script |
| **FEAT-008** | Manual Heuristic Evaluation | Candidate | Implemented | `src/app/utils/evaluation.ts` | In-memory / session payload | Verified from code |
| **FEAT-009** | Text-to-Speech Question Readout | Candidate | Implemented | `src/app/utils/speech.ts` (`TextToSpeech`) | Web Speech API | Verified from code |
| **FEAT-010** | Speech-to-Text Voice Answering | Candidate | Implemented | `src/app/utils/speech.ts` (`SpeechToText`) | Web Speech Recognition API | Verified from code |
| **FEAT-011** | Manual Interview Results & Radar | Candidate | Implemented | `src/app/pages/Results.tsx` | `public.interview_sessions` | Verified from code |
| **FEAT-012** | AI Resume Interview Generator | Candidate | Implemented | `src/app/modules/aiMode/AIInterviewPage.tsx`, `geminiClient.ts` | LocalStore / `public.interviews` | Verified from code |
| **FEAT-013** | Client-Side PDF Resume Parsing | Candidate | Implemented | `src/app/modules/aiMode/utils/resumeTextExtractor.ts` | `pdfjs-dist` | Verified from code |
| **FEAT-014** | Live Camera Preview | Candidate | Implemented | `src/app/modules/aiMode/components/CameraPreview.tsx` | WebRTC MediaStream API | Verified from code |
| **FEAT-015** | Immersive AI Interview Shell | Candidate | Implemented | `src/app/modules/aiMode/components/ImmersiveInterviewShell.tsx`| Client State | Verified from code |
| **FEAT-016** | Gemini Structured Answer Evaluation | Candidate | Implemented | `src/app/modules/aiMode/services/geminiClient.ts` | Gemini 2.5 Flash / Proxy | Verified from code |
| **FEAT-017** | AI Interview PDF Report Export | Candidate | Implemented | `src/app/modules/aiMode/utils/generateInterviewReportPdf.ts` | `jspdf` | Verified from code |
| **FEAT-018** | Resume ATS & Keyword Analyzer | Candidate | Implemented | `src/app/pages/ResumeAnalysis.tsx`, `resumeAnalyzer.ts` | `public.resumes`, `resume_analysis` | Verified from code |
| **FEAT-019** | Resume Storage in Cloud Bucket | Candidate | Implemented | `src/services/resumeService.ts` | Supabase Storage (`resumes`) | Verified from code |
| **FEAT-020** | Unified Performance Analytics | Candidate | Implemented | `src/app/pages/Dashboard.tsx` | `interview_sessions` + localStore | Verified from code |
| **FEAT-021** | Interview Session History Archive | Candidate | Implemented | `src/app/pages/InterviewHistory.tsx` | `interview_sessions` + localStore | Verified from code |
| **FEAT-022** | Global Practice Leaderboard | Candidate / Public | Implemented | `src/app/pages/Leaderboard.tsx`, `leaderboardService.ts`| `public.interviews` (RLS public) | Verified from code |
| **FEAT-023** | Candidate Discovery Directory | Candidate / Public | Implemented | `src/app/pages/Candidates.tsx`, `profileService.ts` | `public.profiles` via RPC | Verified from code |
| **FEAT-024** | Dark / Light Theme Switching | All Users | Implemented | `src/app/contexts/SettingsContext.tsx` | `localStorage` / HTML class | Verified from code |
| **FEAT-025** | Sound & Voice Preferences | All Users | Implemented | `src/app/pages/Settings.tsx`, `SettingsContext.tsx` | `localStorage` | Verified from code |
| **FEAT-026** | Mobile Swipe Navigation Drawer | Mobile Users | Implemented | `src/app/components/useMobileSwipeDrawer.ts` | Touch events & spring physics | Verified from code & tests |
| **FEAT-027** | Administrator Overview & Metrics | Administrator | Partially Implemented | `src/app/pages/AdminPanel.tsx`, `api.ts` | Remote RPC `admin_platform_stats` | Missing SQL migrations |
| **FEAT-028** | Admin User Management & Deletion | Administrator | Partially Implemented | `src/app/pages/AdminPanel.tsx`, `profileService.ts` | Remote RPC `admin_list_users` | Missing SQL migrations |
| **FEAT-029** | Admin Role Promotion / Demotion | Administrator | Partially Implemented | `src/app/pages/AdminPanel.tsx`, `profileService.ts` | Remote RPC `admin_update_user_role` | Missing SQL migrations |
| **FEAT-030** | Contact & Feedback Form via EmailJS | All Users | Implemented | `src/app/components/Footer.tsx` | EmailJS REST API | Verified from code |

---

## 5. Live Website vs. Source-Code Baseline Discrepancy

A forensic HTTP inspection of the publicly accessible deployment URL `https://prep-matrix.vercel.app` reveals a notable state discrepancy:

```
[Repository Source Code (Vite + React 18 + Supabase)]
    ├── SPA Architecture with React Router v7
    ├── Dual Interview Engine (Manual 97 Domains + AI Gemini Multimodal)
    ├── Supabase PostgreSQL Database with RLS
    └── Modern SaaS Dashboard, Leaderboard, Resume ATS Scanner

[Live Deployed URL: https://prep-matrix.vercel.app (Next.js Legacy)]
    ├── Next.js App Router Bundle (webpack-7b7d8bc08f537075.js)
    ├── Quiz Platform: "PrepMatrix - Quiz Practice Platform"
    └── Legacy static routes: /auth/signin/, /auth/signup/, DBMS/ML/C++ quizzes
```

**Audit Assessment**: The live production domain has not been updated with the current Vite/React repository build (`caac507`). As a consequence, features documented throughout this suite represent the repository source code of PrepMatrix, with the live site noted as reflecting a preceding major version.

---

## 6. Baseline Verification Sign-off

- **Source Code Verification**: High (All frontend, serverless proxy, and database files audited).
- **Test Automation Verification**: High (`npm run validate:manual-questions` and `npm run test:gestures` executed and passing).
- **Build Verification**: High (`npm run build` completes cleanly producing production assets in `Frontend/PrepMatrix/dist/`).
