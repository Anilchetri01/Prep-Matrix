# PrepMatrix Mobile UI/UX Implementation Plan

## 1. Executive Summary

PrepMatrix is a Vite + React 18 application with React Router 7, Tailwind CSS v4 utilities, Radix-style UI primitives, lucide-react icons, Recharts, Supabase-backed services, and a shared top navigation component. The authenticated desktop experience is visually coherent and should remain intact.

The live mobile audit found that most pages avoid catastrophic horizontal scrolling, but several mobile workflows still feel desktop-compressed. The largest mobile issues are:

- The shared mobile navigation is a long top dropdown with every destination and account action, causing slight 320 px horizontal overflow and poor destination prioritization.
- Dashboard, Manual Mode, and AI Mode use large hero/stat sections that push primary task controls below the first fold on 320 px and 360 px phones.
- Resume Analysis has confirmed page-level horizontal overflow at 320 px.
- Profile tabs overflow at 320 px, with the Statistics tab clipped.
- Charts, dense stat grids, candidate detail modals, history filters, and interview/result screens need mobile-specific representations rather than only stacked desktop cards.

No application source files were modified during the audit. Screenshots were saved in `docs/mobile-audit/screenshots/`, and live measurement JSON was saved in `docs/mobile-audit/`.

## 2. Audit Methodology

The audit used:

- Live authenticated browser inspection of `https://prepmatrix.vercel.app`.
- Source inspection in `src/app`, `src/styles`, `src/services`, `src/lib`, `api`, `server`, `package.json`, `vite.config.ts`, and `vercel.json`.
- Viewport checks at 320 x 568, 360 x 800, 768 x 1024, and 932 x 430, with recommendations extrapolated to the requested 375, 390, 412, 430, 844 landscape, and 1024 tablet/desktop widths.
- Interactive checks for mobile drawer, logout dialog, candidate profile modal, profile tabs, dashboard, manual setup, AI setup, resume analysis, history, leaderboard, candidates, profile, and admin access behavior.

Evidence files:

| Evidence | Notes |
|---|---|
| `docs/mobile-audit/live-route-audit-settled.json` | Route-level viewport metrics after app splash settles. |
| `docs/mobile-audit/interaction-audit.json` | Mobile drawer, logout dialog, candidate modal, and profile tab state metrics. |
| `docs/mobile-audit/screenshots/dashboard-320x568-settled.png` | Oversized mobile dashboard opening section. |
| `docs/mobile-audit/screenshots/manual-mode-320x568-settled.png` | Manual setup controls pushed below first fold. |
| `docs/mobile-audit/screenshots/ai-mode-320x568-settled.png` | AI setup controls pushed below first fold. |
| `docs/mobile-audit/screenshots/resume-analysis-320x568-settled.png` | Confirmed horizontal overflow. |
| `docs/mobile-audit/screenshots/navbar-drawer-320x568.png` | Mobile drawer overflow and destination density. |
| `docs/mobile-audit/screenshots/profile-tabs-scrolled-320x568.png` | Profile tabs clipped at 320 px. |
| `docs/mobile-audit/screenshots/candidate-profile-modal-320x568.png` | Candidate modal dense desktop-dialog pattern on phone. |
| `docs/mobile-audit/screenshots/logout-dialog-320x568.png` | Dialog contained, but should follow shared mobile dialog rules. |

## 3. Current Technology and Responsive Architecture

| Area | Current implementation | Mobile relevance |
|---|---|---|
| Framework | Vite 6.4.2, React 18.3.1, React Router 7.13.0 | Client-rendered app with route-level pages in `src/app/pages` and lazy AI pages. |
| Styling | Tailwind CSS v4 via `src/styles/tailwind.css`, theme tokens in `src/styles/theme.css` | Responsive utilities are applied per component, mostly desktop-first additions with `sm`, `md`, `lg`, `xl`. |
| UI primitives | Radix packages, local `src/app/components/ui/*`, custom page components | Dialog/table/card primitives exist but many pages use hand-built cards/forms directly. |
| Icons | `lucide-react`, some MUI dependencies available | Icons are consistent, but icon buttons often use visual padding smaller than a 44 px target. |
| Charts | Recharts in Dashboard, Profile, Results, Admin, AI analytics | Charts need mobile-specific heights, labels, summaries, and sometimes card alternatives. |
| Auth | `AuthContext`, `ProtectedRoute`, Google OAuth via Supabase | Must remain unchanged. |
| Shared shell | `src/app/components/Navbar.tsx` imported per page | Highest-impact mobile fix surface. |
| Toasts | `Toaster` in `src/app/App.tsx`, top-right | Top-right is desktop-oriented; mobile toasts should avoid covering header/actions. |

Important current breakpoints and patterns:

- The desktop nav remains hidden until `xl`; mobile drawer is used for everything below `xl`.
- Many pages use `max-w-* mx-auto px-4 sm:px-6 lg:px-8`.
- Several grids are already responsive, but some mobile defaults are still too dense: `grid-cols-2`, `grid-cols-3`, fixed chart heights, desktop card padding, and tab rows.
- `ImmersiveInterviewShell` already uses `100svh` patterns, which is directionally good for mobile interview mode.

## 4. Application Route and Screen Inventory

| Route or screen | Purpose | Entry point | Main components | Important interactions | Authentication required |
|---|---|---|---|---|---|
| `/dashboard` | Overview, analytics, quick actions, recent activity | Root redirect and nav | `Dashboard`, `Navbar`, `Footer`, Recharts cards | Quick action buttons, recent activity links, chart review | Yes |
| `/manual-mode` | Configure manual interview | Nav, dashboard action | `ManualMode`, domain browser, setup cards | Question count, difficulty, category filters, search, domain select, start | Yes |
| `/interview?domain=...` | Manual interview chat session | Manual Mode start | `Interview` custom header, chat log, answer input, mic | Answer entry, mic, submit, exit, progress | Yes |
| `/results/:id` | Manual interview results | History/dashboard/recent activity | `Results`, charts, answer accordions | Tab switching, answer expansion, chart review | Yes |
| `/history` | Manual interview history | Nav, dashboard | `InterviewHistory` | Search, difficulty filter, sort, item open, delete | Yes |
| `/ai-mode` setup | Resume-based AI interview setup | Nav, dashboard | `AIInterviewPage`, camera preview, upload panel, recent sessions | Difficulty/count, file upload, prepare, open/delete saved sessions | Yes |
| `/ai-mode` interview state | Focused AI interview shell | AI setup start/open session | `ImmersiveInterviewShell`, `CameraPreview` | Camera, mic, textarea, submit, collapse camera, end interview | Yes |
| `/ai-mode` complete state | AI interview summary | Completing AI interview | `SessionSummary`, `InterviewAnalyticsPanel` | Refresh, start new, review analytics | Yes |
| `/interview/:id` | Saved AI session detail | AI history/session links | `AIInterviewSessionDetail`, AI summary components | Open detail, report review, PDF/report actions if available | Yes |
| `/resume-analysis` | Analyze resumes for target domains | Nav, dashboard | `ResumeAnalysis` | Domain search/select, file upload, analysis detail, delete | Yes |
| `/leaderboard` | Global rankings | Nav | `Leaderboard` | Refresh, ranking review | Yes |
| `/candidates` | Browse public user profiles | Nav | `Candidates`, `ProfileModal` | Search, view profile modal, external profile links | Yes |
| `/profile` | Account profile, security, stats | Nav/avatar | `Profile`, forms, tabs, charts | Upload avatar, edit form, change password, stats | Yes |
| `/admin` | Admin panel | Admin nav only | `AdminPanel` | Charts, user search, role/action controls | Admin only; current live route redirected to dashboard |
| `/login` | Authentication | Unauthenticated redirect | `Login`, `GoogleAuthButton`, `TermsModal` | Google OAuth, terms modal | No |
| `/signup` | Signup/onboarding | Public route | `Signup`, `GoogleAuthButton` | Google OAuth | No |
| Mobile drawer | Primary authenticated navigation | Header menu button | `Navbar` mobile block | Open/close, route selection, sign out | Yes |
| Logout dialog | Sign-out confirmation | Header/drawer sign out | `LogoutConfirmationDialog` | Cancel, confirm sign out | Yes |
| Candidate profile modal | Public profile detail | Candidate card | `ProfileModal` | Close, scroll, external links | Yes |

