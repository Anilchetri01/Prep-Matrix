# PrepMatrix visual rebrand report

**Audit date:** 14 September 2026  
**Audited build:** `https://prepmatrix.vercel.app` (signed-in experience)  
**Viewport reviewed:** desktop, 1537 × 742  
**Scope:** Dashboard; Manual Mode; AI Mode; Resume Analysis; History; Leaderboard; Candidates; Profile (Profile, Security, and Statistics); dark and light themes.

## Executive recommendation

Give PrepMatrix one visual language: **Midnight Signal**. It should feel like a focused, credible career-performance product—calm dark navy, a single electric indigo action color, cyan reserved for AI/intelligence, and semantic colours only when the data calls for them. The current dark foundation is promising, but it competes with broad purple/magenta hero gradients, a rainbow of icon colours, and several card styles. The result feels more like a collection of feature pages than one product.

Keep the dark theme as the default. It is the more distinctive and more comfortable environment for long interview practice. Make light mode a first-class, equally quiet alternative rather than a white version of the current rainbow system.

## What is working now

- The signed-in navigation is consistent across the reviewed routes and makes the product’s main jobs easy to find.
- The dark navy canvas and high-contrast headings already suggest a serious, technology-led product.
- The dashboard has a sensible information architecture: action area, status cards, then analytics.
- Manual Mode and AI Mode have the clearest visual hierarchy. Their restrained dark panels are stronger than the saturated purple banner pattern used elsewhere.
- Empty states are clear and actionable; they should remain part of the system.

## Main visual problems to solve

### 1. Too many competing accents

Indigo, violet, magenta, cyan, blue, green, orange, yellow, red, and lime all appear as default decoration—particularly in dashboard metric icons, avatar choices, and leaderboard treatments. Colour stops communicating meaning when every card is colourful.

**Change:** one brand/action accent, one AI accent, and semantic success/warning/danger colours. Neutral metric cards should normally have a neutral or brand-tinted icon, not a different colour each time.

### 2. Purple gradients are acting as page identity

Resume Analysis, Candidates, and Profile use large, bright purple-to-magenta banners while Dashboard, Manual Mode, AI Mode, History, and Leaderboard use quieter dark sections. This is the strongest inconsistency in the app.

**Change:** remove the full-strength gradient banners. Use a shared page header with a very subtle indigo radial glow at most. A gradient should be a rare brand moment—on the login background or one flagship empty-state illustration—not a container fill.

### 3. Card density and elevation are too uniform

Almost every item is a rounded, bordered dark card: dashboard metrics, domains, feature cards, statistics, candidate cards, controls, and page shells. The repeated treatment makes priority unclear and makes Manual/Resume domain selection feel visually heavy.

**Change:** define three surfaces only: canvas, standard surface, and raised/interactive surface. Use borders sparingly, reserve stronger elevation for active choices and primary workflow blocks, and let tables/lists use dividers rather than a separate card for every row.

### 4. Typography has little role distinction

The current site overwhelmingly uses Inter. It is readable and should remain for UI/body text, but large headings, labels, numbers, and metadata are too close in personality. Many uppercase tracked labels compete with body copy, while some headings are long enough to feel oversized in the dashboard hero.

**Change:** pair a more expressive but professional display face with Inter; tighten the type scale and use uppercase labels only for small metadata.

### 5. Data views look decorative before they look analytical

The podium’s saturated gold/silver/bronze blocks and colourful metric icons pull focus even when scores and data are the actual content. The dashboard’s empty charts also consume substantial visual weight before the user has any data.

**Change:** make scores, trends, and rank the visual focal point. Use indigo/cyan for data series and one semantic highlight for the top performer. Give zero-data charts a lower-contrast placeholder treatment and put the next action near them.

## Proposed design system: Midnight Signal

### Colour roles

Use the role names in code; do not scatter raw hex values through page components.

