# PrepMatrix Navbar + Settings Menu Redesign Prompt

## Project Context

Update the existing **PrepMatrix** application navbar and navigation/menu architecture.

The current mobile navbar shows:
- PrepMatrix logo on the left.
- Voice/speaker icon near the right.
- Theme/moon toggle near the right.
- Hamburger menu on the far right.

The dashboard currently has a clean, modern, rounded-card visual language with a white/light background, subtle borders/shadows, dark navy typography, and purple/blue accent colors.

The goal is to make the navbar more structured and app-like while keeping the existing visual identity intact.

---

# 1. Navbar Layout Changes

### Required new order

On mobile, change the navbar layout to:

**[Hamburger] [PrepMatrix Logo] [PrepMatrix]**

The hamburger icon must be the **left-most element**, followed by the logo, followed immediately by the application name **“PrepMatrix”**.

The right side of the navbar should no longer contain the standalone voice and theme controls.

### Target layout

```text
┌──────────────────────────────────────────────────────────────┐
│ ☰   [PrepMatrix Logo]  PrepMatrix                            │
└──────────────────────────────────────────────────────────────┘
```

### Hamburger

Move the hamburger button from the right side to the far-left side.

Requirements:
- Use the application's existing icon library if one is already installed.
- Keep the current hamburger icon style where possible.
- Ensure the tap/click target is at least approximately 44×44 px.
- Keep sufficient left padding so the icon does not touch the viewport edge.
- The button must remain accessible.
- Add an appropriate `aria-label`, such as `Open navigation menu`.
- When the menu is open, the hamburger can transition into a close/X icon if this behavior fits the existing navigation implementation.

### Logo

Keep the existing PrepMatrix logo without changing its branding or artwork.

Place it directly after the hamburger button.

Requirements:
- Preserve the current logo proportions.
- Do not stretch or distort the logo.
- Keep the logo visually aligned with the hamburger and application name.
- Use the existing logo asset from the project rather than introducing a duplicate asset.

### Application name

Add the text:

**PrepMatrix**

Place it immediately after the logo.

Requirements:
- Use the same general typography system as the application.
- Make the app name clearly visible but not larger than the main dashboard heading.
- Use a semibold/bold weight appropriate for a product name.
- Keep spacing between logo and text visually balanced.
- Vertically center the entire left-side group.

Suggested structure:

```jsx
<div className="navbar-brand-group">
  <button aria-label="Open navigation menu">
    <MenuIcon />
  </button>

  <img src="/existing-prepmatrix-logo..." alt="PrepMatrix" />

  <span>PrepMatrix</span>
</div>
```

Adapt this structure to the project's existing component architecture rather than blindly copying it.

---

# 2. Remove Standalone Settings Controls From Navbar

The existing navbar currently exposes controls such as:

- Voice / speaker toggle
- Theme / dark-mode toggle
- Other utility controls that are currently directly visible in the navbar

Move these controls out of the navbar.

The navbar should remain visually clean and primarily provide:

```text
Hamburger → Logo → PrepMatrix
```

Do not simply delete the functionality.

All existing functionality must continue to work, but it should now be accessed through the new **Settings** section.

---

# 3. Add a "Settings" Section to the Menu

Add a new navigation item/section called:

**Settings**

The Settings section should be accessible from the hamburger menu.

Example:

```text
MENU

Dashboard
Start Interview
Resume Analysis
Previous Sessions
Profile
Settings
```

Use the application's existing icon set and visual conventions.

Recommended icon:
- Gear/settings icon.

Do not introduce a completely different icon style from the rest of the application.

---

# 4. Create a Dedicated Settings Screen / Section

When the user taps **Settings**, open a dedicated Settings page, screen, drawer section, or modal depending on the application's existing routing/navigation architecture.

Prefer a dedicated page/section if the application already uses route-based screens.

The Settings page should feel like a first-class part of PrepMatrix rather than an afterthought.

Suggested structure:

```text
Settings

Preferences
────────────────────────────

Voice & Audio
Theme & Appearance
Notifications
Interview Preferences
Accessibility
Account

```

Only include settings that are actually supported by the application. Do not create fake controls or settings that have no underlying functionality.

---

# 5. Move Voice Settings Into Settings

Move the existing voice/audio control into:

**Settings → Voice & Audio**

Potential controls may include the existing functionality, such as:

### Voice
- Enable/disable voice
- Voice playback preference
- Question reading aloud
- Answer/interaction audio behavior

Only expose controls that are already supported by the application.

Do not break the existing voice functionality.

### Important behavior

The user's existing voice preference must persist after navigating away from Settings.

Use the application's existing state-management/persistence system.

Do not introduce a second, conflicting state source.

For example, if the application currently uses Context API, continue using the existing context architecture.

---

# 6. Move Theme Toggle Into Settings

Move the current theme toggle into:

**Settings → Theme & Appearance**

The existing theme functionality must continue working exactly as before.

Possible presentation:

```text
Theme & Appearance

Appearance
○ System
○ Light
○ Dark
```

Or, if the project currently supports only a simple toggle:

```text
Dark mode                         [ ON / OFF ]
```

Use whatever model matches the existing implementation.

### Important

Do not rebuild the theme system unless necessary.

Reuse:
- Existing theme state
- Existing theme provider/context
- Existing CSS variables
- Existing Tailwind classes
- Existing local persistence mechanism

The goal is to **relocate the control**, not unnecessarily rewrite the theme architecture.

---

# 7. Move Other Existing Navbar Utilities Into Settings

Inspect the existing navbar and application state to identify every utility setting currently exposed directly in the navbar.

Examples could include:
- Voice
- Theme
- Notification preferences
- Interview preferences
- Accessibility preferences
- Other user experience toggles

Move appropriate preference-type controls into Settings.

Do **not** move navigation actions that should remain in the main menu.

For example:

```text
Navigation
Dashboard
Interviews
Resume Analysis
History
Profile

Preferences
Settings
```

Use clear grouping so the menu remains understandable.

---

# 8. Menu Design

Improve the hamburger menu so it feels like a polished mobile navigation drawer.

Recommended structure:

```text
┌───────────────────────────────────┐
│ PrepMatrix                    ✕   │
├───────────────────────────────────┤
│                                   │
│  🏠 Dashboard                     │
│  ✨ AI Interview                  │
│  📋 Manual Interview              │
│  📄 Resume Analysis               │
│  🕘 Previous Sessions             │
│  👤 Profile                       │
│                                   │
│  ───────────────────────────────   │
│                                   │
│  ⚙ Settings                       │
│                                   │
│  🚪 Logout                        │
│                                   │
└───────────────────────────────────┘
```

Adapt this to the existing application's actual routes/features.

### Drawer behavior

The menu should:
- Slide in smoothly.
- Have a polished overlay/backdrop.
- Close when the user taps outside the drawer.
- Close when the close button is tapped.
- Close after navigation when appropriate.
- Prevent accidental background interaction while open.
- Preserve accessibility.
- Support keyboard navigation where applicable.

Do not introduce excessive animation.

Use subtle transitions consistent with the existing PrepMatrix design.

---

# 9. Mobile-First Responsive Behavior

The screenshot indicates that this is especially important on mobile.

Ensure the redesigned navbar works well at:

- 320px
- 360px
- 375px
- 390px
- 412px
- 430px
- Tablet widths
- Desktop widths

Avoid:
- Horizontal overflow
- Logo clipping
- App-name clipping
- Overlapping elements
- Excessive navbar height
- Tiny touch targets

The navbar should remain compact while providing enough spacing for comfortable interaction.

---

# 10. Desktop Behavior

Before changing desktop behavior, inspect the current PrepMatrix application architecture.

If the application already has a desktop sidebar/navigation system, keep that architecture where appropriate.

Do not force the mobile hamburger layout onto desktop unnecessarily.