## 5. Main Mobile UX Problems

| ID | Issue | Severity | Evidence | Source files | Acceptance criteria |
|---|---|---|---|---|---|
| M-01 | Mobile drawer is a full destination list in a top dropdown and overflows slightly at 320 px. | Critical | `navbar-drawer-320x568.png`, `interaction-audit.json` scrollWidth 323 | `src/app/components/Navbar.tsx` | No horizontal overflow at 320 px; primary destinations are prioritized; secondary/account actions are grouped; drawer has its own scroll and safe-area padding. |
| M-02 | Dashboard opening card is too tall; quick actions fall below the first fold on 320 px. | High | `dashboard-320x568-settled.png` | `src/app/pages/Dashboard.tsx` | At 320 px, user sees page title plus at least two primary actions without scrolling. |
| M-03 | Manual Mode setup is buried below hero and stat cards on narrow phones. | High | `manual-mode-320x568-settled.png` | `src/app/pages/ManualMode.tsx` | At 320 px, question count/difficulty or a sticky "Start setup" anchor is visible in first screen. |
| M-04 | AI Mode setup is buried below hero/feature cards; upload path is too far down. | High | `ai-mode-320x568-settled.png` | `src/app/modules/aiMode/AIInterviewPage.tsx` | At 320 px, resume upload or setup CTA is visible within first screen. |
| M-05 | Resume Analysis has confirmed horizontal overflow at 320 px. | High | `resume-analysis-320x568-settled.png` | `src/app/pages/ResumeAnalysis.tsx` | `documentElement.scrollWidth <= clientWidth` at 320 px; no bottom horizontal scrollbar. |
| M-06 | Profile tab bar clips the Statistics tab at 320 px. | High | `profile-tabs-scrolled-320x568.png` | `src/app/pages/Profile.tsx` | Tabs become segmented scroll, dropdown, or stacked mobile nav with all labels reachable and no page overflow. |
| M-07 | Charts are desktop charts stacked into mobile cards without compact labels or text summaries. | Medium | Dashboard/Profile/Results source and dashboard captures | `Dashboard.tsx`, `Results.tsx`, `Profile.tsx`, `InterviewAnalyticsPanel.tsx` | Each chart has mobile height/label rules and a text summary; no clipped axis labels. |
| M-08 | History filters stack correctly but consume vertical space and use small select heights. | Medium | `history-320x568-settled.png` | `src/app/pages/InterviewHistory.tsx` | Search/filter/sort become a compact filter sheet or two-row control group with 44 px targets. |
| M-09 | Candidate profile modal remains a centered desktop dialog with dense 3-column stats. | Medium | `candidate-profile-modal-320x568.png` | `src/app/pages/Candidates.tsx` | Mobile candidate details open as bottom sheet/full-screen sheet with sticky title/close and single-column metadata. |
| M-10 | Several icon-only header controls have visual dimensions below recommended touch target. | Medium | route metrics smallTargets | `src/app/components/Navbar.tsx` | Header icon buttons have 44 px hit areas without increasing icon size. |
| M-11 | Global toasts are top-right, which is desktop-biased and can compete with sticky header on phones. | Medium | `src/app/App.tsx` | `src/app/App.tsx` | Mobile toasts appear top-center or bottom above nav/action areas and do not hide controls. |
| M-12 | Results and interview screens include dense charts, accordions, chat controls, and exit controls that need mobile-specific rules. | Medium | Source inspection | `src/app/pages/Interview.tsx`, `src/app/pages/Results.tsx` | Manual interview and results complete at 320 px with visible answer input/actions and readable result sections. |
| M-13 | Admin page is inaccessible in current live account despite admin label in profile; route redirected to dashboard. | Low | `/admin` requested URL ended at `/dashboard` | `src/app/pages/AdminPanel.tsx`, `ProtectedRoute` | Document access behavior; audit admin with a verified admin session before implementation if needed. |
| M-14 | Many pages use decorative gradients/shadows that add visual weight on small screens. | Low | Multiple screenshots | Page components | Mobile keeps brand color while reducing excessive card depth and vertical padding. |
| M-15 | File upload flows need mobile keyboard/file picker/error-state specifications. | Medium | Source inspection | `ResumeAnalysis.tsx`, `AIInterviewPage.tsx`, `Profile.tsx` | Upload controls remain obvious, errors wrap, selected filenames break safely, no keyboard/action obstruction. |

Issue count by severity:

| Severity | Count |
|---|---:|
| Critical | 1 |
| High | 5 |
| Medium | 8 |
| Low | 1 |

## 6. Global Mobile Design System

Recommended mobile values should preserve the current PrepMatrix indigo/violet/cyan identity while reducing vertical weight:

