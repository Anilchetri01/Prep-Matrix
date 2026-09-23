# Document 16 — Feature-to-Code Traceability Matrix

**Project**: PrepMatrix  
**Document Version**: 1.0.0  
**Status**: Forensic Traceability Baseline  
**Auditor**: Senior Software Architect / Quality Engineer  
**Last Updated**: September 24, 2026  

---

## 1. Overview

This matrix establishes complete bidirectional traceability between product features, user interfaces, frontend React components, underlying service layer APIs, persistent database entities, and test suites.

---

## 2. Feature-to-Code Traceability Table

| Feature ID | Feature Name | UI Route | Component File | Service / API Layer | Database Entity | Test Suite | Implementation Status |
|---|---|---|---|---|---|---|---|
| **FEAT-001** | Email / Password Authentication | `/login`, `/signup` | `Login.tsx`, `Signup.tsx` | `authService.ts` (`login`, `signup`) | `auth.users`, `public.profiles` | Manual QA | Implemented |
| **FEAT-002** | Google OAuth Authentication | `/login`, `/signup` | `GoogleAuthButton.tsx` | `authService.ts` (`signInWithGoogle`) | `auth.users`, `public.profiles` | Manual QA | Implemented |
| **FEAT-003** | Auto Profile Provisioning Trigger | N/A (Backend) | Database Function | `handle_new_user()` trigger | `public.profiles` | Database Audit | Implemented |
| **FEAT-004** | Candidate Profile Management | `/profile` | `Profile.tsx` | `profileService.ts` (`updateProfile`) | `public.profiles` | Manual QA | Implemented |
| **FEAT-005** | Avatar Graphic Upload | `/profile` | `Profile.tsx` | `profileService.ts` (`uploadAvatar`) | Supabase Storage (`avatars`) | Manual QA | Implemented |
| **FEAT-006** | 97-Domain Career Catalog | `/manual-mode` | `ManualMode.tsx` | `domains.config.ts`, `questions.ts` | Static JSON / TypeScript | `validateManualQuestionBank.mjs` | Implemented |
| **FEAT-007** | Manual Practice Runner | `/interview` | `Interview.tsx` | `interviewService.ts` (`saveInterview`) | `public.interview_sessions` | Manual QA | Implemented |
| **FEAT-008** | Manual Heuristic Answer Scoring | `/interview` | `Interview.tsx` | `evaluation.ts` (`evaluateAnswer`) | In-memory evaluation | Code Audit | Implemented |
| **FEAT-009** | Text-to-Speech Question Readout | `/interview` | `Interview.tsx` | `speech.ts` (`TextToSpeech`) | Browser SpeechSynthesis | Manual QA | Implemented |
| **FEAT-010** | Speech-to-Text Voice Answering | `/interview`, `/ai-mode` | `Interview.tsx`, `AIInterviewPage.tsx` | `speech.ts` (`SpeechToText`) | Browser SpeechRecognition | Manual QA | Implemented |
| **FEAT-011** | Manual Results & Radar Chart | `/results/:id` | `Results.tsx` | `interviewService.ts` (`getInterview`) | `public.interview_sessions` | Manual QA | Implemented |
| **FEAT-012** | AI Resume Interview Generator | `/ai-mode` | `AIInterviewPage.tsx` | `geminiClient.ts` (`generateResumeInterview`) | Serverless Proxy `/api/gemini` | Manual QA | Implemented |
| **FEAT-013** | Client-Side PDF Resume Parsing | `/ai-mode` | `AIInterviewPage.tsx` | `resumeTextExtractor.ts` | `pdfjs-dist` (In-memory) | Manual QA | Implemented |
| **FEAT-014** | Live WebRTC Camera Preview | `/ai-mode` | `CameraPreview.tsx` | `navigator.mediaDevices.getUserMedia` | Local Video Canvas | Manual QA | Implemented |
| **FEAT-015** | Immersive AI Interview Shell | `/ai-mode` | `ImmersiveInterviewShell.tsx` | Client State & Timers | Local State | Manual QA | Implemented |
| **FEAT-016** | Gemini Structured Answer Evaluation | `/ai-mode` | `AIInterviewPage.tsx` | `geminiClient.ts` (`evaluateInterviewAnswer`) | Serverless Proxy `/api/gemini` | Manual QA | Implemented |
| **FEAT-017** | Interview PDF Report Export | `/ai-mode` | `SessionSummary.tsx` | `generateInterviewReportPdf.ts` | `jspdf` (Local Export) | Manual QA | Implemented |
| **FEAT-018** | Resume ATS & Skill Gap Analyzer | `/resume-analysis`| `ResumeAnalysis.tsx` | `resumeAnalyzer.ts` (`analyzeResume`) | `public.resume_analysis` | Manual QA | Implemented |
| **FEAT-019** | Resume File Cloud Storage | `/resume-analysis`| `ResumeAnalysis.tsx` | `resumeService.ts` (`saveResume`) | Supabase Storage (`resumes`) | Manual QA | Implemented |
| **FEAT-020** | Unified Performance Analytics | `/dashboard` | `Dashboard.tsx` | `interviewService.ts`, `aiInterviewService.ts`| `interview_sessions`, `interviews` | Manual QA | Implemented |
| **FEAT-021** | Interview Session Archive | `/history` | `InterviewHistory.tsx` | `interviewService.ts`, `aiInterviewService.ts`| `interview_sessions`, LocalStore | Manual QA | Implemented |
| **FEAT-022** | Global Practice Leaderboard | `/leaderboard` | `Leaderboard.tsx` | `leaderboardService.ts` (`getLeaderboard`)| `public.interviews` | Manual QA | Implemented |
| **FEAT-023** | Candidate Discovery Directory | `/candidates` | `Candidates.tsx` | `profileService.ts` (`getPublicCandidates`)| `public.profiles` | Manual QA | Implemented |
| **FEAT-024** | Dark / Light Theme Switching | Global UI | `SettingsContext.tsx` | `SettingsContext.tsx` (`setTheme`) | `localStorage`, HTML class | Manual QA | Implemented |
| **FEAT-025** | Sound & Voice Preferences | `/settings` | `Settings.tsx` | `SettingsContext.tsx` (`updateSettings`) | `localStorage` | Manual QA | Implemented |
| **FEAT-026** | Mobile Swipe Navigation Drawer | Global Mobile | `useMobileSwipeDrawer.ts` | `drawerGesturePhysics.ts` | Touch events & spring physics | `testMobileDrawerGesture.mjs` | Implemented |
| **FEAT-027** | Administrator Overview & KPIs | `/admin` | `AdminPanel.tsx` | `interviewService.ts` (`getAdminStats`) | Remote RPC `admin_platform_stats` | Manual QA | Partially Implemented |
| **FEAT-028** | Admin User List & Deletion | `/admin` | `AdminPanel.tsx` | `profileService.ts` (`getAdminUsers`, `deleteUser`) | Remote RPC `admin_list_users` | Manual QA | Partially Implemented |
| **FEAT-029** | Admin User Role Toggle | `/admin` | `AdminPanel.tsx` | `profileService.ts` (`updateUserRole`) | Remote RPC `admin_update_user_role`| Manual QA | Partially Implemented |
| **FEAT-030** | Contact Support via EmailJS | Footer (`Navbar`) | `Footer.tsx` | `emailjs.send` | EmailJS REST API | Manual QA | Implemented |