Use responsive behavior such as:

### Mobile

```text
☰  Logo  PrepMatrix
```

### Desktop

Use the existing desktop navigation pattern, while ensuring that Settings is included in the navigation.

The exact desktop implementation should preserve the established design system.

---

# 11. Visual Design Requirements

Preserve the current PrepMatrix visual identity shown in the dashboard screenshot.

Maintain:
- Clean white/light surfaces
- Soft gray borders
- Rounded corners
- Subtle shadows
- Dark navy text
- Purple/blue primary accent
- Modern minimalist spacing
- Consistent iconography

Do not introduce:
- Excessive gradients
- Neon effects
- Unrelated colors
- Heavy glassmorphism
- Unnecessary decorative elements
- Oversized icons
- Excessive borders

The redesign should feel like the same product, only more polished and logically organized.

---

# 12. Typography

Follow the application's existing font stack.

For the navbar:

### App name
Suggested:
- Font weight: `600` or `700`
- Slightly larger than normal body text
- Strong enough to establish product identity

### Menu items
Suggested:
- Medium/semibold
- Comfortable line height
- Clear hierarchy

Do not introduce a new font unless the project already uses one.

---

# 13. Accessibility

Make the navbar and menu fully accessible.

Required:
- `aria-label` for hamburger button.
- Correct accessible name for Settings.
- Keyboard focus states.
- Visible focus indicators.
- Semantic navigation elements.
- Correct button/link semantics.
- Sufficient color contrast.
- Screen-reader-friendly labels.
- Escape key support for the open drawer where appropriate.

Do not rely solely on icons to communicate meaning.

---

# 14. State Management

Before implementing the changes, inspect how PrepMatrix currently manages:

- Theme state
- Voice state
- User preferences
- Authentication state
- Navigation state

Reuse the existing architecture.

If the project uses:
- React Context → continue using Context.
- Zustand → continue using Zustand.
- Redux → continue using Redux.
- Local component state → keep it only when appropriate.

Do not introduce unnecessary dependencies.

Do not duplicate state.

---

# 15. Persistence

Existing user preferences must remain persistent.

For example:

```text
User enables dark mode
        ↓
Navigate to Dashboard
        ↓
Close/reopen menu
        ↓
Preference remains enabled
```

Likewise:

```text
User disables voice
        ↓
Starts an interview
        ↓
Voice remains disabled
```

Use the application's existing persistence mechanism.

If persistence does not currently exist for a specific supported setting, implement it using the project's established storage/state strategy rather than adding unrelated infrastructure.

---

# 16. Navigation Integrity

Do not break existing routes.

Before editing:
1. Identify every navbar/menu route.
2. Identify all existing Settings-like functionality.
3. Identify the current theme implementation.
4. Identify the current voice implementation.
5. Identify where logout/profile actions are handled.
6. Identify mobile and desktop navigation components.

After editing:
- Verify every existing navigation item still works.
- Verify Settings opens correctly.
- Verify voice settings work.
- Verify theme settings work.
- Verify logout still works.
- Verify back navigation works.
- Verify protected routes remain protected.

---

# 17. Avoid Breaking Existing UI

This change is specifically a **navigation and settings architecture improvement**.

Do NOT unnecessarily redesign:
- Dashboard cards
- Interview cards
- Score cards
- Resume analysis interface
- Existing typography system
- Existing color palette
- Existing interview functionality
- Existing authentication screens

Only modify components directly affected by the navbar/menu/settings redesign.

---

# 18. Suggested Component Architecture

Use the project's existing architecture, but a clean implementation could resemble:

```text
src/
├── components/
│   ├── navbar/
│   │   ├── Navbar.tsx
│   │   ├── MobileMenu.tsx
│   │   └── NavItem.tsx
│   │
│   └── settings/
│       ├── SettingsLayout.tsx
│       ├── SettingItem.tsx
│       ├── VoiceSettings.tsx
│       └── AppearanceSettings.tsx
│
├── pages/
│   └── Settings.tsx
│
└── contexts/
    ├── ThemeContext.tsx
    └── ...
```