| Token | Mobile value | Tablet value | Desktop behavior |
|---|---|---|---|
| Page gutter | 12 px at 320, 16 px at 360+ | 24 px | Keep current `lg:px-8`. |
| Small card padding | 12 px | 16 px | Keep current 20-24 px. |
| Standard card padding | 16 px | 20 px | Keep current 24-32 px where used. |
| Section spacing | 16 px | 20-24 px | Keep 24-32 px. |
| Header height | 56-60 px | 64 px | Current 64 px desktop is fine. |
| Bottom nav height, if added | 64 px plus safe-area inset | 64 px | Hidden desktop. |
| Input height | 44-48 px | 44-48 px | Keep current visual style. |
| Primary button height | 44-48 px | 44-48 px | Keep desktop auto/min widths. |
| Icon button target | 44 x 44 px | 44 x 44 px | Current icon size can remain 16-20 px. |
| Modal radius | 20-24 px top corners for sheets | 24 px | Keep current rounded dialogs. |
| Card radius | 14-18 px | 16-20 px | Keep current rounded-2xl unless cramped. |
| Mobile H1 | 24-28 px, line-height 1.15-1.25 | 30-36 px | Keep existing desktop 36-40 px. |
| Section heading | 18-22 px | 22-24 px | Keep existing. |
| Body text | 14-15 px, line-height 1.5 | 15-16 px | Keep existing. |
| Caption | 12-13 px | 12-13 px | Keep existing. |
| Max content width | 100% with gutters | 720-900 px | Existing max widths. |
| Tablet breakpoint | Use existing `md`/`lg`, avoid new custom unless needed | `md` 768 | Keep desktop `lg`/`xl`. |
| Animation duration | 120-180 ms for UI controls | 150-220 ms | Keep richer desktop hover motion. |

General rules:

- Keep gradients, but use fewer nested gradient cards on mobile.
- Reduce large card shadows on mobile to avoid heavy stacked slabs.
- Use `min-w-0`, `max-w-full`, and `overflow-hidden` on flex/grid children that contain emails, filenames, names, or long domain labels.
- Prefer `min-h: 100dvh` or `100svh` only for app shell/interview shell surfaces where browser chrome matters; do not blindly replace all `min-h-screen`.
- Use `padding-bottom: calc(env(safe-area-inset-bottom) + Xpx)` for fixed drawer/bottom action areas.

## 7. Mobile Navigation Architecture

Current source: `src/app/components/Navbar.tsx` lines 245-370.

Current behavior:

- One sticky top header.
- Desktop nav appears only at `xl`.
- Mobile menu expands as a full-width stacked section below the header.
- All destinations are equal: Dashboard, Manual Mode, AI Mode, Resume Analysis, History, Leaderboard, Candidates, Profile, Admin when present, Sign Out.

Recommended architecture:

| Destination | Mobile role | Reason |
|---|---|---|
| Dashboard | Primary bottom nav or drawer top item | Home/overview. |
| Manual Mode | Primary | Core workflow. |
| AI Mode | Primary | Core workflow. |
| Resume Analysis | Primary or first secondary | Core but less frequent than interview start. |
| History | Secondary drawer | Review workflow. |
| Leaderboard | Secondary drawer | Discovery/status. |
| Candidates | Secondary drawer | Discovery. |
| Profile | Account menu/drawer footer | Account management. |
| Admin | Secondary/admin group | Role-gated. |
| Voice/theme toggles | Header/account settings group | Settings, not navigation. |
| Sign Out | Drawer footer under account | Destructive account action. |

Recommended behavior:

- Replace the current dropdown with a real mobile drawer or sheet that owns its own scroll.
- Consider a 4-item bottom navigation for Dashboard, Manual, AI, Resume, with "More" opening the drawer. If avoiding bottom nav, keep only a compact header menu but group destinations into Primary, Explore, Account.
- Active state should be visible in both drawer and bottom nav.
- Drawer close button target should be 44 px.
- Drawer width should be `min(100vw, 360px)` when side-drawer, or full-width if top sheet.
- Add `overflow-x-hidden` and safe-area padding.
- Browser Back should close the drawer if supported; route navigation should close it.
- Keep desktop nav unchanged at `xl`.

## 8. Mobile Application Shell

Recommended shared shell behavior:

- Use a consistent `MobilePageShell` pattern through existing pages rather than separate mobile pages.
- Page gutters: `px-3 sm:px-6 lg:px-8`.
- First section on mobile should be compact: page title, one sentence max, primary action or filter.
- Avoid placing nonessential stat/marketing cards before core controls on task pages.
- Sticky header should not overlap anchors or focused form fields.
- Fixed bottom actions should reserve bottom padding on page content.
- Toasts should not cover drawer, bottom nav, file picker action areas, or interview submit controls.

Suggested shell class pattern:

Current:

`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8`

Recommended:

`mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8`

Reason:

This preserves desktop spacing while reducing narrow-phone crowding.

## 9. Page-by-Page Recommendations

## Page: Dashboard

### Route

`/dashboard`

### Purpose

Shows overall readiness, analytics, quick actions, and recent activity.

### Current desktop structure

Top `Navbar`, large card hero, quick actions, stat grid, multiple Recharts cards, feature cards, recent activity, footer.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| D-01 | Hero card and 3-line H1 dominate first fold; only one quick action is partially visible at 320 px. | High | 320 x 568 | `dashboard-320x568-settled.png` |
| D-02 | Six charts are stacked as full chart cards; axis labels/tooltips are not optimized for small touch screens. | Medium | 320-430 px | `Dashboard.tsx` lines 429-545 |
| D-03 | Stat cards are individually tall, creating a long scroll before analytics. | Medium | 320-390 px | `Dashboard.tsx` lines 409-426 |

### Recommended mobile structure

Top to bottom:

1. Compact welcome row with title at 24-26 px.
2. Two primary actions visible immediately: Start AI Interview and Start Manual Interview.
3. Secondary actions in a two-column compact grid or horizontal snap row: Upload Resume, Continue Previous.
4. Collapsed KPI strip with 2 primary stats and "View all stats" expansion.
5. Analytics summary cards before full charts.
6. Charts with compact labels and text summaries.
7. Recent activity.

### Navigation behaviour

Dashboard should be the default primary nav item. Back from Dashboard should not open a hidden drawer state.

### Responsive component changes

| Component | Current behaviour | Mobile behaviour | Tablet behaviour | Desktop behaviour |
|---|---|---|---|---|
| Hero card | `p-6`, `text-3xl`, large card | `p-4`, H1 24-26 px, shorter paragraph, actions visible | Restore larger H1 gradually | Keep current |
| Quick actions | 1 column below text on 320 | Two primary actions first; secondary can be compact | 2 columns | Current 2-column area |
| Stat cards | One column at mobile | Compact KPI cells or expandable stats | 2 columns | 4 columns |
| Charts | Full chart cards | Add summaries, reduce axis density, maybe hide category chart labels behind scroll/card list | 2-column when space allows | Current |

### Interaction details

Primary actions should have 44-48 px height and should not require scrolling past decorative stats. Chart tooltips should be tap-friendly and not overflow the viewport.

### Empty, loading and error states

Skeleton cards should match compact mobile card heights. Empty analytics should use shorter copy and avoid 240 px empty blocks on very small screens.

### Accessibility requirements

Add accessible chart summaries before chart canvases/SVGs. Ensure quick action buttons have clear names and 44 px targets.

### Relevant source files

- `src/app/pages/Dashboard.tsx`
- `src/app/components/Navbar.tsx`
- `src/app/components/Footer.tsx`

### Implementation tasks

