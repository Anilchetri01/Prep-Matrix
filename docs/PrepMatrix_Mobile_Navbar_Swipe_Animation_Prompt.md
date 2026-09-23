# PrepMatrix Mobile Navbar — ChatGPT-Style Swipe Navigation Animation

## Objective

Redesign the **mobile navigation interaction** of PrepMatrix so the navigation drawer feels extremely smooth, responsive, and natural when opened with a **left-edge swipe**, similar in interaction quality to the ChatGPT mobile app.

The goal is **not to copy ChatGPT's source code, assets, or exact proprietary implementation**. Recreate the interaction principles:

- Edge-initiated swipe from left to right
- Direct manipulation following the user's finger
- Smooth spring-based settling
- Natural momentum/velocity handling
- Subtle backdrop transition
- Smooth close gesture
- No visible lag or snapping
- Native-app-like touch behavior

The existing PrepMatrix visual design must remain unchanged except for the navigation interaction required for this feature.

---

# 1. Target Mobile Navigation Behavior

The mobile header should remain:

```text
[☰] [PrepMatrix Logo] PrepMatrix
```

The navigation drawer should normally remain completely hidden off-screen.

The user must be able to open it in two ways:

### Method A — Hamburger

Tap the hamburger button.

```text
Tap ☰
   ↓
Drawer smoothly slides in from left
```

### Method B — Edge Swipe

Swipe from the **left edge of the screen toward the right**.

```text
Finger starts near left edge
          →
       →
    →
Drawer follows finger
```

The drawer should not wait until the swipe is finished before moving.

It must follow the user's finger **continuously in real time**.

---

# 2. Edge Swipe Detection

Implement an edge-swipe gesture area on mobile.

Recommended activation zone:

```text
Left edge activation width: ~20–28px
```

A gesture should be recognized when:

- Touch begins near the left edge.
- Horizontal movement is primarily toward the right.
- Horizontal movement exceeds a small activation distance.
- The gesture is not primarily vertical.

Suggested starting values:

```text
EDGE_ZONE = 24px
ACTIVATION_DISTANCE = 8–12px
```

These values should be tuned after testing on real mobile devices.

Do not make the entire page permanently capture horizontal gestures because this can interfere with:

- Horizontal carousels
- Sliders
- Text selection
- Browser gestures
- Scroll interactions

Only enable the opening gesture from the left edge.

---

# 3. Direct Manipulation

This is the most important requirement.

When the user swipes:

```text
Finger position
      ↓
Drawer position
      ↓
UI follows immediately
```

Do not implement:

```text
Swipe
 ↓
Detect completed gesture
 ↓
Start animation
```

Instead implement:

```text
Touch starts
 ↓
Track pointer movement
 ↓
Drawer continuously follows pointer
 ↓
Gesture ends
 ↓
Determine open/close state
 ↓
Spring animation settles
```

This should create the feeling that the user is physically dragging the navigation drawer.

---

# 4. Drawer Position During Gesture

Use a percentage or pixel-based horizontal translation.

Closed:

```text
translateX = -100%
```

Fully open:

```text
translateX = 0
```

During swipe:

```text
translateX = gestureProgress
```

For example:

```text
0%   = completely closed
25%  = quarter open
50%  = half open
75%  = mostly open
100% = fully open
```

The drawer should track the finger with minimal latency.

Avoid repeatedly triggering React state updates for every pointer movement when this would cause unnecessary re-renders.

Prefer a performant approach such as:

- Motion values
- `transform: translate3d(...)`
- `requestAnimationFrame`
- CSS transforms
- Framer Motion / Motion if already installed

Use the existing project's architecture.

---

# 5. Use GPU-Friendly Animation

The drawer animation should primarily use:

```css
transform: translate3d(...)
```

or an equivalent transform-based animation.

Avoid animating expensive layout properties such as:

```text
left
width
margin
padding
top
height
```

during the gesture.

Do not animate the entire DOM tree.