This is only a recommendation.

Follow the existing codebase conventions first.

---

# 19. Implementation Workflow

Follow this implementation sequence:

### Step 1 — Audit

Inspect the existing codebase and identify:
- Navbar component
- Mobile navbar
- Hamburger/menu implementation
- Theme implementation
- Voice implementation
- Navigation routes
- Existing settings/preferences
- State management
- Persistent storage

### Step 2 — Refactor Navbar

Change the mobile navbar to:

```text
Hamburger → Logo → PrepMatrix
```

Remove standalone voice/theme controls.

### Step 3 — Refactor Menu

Add:

```text
Settings
```

as a menu item.

### Step 4 — Build Settings UI

Create a dedicated Settings experience containing the existing preference controls.

### Step 5 — Connect Existing State

Connect the Settings controls to the existing theme/voice/state systems.

### Step 6 — Verify Persistence

Ensure settings remain active after navigation and page changes.

### Step 7 — Responsive QA

Test multiple mobile, tablet, and desktop sizes.

### Step 8 — Accessibility QA

Verify focus, keyboard navigation, semantics, labels, and contrast.

### Step 9 — Regression Testing

Make sure no existing PrepMatrix feature or route is broken.

---

# 20. Acceptance Criteria

The implementation is complete when all of the following are true:

### Navbar
- [ ] Hamburger is on the far left.
- [ ] Existing PrepMatrix logo follows the hamburger.
- [ ] “PrepMatrix” text follows the logo.
- [ ] Voice icon is no longer directly displayed in the navbar.
- [ ] Theme toggle is no longer directly displayed in the navbar.
- [ ] Navbar looks balanced on small mobile screens.
- [ ] No horizontal overflow occurs.

### Menu
- [ ] Hamburger opens the navigation menu.
- [ ] Menu contains a Settings option.
- [ ] Menu has appropriate visual hierarchy.
- [ ] Menu closes correctly.
- [ ] Existing navigation still works.
- [ ] Logout remains functional.

### Settings
- [ ] Settings has its own polished UI/section.
- [ ] Existing voice functionality is accessible from Settings.
- [ ] Existing theme functionality is accessible from Settings.
- [ ] Existing preferences are connected to their real state.
- [ ] Preferences persist appropriately.
- [ ] No fake/non-functional settings are added.

### Quality
- [ ] Mobile responsive.
- [ ] Tablet responsive.
- [ ] Desktop behavior remains coherent.
- [ ] Accessible controls.
- [ ] No unnecessary dependencies.
- [ ] No duplicated state.
- [ ] Existing UI is not unnecessarily redesigned.
- [ ] Existing functionality continues to work.

---

# 21. Important Development Constraint

**Do not blindly implement the design from this prompt without first inspecting the existing PrepMatrix codebase.**

The implementation should integrate naturally with the current architecture.

Prioritize:

**Existing architecture → Existing components → Existing state → Existing styling → New navigation behavior**

rather than rewriting the application.

The final result should look as though the navbar and Settings system were always part of PrepMatrix.

---

# Final Design Goal

Transform the current mobile header from:

```text
[PrepMatrix Logo]                         [Voice] [Theme] [☰]
```

into:

```text
[☰] [PrepMatrix Logo] PrepMatrix
```

and relocate preference controls into:

```text
☰
  ├── Dashboard
  ├── AI Interview
  ├── Manual Interview
  ├── Resume Analysis
  ├── Previous Sessions
  ├── Profile
  ├── Settings
  │    ├── Voice & Audio
  │    ├── Theme & Appearance
  │    └── Other supported preferences
  └── Logout
```

The result should feel **cleaner, more app-like, easier to navigate, and more scalable** as PrepMatrix gains additional user preferences in the future.

Do not change the core PrepMatrix product experience beyond the navigation/settings improvements described above.