- [ ] Reduce mobile dashboard hero padding and H1 size without changing `sm`/desktop classes.
- [ ] Reorder or visually prioritize quick actions above nonessential stats at mobile widths.
- [ ] Add mobile chart summary blocks and responsive chart label rules.
- [ ] Make KPI cards denser on mobile.

### Acceptance criteria

- [ ] Works at 320 px without page-level horizontal scrolling.
- [ ] At least two primary actions are visible in first viewport.
- [ ] Text does not overlap or clip.
- [ ] Mobile navigation behaves correctly.
- [ ] Desktop layout remains unchanged.

## Page: Manual Mode

### Route

`/manual-mode`

### Purpose

Lets users configure question count, difficulty, domain/category, and start a manual interview.

### Current desktop structure

Hero card with stats, left setup column, right browse-domain panel with category chips and domain grid.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| MM-01 | Hero and stats occupy the first fold; session setup starts below the fold. | High | 320 x 568 | `manual-mode-320x568-settled.png` |
| MM-02 | Category chips wrap into a long control area. | Medium | 320-390 px | `ManualMode.tsx` lines 296-310 |
| MM-03 | Domain cards are large, making discovery slow across 97 domains. | Medium | 320-390 px | `ManualMode.tsx` lines 313-320 |

### Recommended mobile structure

1. Compact title and one-line description.
2. Sticky or immediately visible setup panel: count, difficulty, selected domain, Start.
3. Domain search.
4. Category filter as horizontal scroll chips or select sheet.
5. Domain cards in compact list rows with icon, name, category, and short description.

### Navigation behaviour

Manual Mode should be a primary mobile destination. Starting an interview should show the existing launch overlay but should not hide errors behind the sticky header.

### Responsive component changes

| Component | Current behaviour | Mobile behaviour | Tablet behaviour | Desktop behaviour |
|---|---|---|---|---|
| Hero stat strip | `grid-cols-1`, 3 stacked stat boxes | Compact inline stat row or hidden under "About Manual Mode" | 3 columns | Current |
| Setup aside | Below hero | First actionable section | Left/top section | Current two-column |
| Category chips | Wrap | Horizontal scroll with snap or filter sheet | Wrap ok | Current |
| Domain cards | `min-h-[142px]` | 72-96 px list cards; selected state visible | 2 columns | Current 3 columns |

### Interaction details

Search should focus without header overlap. Start button should become sticky at bottom only after a domain is selected, with safe-area bottom padding.

### Empty, loading and error states

No-domain search state is good but should use compact vertical spacing.

### Accessibility requirements

Category controls need `aria-pressed`; selected domain needs `aria-pressed` or radio semantics.

### Relevant source files

- `src/app/pages/ManualMode.tsx`
- `src/app/components/InterviewLaunchOverlay.tsx`

### Implementation tasks

- [ ] Reorder mobile setup before the stats block.
- [ ] Convert category chips to mobile horizontal scroller or filter sheet.
- [ ] Add compact domain-card mobile variant.
- [ ] Add selected-domain sticky action area on mobile.

### Acceptance criteria

- [ ] Works at 320 px without page-level horizontal scrolling.
- [ ] Question count and difficulty controls are reachable in first viewport.
- [ ] Start button remains visible once a domain is selected.
- [ ] Desktop layout remains unchanged.

## Page: Manual Interview Session

### Route

`/interview?domain=[domain]&difficulty=[level]&count=[count]`

### Purpose

Runs a manual interview chat session with text/voice input and progress.

### Current desktop structure

Custom sticky header, progress bar, chat log, bot/user messages, answer composer, mic, submit, exit.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| MI-01 | Header, chat scroll, keyboard, mic, and submit need explicit mobile viewport ownership. | Medium | Source inspection | `Interview.tsx` lines 454-493 |
| MI-02 | Exit action is icon-only and small. | Medium | 320-390 px | `Interview.tsx` lines 469-475 |

### Recommended mobile structure

Use a chat-app layout:

1. Sticky compact header with domain, difficulty, question number.
2. Scroll-owned message area.
3. Fixed composer using `position: sticky` or bottom action area with `100dvh`/safe-area handling.
4. Submit and mic controls 44-48 px.

### Navigation behaviour

Exit should open a confirmation sheet if the session is in progress. Browser Back should not accidentally destroy progress.

### Responsive component changes

| Component | Current behaviour | Mobile behaviour | Tablet behaviour | Desktop behavior |
|---|---|---|---|---|
| Header | Sticky | Keep, but reduce vertical stacking | Current | Current |
| Chat area | `flex-1 overflow-y-auto` | Owns scroll; composer always reachable | Current | Current |
| Exit button | `p-1.5` | 44 px target | 44 px | Current visual allowed with larger hit area |

### Interaction details

When keyboard opens, composer remains visible and messages scroll above it.

### Empty, loading and error states

Invalid domain should show a compact full-screen error with a single return action.

### Accessibility requirements

Announce current question progress and evaluation updates.

### Relevant source files

- `src/app/pages/Interview.tsx`

### Implementation tasks

- [ ] Add mobile shell using dynamic viewport height.
- [ ] Increase icon button hit areas.
- [ ] Verify keyboard-open behavior.

### Acceptance criteria

- [ ] User can complete a full interview at 320 px.
- [ ] Answer composer is not hidden by keyboard or browser chrome.
- [ ] Desktop layout remains unchanged.

## Page: AI Mode Setup

### Route

`/ai-mode`

### Purpose

Uploads a PDF resume, configures a dynamic AI interview, starts or opens recent sessions.

### Current desktop structure

Branded hero, feature cards, setup section with camera preview and controls, session info/history.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| AI-01 | Feature cards push upload/setup below the first fold. | High | 320 x 568 | `ai-mode-320x568-settled.png` |
| AI-02 | 320 px audit detected overflow on this route. | Medium | 320 x 568 | `live-route-audit-settled.json` |
| AI-03 | Camera preview before upload may be too prominent for setup on phones. | Medium | 320-390 px | `AIInterviewPage.tsx` lines 1237-1265 |

### Recommended mobile structure

1. Compact title.
2. Resume upload card immediately visible.
3. Difficulty and question count controls.
4. Prepare/start button.
5. Camera preview collapsed by default until interview starts or user expands it.
6. Previous sessions after setup.

### Navigation behaviour

AI Mode should be a primary mobile destination. Saved sessions should open without losing selected upload state.

### Responsive component changes

| Component | Current behaviour | Mobile behaviour | Tablet behaviour | Desktop behavior |
|---|---|---|---|---|
| Hero features | 3 cards before setup | Collapse into one summary row or hide below setup | 2 columns | Current |
| Camera preview | Full panel before controls | Collapsed/secondary in setup; visible in interview | Side-by-side | Current |
| Upload | Inside right setup column | First setup control | Prominent | Current |
| Recent sessions | Dense cards | Compact rows, destructive delete behind menu | Current | Current |

### Interaction details

File names should break safely and not widen the viewport. Upload errors should appear inline under the upload card.

### Empty, loading and error states