| Role | Dark | Light | Intended use |
|---|---:|---:|---|
| Canvas | `#070B14` | `#F7F8FC` | App background |
| Surface | `#101827` | `#FFFFFF` | Panels, nav, cards |
| Surface raised | `#172235` | `#F1F4F8` | Hovered/selected cards, input fills |
| Border | `#263449` | `#DDE3EC` | Dividers and control outlines |
| Text primary | `#F4F7FB` | `#142033` | Headings and key values |
| Text secondary | `#AAB7CA` | `#5F6F84` | Body, metadata |
| Text muted | `#718096` | `#7F8CA0` | Hints, disabled text |
| Brand / action | `#6D5EF9` | `#5B4BE7` | Primary buttons, selected nav, links |
| Brand hover | `#8174FF` | `#4A3AD1` | Hover/pressed primary controls |
| Brand subtle | `#1D1B49` | `#EEECFF` | Selection fills, low-priority emphasis |
| AI / insight | `#22D3EE` | `#0891B2` | AI mode, intelligent insights, secondary data series |
| Success | `#34D399` | `#059669` | Positive score movement, completion |
| Warning | `#FBBF24` | `#B45309` | Needs attention, not rank decoration |
| Danger | `#FB7185` | `#E11D48` | Errors, destructive actions, low-score alerts |

### Colour rules

1. Use `Brand / action` for all primary CTAs—never purple on one page and blue on another.
2. Use `AI / insight` only for AI-specific content and a secondary chart series. It should not decorate ordinary cards.
3. Use success, warning, and danger only for state. Do not use them to differentiate dashboard metrics or avatars.
4. Retire broad purple/magenta container gradients. If a glow is needed, use `#6D5EF9` at 8–12% opacity over the canvas.
5. Keep text/background combinations at WCAG AA contrast at minimum; body copy should not use the muted token on a raised dark surface if it becomes hard to read.

### Typography

**Recommended pairing**

- **Headings/display:** `Manrope`, 600–800. It brings confident, contemporary character without the sci-fi feel that would undermine career credibility.
- **UI and body:** `Inter`, 400–700. It is already loaded, familiar at small sizes, and works well for controls, forms, table values, and prose.
- **Optional data/code:** `JetBrains Mono`, 500–600, only for compact scores, timestamps, and technical tags—not normal UI copy.

| Role | Font | Size / line height | Weight | Notes |
|---|---|---|---:|---|
| Page title | Manrope | 32 / 40 desktop; 28 / 36 mobile | 700 | Keep to two lines maximum |
| Section title | Manrope | 22 / 30 | 700 | Use once per major block |
| Card title | Manrope | 16 / 24 | 700 | Avoid all caps |
| Body | Inter | 15 / 24 | 400 | Default explanatory copy |
| Supporting text | Inter | 13 / 20 | 400–500 | Metadata and helper copy |
| Button / nav | Inter | 14 / 20 | 600 | Sentence case, no letter spacing |
| Eyebrow label | Inter | 11 / 16 | 700 | Uppercase only here; `0.10em` tracking |
| Key metric | Manrope | 28 / 32 | 750 | Align values and labels consistently |

Use a 4 px spacing base and an 8 px type/space rhythm. Limit headline widths to roughly 22–28 characters where possible; the Dashboard title can be shortened to “Your career preparation command center” without losing the message.

## Component direction

### Navigation

- Keep the dark, persistent top nav, but reduce visual competition: active item = `Brand subtle` fill plus a 2 px indigo indicator; inactive items use secondary text.
- Collapse the label/icon layout cleanly at smaller widths instead of allowing eight routes to compete for one row.
- Reserve the user avatar colour for identity, not status; avoid making every avatar another product accent.

### Headers and heroes

- Use a shared header pattern: eyebrow (optional), page title, one-line explanation, and one relevant primary action.
- Replace the Resume/Candidates/Profile gradient banners with `Surface` plus a very low-opacity indigo glow in one corner.
- Do not pair a huge title with four equally weighted CTAs. On Dashboard, make “Start AI interview” primary and “Start manual interview” secondary; move resume and continuation into a smaller quick-actions row.