The animation should remain smooth even on mid-range Android devices.

---

# 6. Spring-Based Settling

After the user releases their finger, the drawer should settle naturally.

Do not use a simplistic fixed-duration linear transition.

Use spring physics or a carefully tuned cubic-bezier approximation.

Suggested behavior:

### Slow/short swipe

If the drawer is less than approximately halfway open:

```text
release
 ↓
spring back
 ↓
closed
```

### Strong swipe

If the swipe has enough distance or velocity:

```text
release
 ↓
spring forward
 ↓
fully open
```

Use both:

- Current drawer progress
- Swipe velocity

to determine the final state.

---

# 7. Recommended Gesture Decision Logic

Use a combination of distance and velocity.

Conceptually:

```text
open if:

progress > threshold
OR

velocityX > velocityThreshold
```

Suggested starting values:

```text
OPEN_THRESHOLD = 0.35–0.45
VELOCITY_THRESHOLD = 500–700 px/s
```

Example:

```text
User drags drawer 25%
but swipes quickly
        ↓
high velocity
        ↓
open drawer
```

And:

```text
User drags drawer 60%
but barely moves
        ↓
release
        ↓
open drawer
```

Tune these values through testing.

The interaction should feel forgiving rather than overly strict.

---

# 8. Resistance Near the Edges

Add subtle resistance when the drawer is dragged beyond its valid range.

For example:

### Opening beyond 100%

If the drawer is fully open and the user continues dragging:

```text
100%
 ↓
105%
 ↓
110%
```

The movement should become increasingly resistant.

### Closing beyond 0%

Likewise, avoid allowing the drawer to travel excessively outside the screen.

Use a rubber-band/resistance function rather than allowing unlimited movement.

Example conceptual function:

```text
if progress < 0:
    apply resistance

if progress > 1:
    apply resistance
```

This makes the drawer feel physically attached to the screen.

Do not overdo the resistance.

---

# 9. Backdrop Animation

When the drawer opens, display a backdrop over the rest of the application.

The backdrop should animate together with the drawer.

Closed:

```text
opacity: 0
pointer-events: none
```

Opening:

```text
opacity gradually increases
```

Fully open:

```text
opacity: approximately 0.25–0.45
```

Use a subtle translucent dark overlay.

The exact opacity should match the existing PrepMatrix design.

Do not make the backdrop overly dark.

---

# 10. Backdrop Must Follow Gesture Progress

The backdrop should not wait for the drawer to finish opening.

During a swipe:

```text
Drawer 20% open → backdrop ~20% visible
Drawer 50% open → backdrop ~50% visible
Drawer 100% open → backdrop fully visible
```

This synchronization is critical for the native-app feel.

---

# 11. Tap Backdrop to Close

When the drawer is open:

```text
Tap outside drawer
        ↓
drawer closes smoothly
```

The backdrop itself should be clickable/tappable.

Use the same spring-based closing animation as the swipe gesture.

---

# 12. Swipe-to-Close

Once the drawer is open, allow the user to close it by swiping **from right to left on the drawer**.

Behavior:

```text
Open drawer
     ↓
Swipe left
     ↓
Drawer follows finger
     ↓
Release
     ↓
Drawer closes or returns open depending on threshold
```

Use the same principles as opening:

- Direct manipulation
- Velocity
- Distance threshold
- Spring settling
- Backdrop synchronization

---

# 13. Prevent Accidental Vertical Gestures

Do not treat every touch as a horizontal drawer swipe.

Use directional locking.

For example:

```text
if abs(deltaY) > abs(deltaX):
    treat as vertical scroll
else:
    consider horizontal drawer gesture
```

Use a small tolerance zone so diagonal gestures do not feel jittery.

The page must remain easy to scroll normally.

---

# 14. Touch and Pointer Events

Prefer modern Pointer Events where supported:

```text
pointerdown
pointermove
pointerup
pointercancel
```