AI loading/preparing state should reserve space and keep the primary action visible.

### Accessibility requirements

File input trigger requires clear label. Camera/mic permission text must be screen-reader readable.

### Relevant source files

- `src/app/modules/aiMode/AIInterviewPage.tsx`
- `src/app/modules/aiMode/components/CameraPreview.tsx`
- `src/app/components/InterviewLaunchOverlay.tsx`

### Implementation tasks

- [ ] Move mobile upload/setup above feature cards.
- [ ] Collapse camera preview by default on setup mobile.
- [ ] Add overflow guards around selected file label and session chips.
- [ ] Define mobile loading/preparing layout.

### Acceptance criteria

- [ ] Resume upload is visible in first viewport at 320 px.
- [ ] No page-level horizontal scrolling.
- [ ] Camera permission prompts do not block unrelated setup controls.
- [ ] Desktop layout remains unchanged.

## Page: AI Interview Focused Session

### Route

`/ai-mode` interview state

### Purpose

Runs a live AI interview with question prompt, camera, mic, answer textarea, progress, and ending flow.

### Current desktop structure

`ImmersiveInterviewShell` with a large framed focused layout, main question/answer column, camera/status aside, and end confirmation dialog.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| AIS-01 | Textarea has absolute inner status/action controls that can collide with mobile keyboard and small heights. | Medium | Source inspection | `ImmersiveInterviewShell.tsx` lines 225-327 |
| AIS-02 | Camera/status aside competes with answer workflow on phones. | Medium | Source inspection | `ImmersiveInterviewShell.tsx` lines 345-431 |

### Recommended mobile structure

1. Full-screen focused shell using `100dvh` or current `100svh` pattern.
2. Compact question header and timer.
3. Answer editor with bottom padding for inner controls.
4. Mic/status controls in a toolbar below textarea, not over text on the narrowest screens.
5. Camera panel collapsed by default with visible "Show camera" affordance.
6. Sticky submit button at bottom when keyboard closed; inline above keyboard when focused.

### Relevant source files

- `src/app/modules/aiMode/components/ImmersiveInterviewShell.tsx`
- `src/app/modules/aiMode/AIInterviewPage.tsx`

### Implementation tasks

- [ ] Separate textarea content from voice toolbar at mobile widths.
- [ ] Verify keyboard-open behavior at 320, 360, 390.
- [ ] Keep camera collapsed by default on mobile.
- [ ] Make end confirmation a mobile sheet.

### Acceptance criteria

- [ ] User can answer, use mic, submit, and end at 320 px.
- [ ] Text is not hidden under absolute controls.
- [ ] Camera does not consume the primary answer viewport.

## Page: Resume Analysis

### Route

`/resume-analysis`

### Purpose

Uploads a resume, selects a target domain, analyzes the content, and shows saved analysis results.

### Current desktop structure

Hero, 2x/4x stat grid, upload section, domain search/grid, saved resume/result detail.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| RA-01 | Confirmed horizontal overflow at 320 px, visible bottom scrollbar. | High | 320 x 568 | `resume-analysis-320x568-settled.png` |
| RA-02 | Stats use `grid-cols-2` at mobile, producing dense cards and likely overflow with long values. | Medium | 320 px | `ResumeAnalysis.tsx` lines 295-337 |
| RA-03 | Domain selection grid starts at `grid-cols-2`, too dense for long domain names. | Medium | 320 px | `ResumeAnalysis.tsx` line 359 |

### Recommended mobile structure

1. Compact hero.
2. Upload/resume action.
3. Domain search.
4. Domain selector as single-column list or searchable sheet.
5. Stats below action or as compact chips.
6. Saved analyses as list cards.

### Responsive component changes

| Component | Current behaviour | Mobile behaviour | Tablet behaviour | Desktop behavior |
|---|---|---|---|---|
| Stats | `grid-cols-2 md:grid-cols-4` | `grid-cols-1` at 320 or compact horizontal-safe cards | 2 columns | 4 columns |
| Upload card | `p-8` | `p-4`, button 44 px | `p-6` | Current |
| Domain grid | `grid-cols-2` mobile | 1-column list until `sm` | 3-4 columns | 5 columns |

### Relevant source files

- `src/app/pages/ResumeAnalysis.tsx`

### Implementation tasks

- [ ] Locate exact overflowing element using 320 px dev check after first fix.
- [ ] Change mobile stats and domain grid defaults.
- [ ] Add safe filename wrapping and compact upload states.
- [ ] Replace native `confirm` delete with app dialog/sheet if possible.

### Acceptance criteria

- [ ] `scrollWidth <= clientWidth` at 320 px.
- [ ] Domain cards do not clip labels.
- [ ] File upload and error state are usable with touch.
- [ ] Desktop layout remains unchanged.

## Page: Interview History

### Route

`/history`

### Purpose

Searches, filters, sorts, opens, and deletes previous manual interview sessions.

### Current desktop structure

Page title, stat grid, filter bar, list of interview rows/cards.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| H-01 | Stats remain 3 columns at mobile and become low-information blocks. | Medium | 320 x 568 | `history-320x568-settled.png`, `InterviewHistory.tsx` lines 142-160 |
| H-02 | Search/filter/sort consume a large vertical block. | Medium | 320 x 568 | `InterviewHistory.tsx` lines 168-205 |
| H-03 | Delete icon is hover-revealed on desktop, weak discoverability on touch. | Medium | Source inspection | `InterviewHistory.tsx` lines 305-316 |

### Recommended mobile structure

Use a mobile list management pattern:

- One-line title plus count.
- Search field.
- "Filters" button opening bottom sheet for difficulty/sort.
- Compact stats as chips or 2-column grid.
- Interview rows as cards with visible overflow menu for delete.

### Relevant source files

- `src/app/pages/InterviewHistory.tsx`

### Implementation tasks

- [ ] Convert mobile stat grid to chips/cards.
- [ ] Move sort/difficulty into filter sheet or compact segmented controls.
- [ ] Make destructive actions visible via menu or swipe-free button.

### Acceptance criteria

- [ ] Search and filter are usable in first screen.
- [ ] Delete does not rely on hover.
- [ ] Empty state action remains visible.

## Page: Results

### Route

`/results/:id`

### Purpose

Shows manual interview score, charts, insights, and answer-level feedback.

### Current desktop structure

Header, large score hero, stat grid, tabs, charts, insights, answer accordion.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| R-01 | Large score hero (`text-7xl`, `p-8`) likely dominates phone viewport. | Medium | Source inspection | `Results.tsx` lines 247-253 |
| R-02 | Charts use fixed 220 px heights with desktop labels. | Medium | Source inspection | `Results.tsx` lines 327-364 |
| R-03 | Tab row and answer accordions need mobile wrapping rules. | Medium | Source inspection | `Results.tsx` lines 303-320, 395-420 |

### Recommended mobile structure

1. Compact score summary with score, level, and two supporting stats.
2. Details in tabs or accordions with sticky tab labels.
3. Chart cards with summaries.
4. Answer feedback accordion with one-column layout.

