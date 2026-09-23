# Product Requirements Document (PRD)

## PrepMatrix: AI-Powered & Manual Interview Preparation Platform

---

### 1. Document Control
- **Product Name**: PrepMatrix
- **Document Version**: 1.0.0
- **Status**: Approved / In Production
- **Last Updated**: 2026-09-24

---

### 2. Executive Summary
PrepMatrix is an intelligent interview preparation SaaS platform designed to bridge the gap between candidate practice and real-world technical and behavioral interview performance. Offering dual interview paradigms—structured **Manual Practice Mode** with 97+ categorized career domains and dynamic **AI Mode** powered by Gemini AI with multimodal interaction—PrepMatrix enables users to practice, analyze resumes for ATS alignment, track detailed performance metrics, and compete on global leaderboards.

---

### 3. Problem Statement
Job seekers, career switchers, and engineers face multiple key challenges when preparing for interviews:
1. **Generic, Disorganized Content**: Online interview questions are frequently scattered, outdated, and uncalibrated to specific domains or seniority levels.
2. **Lack of Realistic Feedback**: Practicing alone with static flashcards provides no objective feedback on tone, technical accuracy, conciseness, or relevance.
3. **Resume Disconnect**: Candidates struggle to predict what technical questions will be asked based specifically on their actual resume experience.
4. **Poor Mobile Usability**: Most coding and technical prep tools do not offer responsive, native-feeling mobile practice experiences for prep on the go.

---

### 4. Vision & Value Proposition
To become the premier platform for end-to-end career interview readiness by providing:
- **Instant, Targeted Practice**: 97+ specialized domain tracks spanning Engineering, Data/AI, Product, Healthcare, Law, Finance, and Management.
- **Multimodal AI Evaluation**: Real-time evaluation of spoken or written answers with structured ratings, strengths, and areas for improvement.
- **Actionable Resume ATS Insights**: Automatic extraction of skills, experience parsing, and customized interview simulations based on uploaded resumes.
- **Progress Tracking & Gamification**: Session histories, comparative score percentiles, and global leaderboards.

---

### 5. Target Audience & User Personas

| Persona | Background | Needs & Goals | Key Feature Fit |
| :--- | :--- | :--- | :--- |
| **Priya (Aspiring Software Engineer)** | CS College Graduate | Needs structured technical questions, beginner-to-advanced difficulty progression, and repeatable practice. | Manual Mode Question Bank, History, Leaderboard |
| **Marcus (Senior DevOps Engineer)** | Experienced Professional (8+ yrs) | Wants realistic scenario testing and tough architectural questions tailored to his exact resume. | Resume-based AI Interview, Audio & Camera preview |
| **David (Career Switcher)** | Non-technical to Product/Data | Needs confidence building, constructive AI feedback on explanations, and ATS resume scanning. | Resume ATS Analyzer, AI Mode instant grading |
| **Amina (Commuter / Mobile Learner)** | Working professional | Studies during commute or downtime on mobile devices. | Mobile-first gesture navigation, bottom drawers, responsive layouts |

---

### 6. Core Features & Functional Requirements

#### 6.1 Authentication & User Management
- **Supabase Authentication**: Secure email and password signup/login with automatic profile provisioning.
- **Google OAuth Integration**: One-click Google social authentication.
- **User Profile**: Configurable avatar, full name, target career role, years of experience, primary skills, and social links (GitHub, LinkedIn, Portfolio).
- **Session Management**: Secure persistence of user session state with token refresh.

#### 6.2 Practice Modes

##### A. Manual Practice Mode
- **Domain Selection**: Support for 97+ career domains categorized by discipline (Frontend, Backend, System Design, DevOps, Machine Learning, Product Management, etc.).
- **Difficulty Calibration**: Beginner, Intermediate, and Advanced tiers.
- **Interactive Question Runner**: Step-by-step question navigation, timer, answer input, reference solution reveal, and self-evaluation score recording.
- **Session Summary**: Breakdown of questions attempted, time spent per question, and overall score calculation.

##### B. AI Interview Mode
- **Adaptive Question Generation**: Powered by Google Gemini AI (`gemini-2.5-flash`), generating questions tailored to domain, difficulty, and uploaded resume context.
- **Immersive Interview Shell**: Fullscreen immersive focus mode with optional camera preview and microphone speech input.
- **Instant Response Scoring**: Evaluates candidate responses across:
  - Technical Accuracy & Depth
  - Clarity & Articulation
  - Structured Thinking (e.g. STAR method)
  - Confidence & Completeness
- **PDF Report Generation**: Downloadable comprehensive interview report summary via jsPDF.

#### 6.3 Resume Analysis & ATS Scanner
- **PDF Parsing**: Client-side parsing using `pdfjs-dist` to extract plain text and structural sections.
- **ATS Compatibility Scoring**: Algorithmic and AI analysis of keyword densities, formatting, and role alignment.
- **Skills Extraction & Role Recommendations**: Automated identification of core competencies and suggested career tracks.
- **One-Click Resume Interview**: Seamlessly initiates an AI interview session using the candidate's parsed resume.

#### 6.4 Analytics & Gamification
- **Leaderboard**: Global ranking based on interview performance scores, session counts, and domain mastery.
- **Performance Analytics**: Time series charts of score trends, domain strengths, and weak spots via Recharts.
- **Interview History**: Granular archive of every completed session, question transcript, and AI feedback note.

#### 6.5 Mobile & UX Experience
- **Responsive Navigation**: Bottom-sheet drawer navigation with high-performance gesture physics (rubberbanding, velocity tracking, snap points).
- **Theme Support**: Seamless Dark and Light mode transitions with zero hydration flashes.
- **Accessibility**: ARIA-compliant dialogs, focus traps, and keyboard navigation via Radix UI primitives.

---

### 7. Non-Functional Requirements

- **Performance**: Initial load time < 2.0s; client-side route transitions < 100ms; proxy response times < 2.5s for Gemini AI evaluations.
- **Scalability**: Stateless serverless functions on Vercel; scalable PostgreSQL on Supabase capable of supporting thousands of concurrent users.
- **Security**: Strict Row-Level Security (RLS) on all database tables; secure server-side proxy for Gemini API keys with no browser key leakage.
- **Reliability & Fault Tolerance**: Retry logic with exponential backoff on AI calls; graceful fallbacks if network requests fail.

---

### 8. Success Metrics & Key Performance Indicators (KPIs)
- **Practice Completion Rate**: > 75% of started interview sessions completed.
- **User Retention**: > 40% 7-day retention for candidates actively preparing for upcoming interviews.
- **Average Practice Duration**: > 18 minutes per active session.
- **AI Latency & Reliability**: 99.5% uptime on AI proxy endpoints with p95 response time < 3.0 seconds.
