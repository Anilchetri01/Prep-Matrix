# PrepMatrix

> **Prepare Smarter. Perform Better. Get Hired.**

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white)

PrepMatrix is an AI-powered interview preparation platform built for candidates who want structured, realistic, and measurable interview practice. It combines domain-specific manual interviews, resume-aware AI interviews, authentication, analytics, and leaderboards inside a modern SaaS-style dashboard experience.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Installation Guide](#installation-guide)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Authentication Flow](#authentication-flow)
- [Interview System](#interview-system)
- [Domain Support](#domain-support)
- [UI/UX Highlights](#uiux-highlights)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

PrepMatrix helps candidates prepare for interviews through two complementary practice systems:

- **AI-powered interviews** that generate and evaluate interview experiences with Gemini AI.
- **Manual interview mode** that uses a structured domain-specific question bank with difficulty levels.

The platform is designed for students, job seekers, developers, career switchers, and professionals who want to practice interviews in a more measurable way. Users can prepare across many career domains, upload resumes for AI-assisted interview generation, review performance feedback, track progress, and compare results through leaderboard-style experiences.

PrepMatrix solves the common problem of scattered interview preparation by combining question practice, resume-based AI personalization, analytics, authentication, and a polished dashboard into one focused platform.

---

## Features

| Feature | Description |
| --- | --- |
| 🤖 **AI Interview Mode** | Generate AI-assisted interview sessions and feedback using Gemini AI. |
| 🧠 **Manual Interview Mode** | Practice curated domain-specific questions without relying on AI generation. |
| 📄 **Resume-Based AI Interviews** | Upload a resume and receive tailored interview questions based on profile context. |
| 🔐 **Google OAuth Authentication** | Sign in quickly using Google OAuth through Supabase Auth. |
| 🛡️ **Supabase Authentication** | Secure email/password authentication and session handling. |
| 🗂️ **Dynamic Question Bank** | Large structured question bank across many domains and difficulty levels. |
| 🎚️ **Difficulty Levels** | Practice beginner, intermediate, and advanced interview questions. |
| ⚡ **Real-Time Feedback** | Receive evaluation-focused feedback for interview responses. |
| 📊 **Analytics Dashboard** | Track preparation progress, scores, activity, and performance signals. |
| 🏆 **Leaderboards** | Compare performance and encourage consistent practice. |
| 🌐 **Multi-Domain Career Support** | Prepare for technology, business, finance, healthcare, education, government, and more. |
| 📱 **Responsive UI** | Works across desktop, laptop, tablet, and mobile viewports. |
| ✨ **Modern SaaS Design** | Premium dashboard interface with dark/light theme support and polished interactions. |
| 🚀 **Performance Optimizations** | Vite-based build, lazy-loaded routes, production bundling, and optimized static assets. |

---

## Tech Stack

### Frontend

| Technology | Purpose |
| --- | --- |
| **React** | Component-based UI architecture. |
| **TypeScript** | Type-safe application development. |
| **Vite** | Fast development server and production build tooling. |
| **Tailwind CSS** | Utility-first styling and responsive design system. |

### Backend / Services

| Service | Purpose |
| --- | --- |
| **Supabase** | Authentication, database, storage, and backend services. |
| **Gemini AI** | AI interview generation and evaluation support. |

### Authentication

| Technology | Purpose |
| --- | --- |
| **Supabase Auth** | Email/password login, session lifecycle, and user authentication. |
| **Google OAuth** | Third-party OAuth login through Supabase. |

### Hosting / Deployment

| Platform | Purpose |
| --- | --- |
| **Vercel** | Production deployment, serverless API routes, and static frontend hosting. |

---

## Project Architecture

```bash
Prep-Matrix/
├── api/                 # Vercel serverless API routes
├── public/              # Static public assets
├── scripts/             # Project utility and validation scripts
├── server/              # Shared server-side logic for API handlers
├── src/                 # Main React application source
│   ├── app/             # App shell, routes, components, pages, contexts, data
│   ├── assets/          # Branding and image assets
│   ├── lib/             # Shared client libraries and browser utilities
│   ├── services/        # Supabase-backed app services
│   └── styles/          # Global styles, Tailwind entry, theme styles
├── supabase/            # Supabase SQL setup and database schema
├── index.html           # Vite HTML entrypoint
├── package.json         # Scripts and dependencies
├── vercel.json          # Vercel routing, caching, and SPA fallback
└── vite.config.ts       # Vite, React, Tailwind, aliases, and local API middleware
```

### Important Folders

- **`src/app`** contains the primary dashboard application, pages, route definitions, reusable UI, contexts, and interview data.
- **`src/services`** contains the Supabase-backed service layer for authentication, profiles, resumes, interviews, history, and leaderboard data.
- **`api`** contains Vercel serverless entrypoints such as the Gemini proxy endpoint.
- **`server`** contains server-only logic shared between local development middleware and production API routes.
- **`supabase`** contains SQL needed to configure the database, functions, policies, and related backend setup.

---

## Installation Guide

Follow these steps to run PrepMatrix locally.

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/prepmatrix.git
cd prepmatrix
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create an environment file

```bash
cp .env.example .env
```

Then update `.env` with your own Supabase and Gemini configuration.

### 4. Run the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

### 6. Preview the production build

```bash
npm run preview
```

---

## Environment Variables

Create a local `.env` file using `.env.example` as a reference.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

| Variable | Required | Scope | Description |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Browser | Public Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Browser | Public Supabase anon or publishable key. |
| `GEMINI_API_KEY` | Yes | Server only | Gemini API key used by the serverless Gemini proxy. |
| `GEMINI_MODEL` | No | Server only | Gemini model override. Defaults to `gemini-2.5-flash`. |

> **Security Note**
>
> Do not expose service-role keys, database passwords, OAuth client secrets, or Gemini API keys in frontend variables. Any variable prefixed with `VITE_` is bundled into the browser. The Gemini key should remain server-only as `GEMINI_API_KEY`.

---

## Running Locally

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

By default, the app runs at:

```text
http://localhost:5173
```

Useful commands:

```bash
npm run dev
npm run build
npm run preview
npm run validate:manual-questions
```

---

## Deployment

PrepMatrix is ready for deployment on Vercel.

### Vercel Steps

1. Push the repository to GitHub.
2. Open Vercel and import the GitHub repository.
3. Use the Vite framework preset.
4. Add all required environment variables.
5. Deploy the project.

### Recommended Vercel Settings

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Production Notes

- `vercel.json` provides SPA fallback routing so refreshed client-side routes resolve correctly.
- Vercel serverless functions in `api/` support backend-only operations such as Gemini API requests.
- Add production environment variables in Vercel Project Settings.
- Configure Supabase Auth redirect URLs for your production domain.
- Configure Google OAuth origins and callback settings before enabling production login.

---

## Authentication Flow

PrepMatrix uses Supabase Auth for authentication and session management.

### Email / Password

Users can create an account and sign in with email/password credentials. Supabase handles authentication, session creation, token refresh, and sign-out behavior.

### Google OAuth

Users can sign in with Google OAuth through Supabase. The app redirects authenticated users back into the dashboard after the OAuth flow completes.

### Session Handling

- Supabase manages access and refresh tokens.
- The app listens for authentication state changes.
- Protected routes prevent unauthenticated access to private pages.
- Logout clears the Supabase session and local auth state, then redirects safely to the login page.

---

## Interview System

PrepMatrix includes both manual and AI-driven interview workflows.

### Manual Mode

Manual Mode uses a structured question bank to help users practice by domain and difficulty level. It is ideal for focused preparation when users want predictable, repeatable practice sessions.

### AI Mode

AI Mode uses Gemini AI to generate and evaluate interview experiences. It is designed for more dynamic preparation, especially when users want personalized questions and AI-assisted feedback.

### Resume-Based Interviews

Users can upload a resume and generate interview questions that reflect their background, skills, and target domain.

### Question Logic

- Domain-based question selection
- Beginner, intermediate, and advanced difficulty levels
- Dynamic question randomization
- AI evaluation for generated interview responses
- Progress and performance tracking

---

## Domain Support

PrepMatrix supports **97+ career domains** across a broad set of professional tracks, including:

- Technology and software engineering
- Data, AI, and machine learning
- Business, product, and management
- Finance and accounting
- Healthcare and medical roles
- Education and academic roles
- Government and public sector preparation
- Legal, compliance, and administration
- Design, media, operations, and more

This makes PrepMatrix useful for both technical and non-technical interview preparation.

---

## UI/UX Highlights

- Premium SaaS-inspired dashboard layout
- Dark and light theme support
- Responsive desktop, tablet, and mobile experience
- Modern navigation and protected route architecture
- Polished authentication screens
- Accessible confirmation flows and keyboard-friendly dialogs
- Clear analytics, score, and progress presentation
- Clean component structure for long-term maintainability

---

## Future Improvements

Planned and potential enhancements:

- 🎙️ Voice-based interview practice
- 📹 Interview recordings and playback
- 📈 Deeper AI analytics and scoring breakdowns
- 🧭 Personalized learning paths
- 🧑‍💼 Recruiter and admin dashboards
- 📝 Custom interview templates
- 🌍 More career domains and localized interview content
- 📬 Email progress reports and reminders
- 🧪 Expanded automated testing coverage

---

## Contributing

Contributions are welcome.

### How to Contribute

1. Fork the repository.
2. Create a new feature branch.

```bash
git checkout -b feature/your-feature-name
```

3. Install dependencies.

```bash
npm install
```

4. Make your changes.
5. Run validation and build checks.

```bash
npm run validate:manual-questions
npm run build
```

6. Commit your changes.

```bash
git commit -m "Add your feature"
```

7. Push your branch and open a pull request.

```bash
git push origin feature/your-feature-name
```

### Contribution Guidelines

- Keep code readable and maintainable.
- Do not commit secrets or local `.env` files.
- Follow the existing project structure.
- Test important flows before opening a pull request.
- Keep UI changes consistent with the existing design system.

---

## License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this project under the terms of the MIT License.

---

## Built with ❤️ using React, Supabase, and Gemini AI.