### Relevant source files

- `src/app/pages/Results.tsx`

### Implementation tasks

- [ ] Reduce score hero scale on mobile.
- [ ] Add chart summaries and mobile chart label rules.
- [ ] Make tabs horizontally scrollable or stacked segmented controls.

### Acceptance criteria

- [ ] Result summary is readable without zooming at 320 px.
- [ ] Answer cards do not clip score badges.
- [ ] Desktop charts unchanged.

## Page: Leaderboard

### Route

`/leaderboard`

### Purpose

Shows user ranking, top performers, and all rankings.

### Current desktop structure

Heading with refresh, ranking hero, top performers podium/list hybrid, all rankings list.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| L-01 | Loading state can occupy first mobile view; ensure skeleton shape matches final layout. | Low | `leaderboard-320x568-settled.png` | `Leaderboard.tsx` lines 106-117 |
| L-02 | Ranking stats use 3 columns; acceptable but tight with long labels/large values. | Medium | Source inspection | `Leaderboard.tsx` lines 121-146 |

### Recommended mobile structure

Keep current mobile list approach but ensure:

- Refresh button is 44 px tall.
- Ranking stats can wrap or become 2 + 1 layout at 320 px.
- All rankings use compact row cards.

### Relevant source files

- `src/app/pages/Leaderboard.tsx`

### Implementation tasks

- [ ] Add loading skeleton matching mobile ranking cards.
- [ ] Verify long names/emails break safely.
- [ ] Add accessible labels to rank badges.

### Acceptance criteria

- [ ] No clipped ranking values at 320 px.
- [ ] Refresh remains reachable.

## Page: Candidates

### Route

`/candidates`

### Purpose

Browse public candidate profiles and view profile details.

### Current desktop structure

Hero, search, candidate card grid, centered profile modal.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| C-01 | Profile modal is a centered desktop dialog with dense 3-column stats. | Medium | 320 x 568 | `candidate-profile-modal-320x568.png` |
| C-02 | Candidate cards truncate names/job titles aggressively. | Medium | 320 px | `Candidates.tsx` lines 363-382 |

### Recommended mobile structure

Candidate cards should remain one column, but modal should become:

- Full-screen sheet or bottom sheet.
- Sticky header with avatar/name/close.
- Single-column detail sections.
- Stats can be 3 compact chips only if labels fit; otherwise 1-column list.
- External links remain visible and touch-friendly.

### Relevant source files

- `src/app/pages/Candidates.tsx`

### Implementation tasks

- [ ] Convert `ProfileModal` to responsive sheet/full-screen pattern.
- [ ] Add long-content examples in testing.
- [ ] Increase close button hit area to 44 px.

### Acceptance criteria

- [ ] Candidate details are readable at 320 px.
- [ ] Modal content scrolls internally without page scroll bleed.
- [ ] Close is always visible.

## Page: Profile

### Route

`/profile`

### Purpose

Edit profile, security/password, and review stats.

### Current desktop structure

Profile hero, tab panel, forms, avatar upload, stats/charts.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| P-01 | Tab bar clips Statistics at 320 px. | High | 320 x 568 | `profile-tabs-scrolled-320x568.png` |
| P-02 | Header stat strip is dense under user profile card. | Medium | 320 px | `profile-320x568-settled.png` |
| P-03 | Avatar upload camera button is only 28 px. | Medium | Source inspection | `Profile.tsx` lines 465-470 |

### Recommended mobile structure

1. Compact profile hero.
2. Profile stats as chips or 2-column grid.
3. Replace tabs with segmented control that scrolls horizontally, dropdown, or stacked nav list.
4. Forms single-column with 44 px controls.
5. Avatar upload actions stacked and full-width.

### Relevant source files

- `src/app/pages/Profile.tsx`

### Implementation tasks

- [ ] Fix tab overflow first.
- [ ] Increase camera/edit touch target.
- [ ] Audit every form field for keyboard type/autofill.
- [ ] Add mobile chart/card alternatives for stats.

### Acceptance criteria

- [ ] All tabs are reachable and readable at 320 px.
- [ ] Profile save action is visible and usable.
- [ ] Avatar upload/remove controls meet touch target guidance.

## Page: Admin Panel

### Route

`/admin`

### Purpose

Manage users and monitor platform activity.

### Current desktop structure

Admin analytics, charts, user management, admin-only actions.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| A-01 | Current live account/request redirected `/admin` to `/dashboard`, so admin UI was not visually inspected live. | Low | 320-932 | `live-route-audit-settled.json` |
| A-02 | Source includes charts and user management controls that likely need stacked/mobile table patterns. | Medium | Source inspection | `src/app/pages/AdminPanel.tsx` |

### Recommended mobile structure

Audit with a verified admin session before implementing. Expected pattern: overview cards, chart summaries, user list cards, destructive role/delete actions behind confirmations.

### Relevant source files

- `src/app/pages/AdminPanel.tsx`
- `src/app/components/ProtectedRoute.tsx`

### Implementation tasks

- [ ] Confirm admin access/session.
- [ ] Apply shared chart/list/dialog rules.
- [ ] Make admin destructive actions explicit and touch-friendly.

### Acceptance criteria

- [ ] Admin can complete user management at 320 px.
- [ ] No table requires page-level horizontal scroll.

## Page: Login and Signup

### Route

`/login`, `/signup`

### Purpose

Public authentication using Google OAuth and related account entry flows.

### Current mobile problems

| ID | Issue | Severity | Viewport | Evidence |
|---|---|---|---|---|
| AUTH-01 | Not inspected deeply because authenticated session was already active and task focused authenticated app. | Low | N/A | Source route inventory |

### Recommended mobile structure

Keep Google OAuth button full-width and 44-48 px tall. Terms modal should use the same mobile dialog/sheet behavior as other dialogs.

### Relevant source files

- `src/app/pages/Login.tsx`
- `src/app/pages/Signup.tsx`
- `src/app/components/GoogleAuthButton.tsx`
- `src/app/components/TermsModal.tsx`

### Implementation tasks

- [ ] Verify logged-out mobile flow in a separate non-destructive session.
- [ ] Apply shared dialog/sheet rules to terms.

### Acceptance criteria

- [ ] OAuth button is visible without zooming.
- [ ] Terms content scrolls internally and close/action remains visible.

## 10. Shared Component Implementation Map

