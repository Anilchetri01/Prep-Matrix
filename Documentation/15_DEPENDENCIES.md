# Document 15 — Dependency & Package Documentation

**Project**: PrepMatrix  
**Document Version**: 1.0.0  
**Package Manifest**: `Frontend/PrepMatrix/package.json`  
**Lockfile**: `Frontend/PrepMatrix/package-lock.json`  
**Auditor**: Senior Software Architect / Build Specialist  
**Last Updated**: September 24, 2026  

---

## 1. Overview

PrepMatrix's frontend architecture is built on **React 18**, **TypeScript**, and **Vite 6**. This document provides an audit of all production and development dependencies, documenting their version, functional role, usage location, and bundle impact.

---

## 2. Production Dependencies Inventory

| Package Name | Version | Runtime Category | Purpose in PrepMatrix | Where Used in Code | Bundle & Maintenance Notes |
|---|---|---|---|---|---|
| **`react`** | `18.3.1` | Core Framework | Component architecture, state, and virtual DOM | Ubiquitous across `src/` | Standard React 18 LTS release |
| **`react-dom`** | `18.3.1` | Core Framework | DOM rendering and portal mounting | `src/main.tsx` | Standard React 18 DOM renderer |
| **`react-router`** | `7.13.0` | Routing | Declarative SPA client routing and navigation guards | `src/app/routes.tsx` | Modern React Router v7 with data router APIs |
| **`@supabase/supabase-js`** | `^2.101.1`| BaaS Client | Auth token lifecycle, PostgREST queries, and storage | `src/lib/supabaseClient.ts`, all services | Core backend data layer |
| **`pdfjs-dist`** | `^5.6.205`| PDF Engine | Client-side text parsing of uploaded PDF resumes | `src/app/modules/aiMode/utils/resumeTextExtractor.ts` | Generates separate worker chunk `pdf.worker-*.mjs` (2.35 MB) |
| **`jspdf`** | `^4.2.1` | PDF Generation | Programmatic compilation of interview report PDFs | `src/app/modules/aiMode/utils/generateInterviewReportPdf.ts` | Standalone client PDF export |
| **`recharts`** | `2.15.2` | Data Visualization | Practice streak AreaCharts, BarCharts, and Radar charts | `src/app/pages/Dashboard.tsx`, `Results.tsx`, `AdminPanel.tsx` | Heavy charting library contributing to monolithic bundle |
| **`lucide-react`** | `0.487.0` | Iconography | SVG UI icons across navigation, cards, and buttons | Ubiquitous across components | Modern tree-shakeable SVG icons |
| **`sonner`** | `2.0.3` | UI Feedback | Non-blocking toast notifications | `src/app/contexts/AuthContext.tsx`, pages | High-performance toast manager |
| **`canvas-confetti`** | `1.9.4` | Visual FX | Celebratory particle explosion for high scores (>=75%) | `src/app/pages/Results.tsx` | Lightweight canvas effect |
| **`date-fns`** | `3.6.0` | Utilities | Date formatting and timestamp calculations | `src/app/pages/Dashboard.tsx`, `History.tsx` | Modular date manipulation |
| **`@emailjs/browser`** | `^4.4.1` | Third-Party API | Browser-based email forwarding for contact inquiries | `src/app/components/Footer.tsx` | Outbound messaging client |
| **`motion`** | `12.23.24`| Animation | Smooth component enter/exit transitions | UI layout components | Successor to Framer Motion |
| **`vaul`** | `1.1.2` | Mobile UI | Mobile bottom-sheet drawer component primitive | Mobile drawer components | Accessible drawer component |
| **`@radix-ui/react-*`** | `1.1 - 2.2` | UI Primitives | Accessible dialogs, tooltips, dropdowns, and tabs | `src/app/components/ui/*` | Unstyled headless accessibility primitives |
| **`clsx`** | `2.1.1` | Styling Utility | Conditional CSS class merging | `src/app/components/ui/utils.ts` | Zero-dependency class merger |
| **`tailwind-merge`** | `3.2.0` | Styling Utility | Resolves Tailwind CSS utility conflicts | `src/app/components/ui/utils.ts` | Essential for component styling |
| **`class-variance-authority`** | `0.7.1` | Styling Utility | Variant-driven component styling (CVA) | `src/app/components/ui/button.tsx` | Type-safe CSS variant manager |
| **`cmdk`** | `1.1.1` | Search / Menu | Command menu and accessible fuzzy search | Search inputs and modals | Fast command palette primitive |
| **`next-themes`** | `0.4.6` | Theme Utility | Dark and light mode state persistence | `src/app/contexts/SettingsContext.tsx` | Handles root HTML class toggling |

---

## 3. Development Dependencies

| Package Name | Version | Role in Project | Verification Source |
|---|---|---|---|
| **`vite`** | `6.4.2` | Development HMR server and Rollup production compiler | `Frontend/PrepMatrix/package.json` |
| **`@vitejs/plugin-react`** | `4.7.0` | Babel/SWC Fast Refresh plugin for React | `Frontend/PrepMatrix/vite.config.ts` |
| **`tailwindcss`** | `4.1.12` | Next-generation utility CSS engine | `Frontend/PrepMatrix/package.json` |
| **`@tailwindcss/vite`** | `4.1.12` | First-party Vite plugin for Tailwind v4 compilation | `Frontend/PrepMatrix/vite.config.ts` |

---

## 4. Production Bundle Breakdown & Chunk Analysis

A production build executed via `npm run build` yields the following asset inventory:

```text
dist/index.html                                       2.30 kB │ gzip:   0.74 kB
dist/assets/pdf.worker-2htIQpfR.mjs               2,358.23 kB (Separate Web Worker)
dist/assets/index-D0D2vJ69.css                      136.81 kB │ gzip:  21.90 kB
dist/assets/purify.es-B5CD4DQe.js                    22.90 kB │ gzip:   8.84 kB
dist/assets/AIInterview-phlKwysg.js                  79.23 kB │ gzip:  22.19 kB
dist/assets/index.es-rBd-8vUY.js                    159.68 kB │ gzip:  53.57 kB
dist/assets/html2canvas.esm-QH1iLAAe.js             202.38 kB │ gzip:  48.04 kB
dist/assets/AIInterviewSessionDetail-YSzdz5lv.js    411.98 kB │ gzip: 134.29 kB
dist/assets/pdf-dqd5vC4d.js                         512.51 kB │ gzip: 155.91 kB
dist/assets/index-C1ZqBKnL.js                     1,566.70 kB │ gzip: 439.87 kB
```

### Architectural Observations:
1. **Large Monolithic Index Chunk**: `index-C1ZqBKnL.js` measures **1.56 MB** (compressed gzip 439 kB), triggering a Rollup size warning.
2. **Worker Isolation**: `pdfjs-dist` worker (`pdf.worker-*.mjs`, 2.35 MB) is cleanly decoupled into an asynchronous worker script, preventing UI thread blocking during PDF parsing.
3. **Route Splitting**: `AIInterview` and `AIInterviewSessionDetail` are cleanly isolated into separate on-demand asynchronous chunks via `React.lazy()`.