This can provide a consistent implementation across:

- Touch
- Stylus
- Mouse
- Trackpads

Use:

```css
touch-action
```

carefully.

Do not disable normal vertical scrolling across the entire application.

For example, do not blindly use:

```css
touch-action: none;
```

on the whole page.

Only restrict gesture behavior where necessary.

---

# 15. Drawer Layering

The navigation drawer should appear above:

```text
Main content
Backdrop
```

Recommended conceptual stacking:

```text
Main application
        ↓
Backdrop
        ↓
Navigation drawer
        ↓
Drawer controls
```

Ensure the drawer has a reliable stacking context.

Avoid mysterious `z-index` conflicts.

---

# 16. Drawer Width

Use a mobile-friendly width.

Recommended:

```text
width: 80–88vw
max-width: 360px
```

The exact value should be determined from the existing PrepMatrix menu design.

Do not allow the drawer to cover the entire screen unless that matches the existing product experience.

A small portion of the underlying page may remain visible when fully open if visually appropriate.

---

# 17. Drawer Animation Performance

The interaction must target a consistently smooth experience.

Prioritize:

```text
transform
opacity
```

Avoid layout-triggering animation.

Use:

```text
will-change: transform
```

only where appropriate.

Do not overuse `will-change` across large page sections.

Avoid:

- Heavy box-shadow animation
- Blur animation on large surfaces
- Repeated DOM creation/removal during dragging
- Expensive computations inside every pointer event

---

# 18. Prevent Gesture Jank

Pointer movement can fire many times per second.

Do not perform expensive operations on every `pointermove`.

Use a lightweight gesture loop.

Recommended approaches:

### Option A — Motion library

If PrepMatrix already uses Framer Motion / Motion:

Use motion values and drag controls rather than manually updating React state for every pixel.

### Option B — Native implementation

If no motion library exists:

Use:

```text
pointer events
+
requestAnimationFrame
+
CSS transform
```

Keep React state responsible for coarse state such as:

```text
isDrawerOpen
```

while the actual live drag position is handled through a performant mutable value.

Do not add a dependency simply for the sake of animation if the project already has a suitable animation system.

---

# 19. Header Behavior

The top navbar should remain visually stable while the drawer opens.

The drawer should slide over the application rather than causing the dashboard layout to resize unexpectedly.

Do not push the entire dashboard horizontally unless the existing product design explicitly requires a push-navigation pattern.

Preferred:

```text
Main page remains underneath
Drawer slides above it
Backdrop appears
```

---

# 20. Hamburger Button Animation

When the drawer opens, the hamburger can transition into a close/X icon.

Example:

```text
☰
 ↓
✕
```

The transition should be subtle and smooth.

Do not rotate the icon aggressively.

The button must remain in a predictable location.

Also ensure:

```text
aria-expanded="true"
```

when the menu is open.

Use:

```text
aria-controls="mobile-navigation"
```

when appropriate.

---

# 21. Opening Animation From Hamburger

When the user taps the hamburger:

```text
Button tap
 ↓
Drawer starts at -100%
 ↓
Spring toward 0%
 ↓
Backdrop fades in simultaneously
```

The transition should feel slightly physical rather than mechanical.

Suggested characteristics:

```text
Fast initial movement
Small amount of natural settling
Minimal overshoot
No bounce-heavy animation
```

The result should feel premium and controlled.

---

# 22. Closing Animation

Closing should feel equally smooth.

When the user:

- taps the X
- taps the backdrop
- completes a leftward swipe
- presses Escape

the drawer should animate toward:

```text
translateX = -100%
```

while:

```text
backdrop opacity → 0
```

Keep the drawer and backdrop synchronized.

---

# 23. Native-App Feel

The most important UX principle is:

> The UI should feel physically connected to the user's finger.

Avoid:

```text
Swipe → wait → animation
```

Prefer:

```text
Touch → immediate movement → release → natural spring
```

The user should feel that they are **dragging the navigation panel itself**.