| Component | File path | Used by | Current issue | Required mobile change | Risk | Priority |
|---|---|---|---|---|---|---|
| App shell/header/nav | `src/app/components/Navbar.tsx` | All authenticated pages | Drawer is ungrouped and overflows at 320 px | Drawer/sheet or bottom nav + more menu; 44 px icon targets | Medium | P0 |
| Toast provider | `src/app/App.tsx` | All pages | Top-right desktop position | Mobile-aware toast placement | Low | P1 |
| Dashboard cards/charts | `src/app/pages/Dashboard.tsx` | Dashboard | Tall opening, chart density | Compact hero, action-first mobile, chart summaries | Medium | P0 |
| Manual setup | `src/app/pages/ManualMode.tsx` | Manual workflow | Setup below hero | Move setup up, compact domain cards | Medium | P0 |
| AI setup | `src/app/modules/aiMode/AIInterviewPage.tsx` | AI workflow | Upload below feature hero | Upload-first mobile, collapsed camera | Medium | P0 |
| AI focused shell | `src/app/modules/aiMode/components/ImmersiveInterviewShell.tsx` | AI interview | Dense editor/camera controls | Keyboard-safe editor and collapsed aside | High | P1 |
| Resume analysis | `src/app/pages/ResumeAnalysis.tsx` | Resume workflow | 320 px overflow | Fix grids/widths and upload/domain layout | Medium | P0 |
| Profile tabs/forms | `src/app/pages/Profile.tsx` | Profile | Tab clipping and small avatar action | Responsive tab pattern, touch target fixes | Medium | P0 |
| History filters/list | `src/app/pages/InterviewHistory.tsx` | History | Filter block and hover delete | Filter sheet/compact controls, visible actions | Medium | P1 |
| Candidate modal | `src/app/pages/Candidates.tsx` | Candidates | Desktop modal on phone | Responsive sheet/full-screen detail | Medium | P1 |
| Results charts/tabs | `src/app/pages/Results.tsx` | Results | Large score hero/charts | Compact result summary and chart summaries | Medium | P1 |
| Manual interview composer | `src/app/pages/Interview.tsx` | Manual interview | Needs keyboard-safe layout | Fixed/sticky composer with safe area | High | P1 |
| Leaderboard ranking cards | `src/app/pages/Leaderboard.tsx` | Leaderboard | Tight stat columns | Wrap-safe stat layout | Low | P2 |
| Admin charts/user actions | `src/app/pages/AdminPanel.tsx` | Admin | Not live-audited | Apply shared table/chart/card patterns | Medium | P2 |
| Generic table | `src/app/components/ui/table.tsx` | Future/table pages | Only horizontal auto-scroll | Add stacked/card table pattern where used | Low | P2 |
| Dialog primitive | `src/app/components/ui/dialog.tsx` | Dialog users | Desktop-centered defaults | Responsive sheet/full-screen variants | Medium | P1 |

## 11. Responsive Styling Strategy

Use progressive responsive enhancement inside existing components. Do not create duplicated mobile pages.

Current:

`grid grid-cols-2 md:grid-cols-4 gap-4`

Recommended for Resume Analysis stats:

`grid grid-cols-1 gap-3 xs:grid-cols-2 md:grid-cols-4 md:gap-4`

If no `xs` breakpoint exists, use:

`grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4`

Reason:

The current 2-column default contributes to 320 px crowding and confirmed overflow.

Current:

`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`

Recommended for Resume Analysis domain cards:

`grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5`

Reason:

Long domain names fit better as list rows at 320 px.

Current:

`grid w-full grid-cols-1 ... sm:min-w-[320px] sm:grid-cols-3`

Recommended for Manual Mode stat strip:

`hidden sm:grid ...` or `grid grid-cols-3 gap-1.5 text-xs` only after setup is visible.

Reason:

The stats are not the primary task on phone.

Current:

`<ResponsiveContainer width="100%" height={260}>`

Recommended:

Use mobile-specific heights and label rules:

- 200-220 px line/bar charts on 320-390 px.
- Hide or abbreviate repeated axis labels.
- Add text summary above the chart.
- Keep 260 px at `sm`/desktop when appropriate.

Overflow ownership:

- Page should never scroll horizontally.
- Tables/lists that truly need horizontal movement should own it inside a clearly framed container.
- Prefer stacked row cards for rankings/history/admin data.

Viewport units:

- Keep `100svh` in `ImmersiveInterviewShell`.
- Use `100dvh` or `min-h-dvh` only for app/interview shells and fixed mobile drawers.
- Do not replace ordinary content pages' `min-h-screen` unless browser chrome causes confirmed hidden controls.

Container query opportunities:

- Dashboard stat cards and charts.
- Candidate cards.
- Profile tab panel.
- Resume analysis result cards.

## 12. Accessibility Requirements

Global:

- 44-48 px practical touch targets for icon buttons, tabs, close buttons, upload buttons, mic controls, delete controls.
- Do not disable browser zoom.
- Focus states must remain visible in light and dark themes.
- Dialogs/sheets must trap focus and restore focus on close.
- Drawer close should be reachable by keyboard and screen reader.
- Use `aria-pressed` for toggle chips and selected domain/question count/difficulty where applicable.
- Add semantic labels to icon-only buttons: voice, theme, menu, close, mic, delete.
- Error messages should be associated with fields where practical.
- Charts need text summaries so data is not conveyed only through SVG/color.
- Reduced-motion should disable hover/scale-heavy transitions on mobile if user prefers reduced motion.

Page-specific:

- Manual domain cards should communicate selected state.
- AI camera/mic permission state should be announced.
- Interview progress should be readable by screen readers.
- Profile tabs need semantic tablist behavior or a clear alternative.
- Destructive actions need explicit confirmation and accessible labels.

## 13. Mobile Performance Recommendations

Observed performance risks:

- Recharts appears in several major routes; defer or summarize charts on mobile when below the fold.
- AI Mode imports PDF/resume extraction and AI services; keep lazy loading around AI mode.
- Dashboard loads manual interviews, AI sessions, and resumes together. Preserve parallel load, but ensure mobile loading skeletons are compact.
- Large gradients and shadows are frequent. Reduce mobile shadow intensity to improve perceived performance.
- File upload/resume parsing should show progress and error states near the upload control.

Recommendations:

- Keep route lazy loading for AI session detail and AI mode.
- Add chart summary cards before rendering heavy charts if data exists.
- Avoid rendering offscreen chart-heavy sections until route data is ready.
- Use image dimensions for logo/avatar assets to prevent layout shifts.
- Keep camera stream initialization user-initiated; do not request camera just because the AI setup page opens.

## 14. Prioritized Implementation Roadmap

### Phase A: Critical mobile foundation

| Task | Files | Dependencies | Complexity | Risk | Validation |
|---|---|---|---|---|---|
| P0: Replace mobile nav dropdown with grouped drawer/sheet and fix 320 px overflow | `Navbar.tsx` | None | Large | Medium | 320/360 drawer screenshot, route navigation, sign-out dialog |
| P0: Add shared mobile page spacing rules | Page components | Nav decision | Medium | Medium | 320/390 smoke across all routes |
| P0: Fix Resume Analysis horizontal overflow | `ResumeAnalysis.tsx` | None | Medium | Medium | `scrollWidth <= clientWidth` at 320 |
| P0: Fix Profile tab overflow | `Profile.tsx` | None | Medium | Medium | All tabs visible/reachable at 320 |
| P0: Reprioritize dashboard/manual/AI first-fold actions | `Dashboard.tsx`, `ManualMode.tsx`, `AIInterviewPage.tsx` | Shell spacing | Large | Medium | First viewport contains primary action at 320 |

