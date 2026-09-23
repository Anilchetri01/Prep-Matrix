# Document 20 — Forensic Evidence Index

**Project**: PrepMatrix  
**Version**: 1.0.0  
**Inspection Date**: September 24, 2026  
**Auditor**: Senior Software Architect / Forensic Code Reviewer  

---

## 1. Overview

This index provides a forensic cross-reference linking every major architectural, functional, data, security, and integration claim in the PrepMatrix documentation suite directly to its verifiable implementation evidence in the repository.

---

## 2. Forensic Claims & Evidence Mapping

| Claim ID | Functional / Technical Claim | Evidence Type | File Path / Location | Verifiable Details | Confidence |
|---|---|---|---|---|---|
| **EVD-001** | Frontend is built on React 18, Vite 6, and Tailwind CSS v4 | Configuration | `Frontend/PrepMatrix/package.json#L59-L81` | `react: "18.3.1"`, `vite: "6.4.2"`, `tailwindcss: "4.1.12"`, `@tailwindcss/vite: "4.1.12"` | High |
| **EVD-002** | Single-page client routing is managed by React Router v7 | Code | `Frontend/PrepMatrix/src/app/routes.tsx#L22-L155` | `createBrowserRouter` defining 17 routes including `/dashboard`, `/manual-mode`, `/ai-mode`, `/admin` | High |
| **EVD-003** | Google OAuth is supported via Supabase Auth client | Code | `Frontend/PrepMatrix/src/services/authService.ts#L44-L63` | `supabase.auth.signInWithOAuth({ provider: 'google', ... })` | High |
| **EVD-004** | Email/Password auth handles session tokens and profile sync | Code | `Frontend/PrepMatrix/src/app/contexts/AuthContext.tsx#L235-L307` | `supabase.auth.getSession()`, `onAuthStateChange`, token expiry validation | High |
| **EVD-005** | New user signup triggers automatic database profile creation | Database | `Backend/supabase/schema.sql#L203-L230` | Trigger function `public.handle_new_user()` on `auth.users` insert | High |
| **EVD-006** | Manual question bank contains exactly 97 domains and 5,820 questions | Code / Test | `Frontend/PrepMatrix/src/app/data/domains.config.ts#L50-L175`, `scripts/validateManualQuestionBank.mjs` | 97 domains * 60 questions (20 beginner + 20 intermediate + 20 advanced) | High |
| **EVD-007** | Manual question selection supports 5, 10, 15, or 20 questions | Code | `Frontend/PrepMatrix/src/app/data/manualInterview.config.ts#L1` | `ALLOWED_QUESTION_COUNTS = [5, 10, 15, 20]` | High |
| **EVD-008** | Client-side answer scoring calculates keyword matching, cosine similarity, and structure | Code | `Frontend/PrepMatrix/src/app/utils/evaluation.ts#L185-L403` | `getWeightedKeywordScore()`, `cosineSimilarity()`, `evaluateStructureScore()`, `evaluateRelevanceScore()` | High |
| **EVD-009** | Text-to-speech uses browser native SpeechSynthesis API | Code | `Frontend/PrepMatrix/src/app/utils/speech.ts#L1-L55` | `window.speechSynthesis` with `SpeechSynthesisUtterance` rate 0.9 | High |
| **EVD-010** | Speech-to-text uses Web Speech Recognition API with debounce | Code | `Frontend/PrepMatrix/src/app/utils/speech.ts#L58-L100` | `window.SpeechRecognition || window.webkitSpeechRecognition` | High |
| **EVD-011** | Gemini API is accessed via serverless proxy architecture | Code | `Frontend/PrepMatrix/api/gemini.js#L1-L15`, `server/geminiProxy.js#L203-L370` | Vercel serverless function invoking `handleGeminiProxyRequest` | High |
| **EVD-012** | Gemini API proxy implements retries with exponential backoff | Code | `Frontend/PrepMatrix/server/geminiProxy.js#L4-L8`, `#L248-L356` | Max 3 retries, delays [1000ms, 2000ms, 4000ms], status 429/500/503 | High |
| **EVD-013** | Default Gemini model is `gemini-2.5-flash` with structured JSON schema | Code | `Frontend/PrepMatrix/server/geminiProxy.js#L1`, `src/app/modules/aiMode/services/geminiClient.ts#L20-L94` | `STABLE_MODEL = 'gemini-2.5-flash'`, `responseMimeType: 'application/json'` | High |
| **EVD-014** | Client-side PDF resume parsing is powered by `pdfjs-dist` | Code | `Frontend/PrepMatrix/src/app/modules/aiMode/utils/resumeTextExtractor.ts#L1-L58` | `pdfjs-dist` parsing page text content up to 7,000 characters | High |
| **EVD-015** | Live camera preview uses WebRTC `navigator.mediaDevices.getUserMedia` | Code | `Frontend/PrepMatrix/src/app/modules/aiMode/components/CameraPreview.tsx#L55-L95` | `navigator.mediaDevices.getUserMedia({ video: true, audio: false })` | High |
| **EVD-016** | AI interview reports are compiled client-side to PDF using `jspdf` | Code | `Frontend/PrepMatrix/src/app/modules/aiMode/utils/generateInterviewReportPdf.ts#L1-L180` | `import { jsPDF } from 'jspdf'` rendering scores, breakdown, metrics | High |
| **EVD-017** | Fallback heuristics generate questions and scores when Gemini fails | Code | `Frontend/PrepMatrix/src/app/modules/aiMode/services/geminiClient.ts#L573-L645` | `buildFallbackQuestions()` using regex domain/skill hints | High |
| **EVD-018** | AI interview sessions fall back to localStorage if database tables missing | Code | `Frontend/PrepMatrix/src/app/modules/aiMode/services/aiInterviewService.ts#L139-L150`, `#L380-L393` | `isMissingInterviewHistoryTableError` catches PGRST205 and routes to `aiInterviewLocalStore` | High |
| **EVD-019** | Resume ATS analysis identifies missing skills and action verbs | Code | `Frontend/PrepMatrix/src/app/utils/resumeAnalyzer.ts#L47-L133` | `analyzeResume()` checking `DOMAIN_SKILLS`, `SOFT_SKILLS`, `ACTION_VERBS` | High |
| **EVD-020** | Resumes are uploaded to Supabase Storage bucket `resumes` | Code | `Frontend/PrepMatrix/src/services/resumeService.ts#L85-L94` | `supabase.storage.from(STORAGE_BUCKETS.resumes).upload(storagePath, file)` | High |
| **EVD-021** | User avatars are uploaded to Supabase Storage bucket `avatars` | Code | `Frontend/PrepMatrix/src/services/profileService.ts#L368-L415` | `supabase.storage.from(STORAGE_BUCKETS.avatars).upload(storagePath, file)` | High |
| **EVD-022** | All database tables enforce Row Level Security | Database | `Backend/supabase/schema.sql#L30, #L71, #L109, #L136, #L145, #L167` | `alter table public.<name> enable row level security` on all 6 tables | High |
| **EVD-023** | `interviews` table allows public read for global leaderboard | Database | `Backend/supabase/schema.sql#L111-L113` | `create policy "Public or authenticated users can view interviews for leaderboard" on public.interviews for select using (true)` | High |
| **EVD-024** | Admin authorization is guarded client-side in React Router | Code | `Frontend/PrepMatrix/src/app/components/ProtectedRoute.tsx#L15-L22` | `if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;` | High |
| **EVD-025** | Admin user management invokes RPC `admin_list_users` and `admin_update_user_role` | Code | `Frontend/PrepMatrix/src/services/profileService.ts#L501, #L530, #L555` | `supabase.rpc('admin_list_users')`, `supabase.rpc('admin_update_user_role')` | High |
| **EVD-026** | Admin RPC procedures are missing from repository SQL schema | Code / Database | `Backend/supabase/schema.sql`, `migrations/20260701000000_initial_schema.sql` | Neither schema.sql nor migration define `admin_list_users` or `admin_update_user_role` | High |
| **EVD-027** | EmailJS credentials are hardcoded in Footer component | Code | `Frontend/PrepMatrix/src/app/components/Footer.tsx#L71-L73` | Hardcoded `serviceId = 'service_ity2tkc'`, `templateId = 'template_o917511'`, `publicKey = 'IelSj4qTjRselKe8k'` | High |
| **EVD-028** | Mobile swipe drawer uses spring physics (stiffness 380, damping 34, mass 1) | Code / Test | `Frontend/PrepMatrix/src/app/components/drawerGesturePhysics.ts#L10-L12`, `scripts/testMobileDrawerGesture.mjs` | Physics constants verified by 9 passing automated test suites | High |
| **EVD-029** | Vercel production deployment config enforces immutable caching for assets | Configuration | `Frontend/PrepMatrix/vercel.json#L3-L12` | `/assets/(.*)` with `Cache-Control: public, max-age=31536000, immutable` | High |
| **EVD-030** | Live deployment at `prep-matrix.vercel.app` runs older Next.js quiz platform | Live Network | HTTP GET `https://prep-matrix.vercel.app` | Serves HTML containing `_next/static/chunks/webpack-*.js` and title "PrepMatrix - Quiz Practice Platform" | High |
| **EVD-031** | Vite development server integrates local Gemini proxy middleware | Code | `Frontend/PrepMatrix/vite.config.ts#L21-L45` | `localGeminiProxyPlugin()` intercepts `/api/gemini` and calls `handleGeminiProxyRequest` | High |
| **EVD-032** | Automated CI pipeline executes question validation, gesture tests, and build | Configuration | `.github/workflows/ci.yml#L28-L41` | Steps: `npm run validate:manual-questions`, `npm run test:gestures`, `npm run build` | High |
| **EVD-033** | Rollup build produces large monolithic JavaScript chunk (> 1.5MB) | Build Output | `dist/assets/index-C1ZqBKnL.js` (1,566.70 kB) | Vite build warning: "Some chunks are larger than 500 kB after minification" | High |

---

## 3. Discrepancy & Verification Summary

1. **Database Schema vs. Code Implementation**:
   - `interview_sessions` in `schema.sql` expects `(domain, difficulty, mode, title, status, score, questions, transcripts, metrics, feedback, duration_seconds)`.
   - `interviewService.ts` writes `{ answers, created_at, current_question_index, difficulty, domain_id, ended_at, id, questions, role, score, started_at, status, user_id }`.
   - `aiInterviewService.ts` attempts to write to distinct `interviews`, `questions`, and `responses` tables and activates a graceful local storage fallback when the relational tables are absent.
2. **Missing Remote Database Functions**:
   - `admin_list_users`, `admin_update_user_role`, `admin_delete_user`, `admin_platform_stats`, `get_public_candidates`, `get_leaderboard` are invoked via `supabase.rpc(...)` but are not preserved in source control within `Backend/supabase/`.
3. **Live Deployment Mismatch**:
   - `https://prep-matrix.vercel.app` serves Next.js quiz platform assets rather than the current Vite SPA build.