---

# 24. Accessibility

The gesture is an enhancement, not the only method of navigation.

Users must still be able to open the menu using:

```text
Hamburger button
```

Ensure:

- Screen readers can access navigation.
- Keyboard users can access the menu.
- Focus states remain visible.
- Escape closes the drawer.
- Focus does not become trapped behind the drawer.
- Background content is not interactable while the drawer is actively modal.
- Buttons have accessible labels.
- `aria-expanded` accurately reflects menu state.

---

# 25. Reduced Motion

Respect the user's system preference:

```css
@media (prefers-reduced-motion: reduce)
```

When reduced motion is enabled:

- Remove or significantly reduce spring movement.
- Use a short/simple transition.
- Preserve functionality.
- Keep swipe interaction usable without excessive animation.

---

# 26. Mobile Breakpoint

Use the application's existing responsive breakpoint system.

Do not hard-code an arbitrary breakpoint if the project already defines one.

The swipe drawer behavior should primarily apply to:

```text
Mobile
```

The existing desktop navigation should remain intact unless a desktop drawer already exists.

---

# 27. Important Compatibility Requirements

Do not break:

- Dashboard scrolling
- Interview interactions
- Resume upload
- Resume analysis
- Previous sessions
- Profile
- Settings
- Authentication
- Logout
- Theme preferences
- Voice preferences

The navigation animation must be an enhancement to the existing system.

---

# 28. Codebase Audit Before Implementation

Before writing code, inspect:

```text
Navbar component
Mobile navigation component
Menu/drawer component
Router
Theme provider/context
Voice/audio provider/context
Global CSS
Tailwind configuration
Animation dependencies
Existing responsive breakpoints
```

Determine whether the project already contains:

```text
Framer Motion
Motion
React Spring
CSS transitions
Custom gesture utilities
```

Reuse existing infrastructure wherever practical.

Do not introduce multiple animation libraries.

---

# 29. Recommended Implementation Strategy

Use this sequence:

### Step 1

Locate the existing mobile navbar.

### Step 2

Locate the hamburger/menu implementation.

### Step 3

Locate all current navbar utilities.

### Step 4

Create/modify the mobile drawer.

### Step 5

Add left-edge gesture detection.

### Step 6

Connect live pointer movement to drawer translation.

### Step 7

Add velocity-aware open/close logic.

### Step 8

Add spring settling.

### Step 9

Synchronize backdrop opacity with drawer progress.

### Step 10

Add swipe-to-close.

### Step 11

Add backdrop-to-close.

### Step 12

Add reduced-motion support.

### Step 13

Run mobile responsive testing.

### Step 14

Run regression testing across existing PrepMatrix features.

---

# 30. Suggested Technical Pseudocode

The final implementation should adapt this concept to the existing codebase:

```ts
onPointerDown(event) {
  if (!drawerOpen && event.clientX <= EDGE_ZONE) {
    startGesture();
  }

  if (drawerOpen && event.clientX is inside drawer) {
    startGesture();
  }
}

onPointerMove(event) {
  if (!gestureActive) return;

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  if (!gestureDirectionLocked) {
    determineDirection(deltaX, deltaY);
  }

  if (gestureIsHorizontal) {
    updateDrawerProgress(deltaX);
    updateBackdropOpacity(drawerProgress);
  }
}

onPointerUp() {
  if (!gestureActive) return;

  const shouldOpen =
    progress > OPEN_THRESHOLD ||
    velocityX > VELOCITY_THRESHOLD;

  animateTo(shouldOpen ? OPEN : CLOSED);

  endGesture();
}
```

This is conceptual guidance only.

Use the codebase's existing patterns and libraries.

---

# 31. Quality Tuning

Do not stop at making the drawer technically functional.

Tune:

- Gesture sensitivity
- Edge zone
- Friction
- Velocity threshold
- Spring stiffness
- Spring damping
- Drawer width
- Backdrop opacity
- Animation timing
- Touch direction detection