### Phase B: Core workflows

| Task | Files | Dependencies | Complexity | Risk | Validation |
|---|---|---|---|---|---|
| P1: Mobile Manual interview composer | `Interview.tsx` | Shell rules | Medium | High | Complete 5-question session at 320 |
| P1: Mobile AI focused interview shell | `ImmersiveInterviewShell.tsx`, `AIInterviewPage.tsx` | Shell rules | Large | High | Keyboard, mic, camera collapsed, submit at 320/390 |
| P1: Mobile upload/file states | `ResumeAnalysis.tsx`, `AIInterviewPage.tsx`, `Profile.tsx` | Overflow fixes | Medium | Medium | Upload controls and errors wrap safely |
| P1: Results mobile summary and charts | `Results.tsx` | Chart strategy | Medium | Medium | Existing result opens/readable at 320 |

### Phase C: Secondary pages

| Task | Files | Dependencies | Complexity | Risk | Validation |
|---|---|---|---|---|---|
| P2: History filter sheet/list actions | `InterviewHistory.tsx` | Dialog/sheet pattern | Medium | Medium | Search/filter/delete usable by touch |
| P2: Candidate profile sheet | `Candidates.tsx` | Dialog/sheet pattern | Medium | Medium | Candidate details readable at 320 |
| P2: Leaderboard polish | `Leaderboard.tsx` | Shell spacing | Small | Low | Long names and stats wrap |
| P2: Admin mobile audit/fix | `AdminPanel.tsx` | Admin session | Medium | Medium | Admin route inspected with admin access |

### Phase D: Accessibility and polish

| Task | Files | Dependencies | Complexity | Risk | Validation |
|---|---|---|---|---|---|
| P3: Chart summaries | Dashboard, Results, Profile, AI analytics, Admin | Chart inventory | Medium | Low | Screen-reader summaries present |
| P3: Reduced motion and shadow simplification | Global/page classes | Core layout | Small | Low | Prefers-reduced-motion check |
| P3: Toast placement | `App.tsx` | Nav/bottom action decision | Small | Low | Toast does not cover controls |
| P3: Visual regression viewport suite | Test setup | Implementation done | Medium | Low | 320/360/390/412/768/1024 smoke |

## 15. Responsive Testing Matrix

Required viewport checks:

| Width/Size | Purpose | Pages |
|---|---|---|
| 320 x 568 | Narrow stress test | All authenticated pages, drawer, dialogs |
| 360 x 800 | Common Android | Core workflows |
| 375 x 812 | Compact iPhone | Core workflows |
| 390 x 844 | Modern iPhone | Core workflows |
| 412 x 915 | Larger Android | Core workflows |
| 430 x 932 | Large phone | Core workflows |
| 844 x 390 | Landscape phone | Interview, AI interview, drawer |
| 932 x 430 | Landscape large phone | Dashboard, setup pages |
| 768 x 1024 | Tablet portrait | Dashboard, Manual, AI, Resume, Profile |
| 1024 x 768 | Tablet landscape / desktop boundary | All shared shell behavior |
| 1280+ | Desktop regression | All pages touched |

Required interaction checks:

- Mobile drawer open/close/navigation.
- Sign-out dialog cancel only.
- Dashboard quick actions.
- Manual difficulty/count/category/domain selection.
- Manual interview composer with keyboard.
- AI resume upload state, difficulty/count, camera collapsed state.
- AI focused shell keyboard/mic/camera collapse/end dialog.
- Resume domain search and upload error.
- History search/filter/sort.
- Profile tabs/forms/avatar controls.
- Candidate modal/sheet open/close.
- Results answer accordion and chart sections.
- Toasts with fixed/sticky controls.

Automated testing recommendations:

- The repo currently has no test script beyond `validate:manual-questions`.
- Add Playwright route smoke tests only if the team accepts a new dev dependency; otherwise use manual browser viewport QA first.
- Minimal future Playwright coverage should check `document.documentElement.scrollWidth <= document.documentElement.clientWidth` for primary routes at 320, 360, 390, 768, and 1024.
- Add accessibility checks only after choosing a compatible stack; avoid adding multiple new tools at once.

## 16. Risks and Desktop-Regression Prevention

| Risk | Prevention |
|---|---|
| Desktop layout changes accidentally | Use mobile-first defaults only where current mobile is broken, then restore existing `sm`/`md`/`lg`/`xl` classes. Screenshot desktop at 1280+ before and after. |
| Business logic/auth changes | Do not touch `AuthContext`, Supabase services, route guards, APIs, schemas, or data flow for UI-only fixes. |
| Duplicated mobile pages | Keep one route/component per page; add responsive variants inside components. |
| Chart changes reduce desktop analytics | Gate chart label/height changes to mobile breakpoints. |
| Drawer/bottom nav hides actions | Add safe-area padding and content bottom padding. |
| Interview keyboard issues | Test on real mobile browsers or responsive mode with keyboard simulation where possible. |
| Admin route remains unaudited | Verify admin access before editing AdminPanel mobile behavior. |

## 17. Global Acceptance Criteria

- [ ] No page-level horizontal scrolling at supported mobile widths.
- [ ] All primary workflows are completable using touch input.
- [ ] No essential controls are hidden behind fixed elements.
- [ ] Mobile navigation is consistent across authenticated pages.
- [ ] Mobile keyboard does not block required actions.
- [ ] Dialogs and menus remain within the viewport.
- [ ] Tables and charts remain understandable.
- [ ] Tap targets are practical for mobile use.
- [ ] Text remains readable without zooming.
- [ ] Loading and error states are usable on narrow screens.
- [ ] Portrait and landscape layouts remain functional.
- [ ] Existing desktop behaviour remains unchanged.
- [ ] Authentication and application business logic remain unchanged.
- [ ] No duplicated mobile-only page architecture unless strictly necessary.
- [ ] Accessibility requirements are documented for each important workflow.

## 18. Final Implementation Checklist

- [ ] Confirm baseline screenshots for 320, 360, 390, 768, 1024, and 1280.
- [ ] Implement navigation/shell foundation first.
- [ ] Fix Resume Analysis overflow.
- [ ] Fix Profile tabs.
- [ ] Reorder Dashboard, Manual Mode, and AI Mode mobile first-fold content.
- [ ] Update interview shells for keyboard-safe mobile use.
- [ ] Convert dense dialogs to sheets/full-screen mobile details.
- [ ] Add chart summaries and label rules.
- [ ] Verify all upload flows and file-name wrapping.
- [ ] Verify all destructive actions require confirmation.
- [ ] Run `npm run build`.
- [ ] Perform live responsive smoke test on production or preview URL.
- [ ] Confirm no desktop regressions at 1280 px and above.