### Cards, selections, and forms

- Standard cards: 14 px radius, 1 px border, no default shadow in dark mode. Use a modest shadow only in light mode or in overlays.
- Interactive cards: use a 2 px brand border and `Brand subtle` background when selected; on hover, brighten the border and surface slightly rather than changing hue.
- Domain selection needs a denser list/grid treatment. Replace every full card with a list tile that has initials, role name, and a short skill line; reserve large cards for the selected domain or featured paths.
- Inputs should use `Surface raised`, a persistent label, 44 px minimum height, and a clear indigo focus ring. The current long form rows can be organized into two-column groups on desktop.

### Metrics, charts, and leaderboard

- Make all dashboard metric icon tiles brand-tinted by default; semantic colour appears only when a metric is positive, cautionary, or negative.
- Use one chart palette: primary series indigo, AI series cyan, supporting comparison slate. Keep grids and axes subdued.
- Redesign the podium as ranked people first, objects second: typography and score lead; medal colour is a small badge/accent. Avoid large gold/orange/red blocks.
- Put empty-state CTA next to the explanation and reduce the surrounding chart container height until there is data.

### Motion and micro-interaction

- 160–200 ms ease-out for hover, focus, and selection; 240 ms for drawers/dialogs. Avoid perpetual glow, pulse, or gradient animation.
- Focus ring: 2 px `#8174FF` with a 2 px canvas offset. It must be visible in both themes.
- Use a small success check and text confirmation after completed work; avoid a rainbow toast system.

## Screen-specific priorities

| Screen | Keep | Change first |
|---|---|---|
| Dashboard | Clear hero and workflow entry points | Establish CTA hierarchy; neutralize rainbow metrics; reduce empty analytics weight |
| Manual Mode | Strongest dark card composition | Convert the 97-domain grid to lighter list tiles; make selection state unmistakable |
| AI Mode | Calm, purposeful narrative | Reinforce cyan only for AI concepts; make camera/upload setup less panel-dense |
| Resume Analysis | Useful search-and-select flow | Remove full purple banner; use a consistent page header and compact domain picker |
| History | Clear filters and empty state | Bring filter controls and stats into one restrained utility band |
| Leaderboard | Understandable ranking structure | Replace decorative podium blocks with data-led rank cards and one medal accent |
| Candidates | Search plus comparison works | Remove purple banner; reduce each card’s button prominence and visual padding |
| Profile | Logical tabs and editable information | Remove purple banner; group fields, lower visual noise of avatar colour choices |

## Implementation order

1. Introduce semantic design tokens (dark and light) and replace page-level raw colours.
2. Add Manrope for heading roles while retaining Inter for UI/body; implement the type scale.
3. Standardize the shared shell: nav, page header, surfaces, borders, controls, focus ring, buttons, and status colours.
4. Rebuild Dashboard, Resume Analysis, Candidates, and Profile around the shared header and metric/card rules.
5. Simplify domain selection, leaderboard, charts, and zero-data states.
6. Validate desktop and mobile screenshots in both themes, then run a contrast and keyboard-focus pass.

## Acceptance checks

- A user can identify the primary action on every screen within one glance.
- Purple/indigo is the only default product accent; cyan and semantic colours have defined, limited meanings.
- Every top-level page uses the same header, surface, form, and button grammar.
- Body text, labels, and focus indicators meet WCAG AA contrast in dark and light themes.
- The dashboard, leaderboard, and candidates screens still feel coherent when populated with real data—not just their empty states.

## Audit limitations

This was a live visual audit of the signed-in, top-level routes and visible profile tabs. I did not start an interview, upload a resume, edit profile data, send the contact form, or change a password, so populated interview results, upload flows, and mutation-confirmation states were intentionally not exercised.