Test repeatedly until the drawer feels:

```text
fast
smooth
stable
responsive
natural
premium
```

Avoid excessive bounce.

A subtle spring is preferable to a playful one.

---

# 32. Testing Checklist

Test on:

```text
320 × 568
360 × 800
375 × 812
390 × 844
412 × 915
430 × 932
```

Test:

- Tap hamburger.
- Swipe from left edge slowly.
- Swipe from left edge quickly.
- Swipe partially and release.
- Swipe almost completely and release.
- Swipe vertically from left edge.
- Swipe diagonally.
- Swipe-to-close.
- Tap backdrop.
- Tap menu item.
- Press Escape where supported.
- Open and close repeatedly.
- Scroll the page normally.
- Open menu while dashboard is scrolled.
- Test with dark mode.
- Test with reduced motion.
- Test on low/mid-range Android hardware.

---

# 33. Acceptance Criteria

The feature is complete when:

- [ ] Mobile navbar has hamburger on the far left.
- [ ] Logo follows hamburger.
- [ ] “PrepMatrix” follows the logo.
- [ ] Drawer opens from hamburger.
- [ ] Drawer opens from a left-edge swipe.
- [ ] Drawer follows the finger during the swipe.
- [ ] Opening uses smooth spring settling.
- [ ] Swipe velocity affects the final state.
- [ ] Partial swipes settle naturally.
- [ ] Drawer has subtle resistance at boundaries.
- [ ] Backdrop tracks drawer progress.
- [ ] Backdrop can be tapped to close.
- [ ] Drawer supports swipe-to-close.
- [ ] Vertical page scrolling remains normal.
- [ ] No major gesture conflicts occur.
- [ ] Animation uses GPU-friendly transforms.
- [ ] No noticeable lag or jank.
- [ ] Reduced-motion preferences are respected.
- [ ] Accessibility behavior is preserved.
- [ ] Existing routes and features continue working.
- [ ] Desktop navigation is not unnecessarily changed.
- [ ] No unnecessary animation dependency is introduced.

---

# 34. Final UX Target

The final interaction should feel approximately like this:

```text
CLOSED

┌────────────────────────────────────┐
│ ☰  [Logo] PrepMatrix               │
│                                    │
│      Dashboard content             │
└────────────────────────────────────┘


USER STARTS SWIPING FROM LEFT EDGE

┌────────────────────────────────────┐
│ ☰  [Logo] PrepMatrix               │
│╔══════════════════                 │
│║ Navigation                         │
│║                                   │
│║ Dashboard                         │
│║ AI Interview                      │
│║ Resume Analysis                   │
│║ Previous Sessions                 │
│║ Profile                           │
│║ Settings                          │
│╚══════════════════                 │
└────────────────────────────────────┘

        →
             →
                  →


FULLY OPEN

┌────────────────────────────────────┐
│╔══════════════════════╗            │
│║ PrepMatrix       ✕   ║░░░░░░░░░░│
│║                      ║░░░░░░░░░░│
│║ Dashboard            ║░░ Content │
│║ AI Interview         ║░           │
│║ Manual Interview     ║░           │
│║ Resume Analysis      ║░           │
│║ Previous Sessions    ║░           │
│║ Profile              ║░           │
│║                      ║░           │
│║ Settings             ║░           │
│║                      ║░           │
│║ Logout               ║░           │
│╚══════════════════════╝░░░░░░░░░░│
└────────────────────────────────────┘
```

The drawer should feel as though it is being **pulled out from the left edge by the user's finger**, rather than simply playing a pre-recorded slide animation.

## Final Instruction

Implement this as a polished, production-ready mobile interaction.

Preserve the existing PrepMatrix UI and functionality.

Do not blindly copy ChatGPT's UI or implementation. Reproduce the **smooth interaction quality and gesture behavior** using clean, maintainable code that fits the existing PrepMatrix architecture.
