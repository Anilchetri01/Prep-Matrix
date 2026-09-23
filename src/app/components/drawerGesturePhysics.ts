// Mobile Drawer Physics, Geometry, and Gesture Decision Calibration
// All values are tuned to ChatGPT-like drawer interaction feel

export const EDGE_ZONE = 24; // Width in px from left edge of screen (retained for extreme bezel edge detection)
export const SWIPE_INITIATION_ZONE_RATIO = 0.8; // Expanded swipe initiation zone (up to 80% of viewport width)
export const SWIPE_INITIATION_MIN_PX = 240; // Minimum initiation width in px from left edge
export const ACTIVATION_DISTANCE = 10; // px of movement before committing to gesture direction
export const OPEN_THRESHOLD = 0.35; // Drag progress ratio (0..1) above which drawer snaps open
export const VELOCITY_THRESHOLD = 350; // px/s flick velocity threshold to force open/close
export const FLICK_BACK_THRESHOLD = 300; // px/s flick velocity back towards start to cancel gesture
export const SPRING_STIFFNESS = 380; // Tuned spring stiffness for fast, controlled motion
export const SPRING_DAMPING = 32; // Tuned damping for minimal settling overshoot, zero oscillating bounce
export const SPRING_MASS = 1; // Normalized mass
export const REDUCED_MOTION_DURATION = 160; // ms duration for prefers-reduced-motion fallback
export const MAX_BACKDROP_OPACITY = 0.45; // Maximum backdrop dark overlay opacity
export const XL_BREAKPOINT = 1280; // Desktop breakpoint (xl) where drawer is hidden and desktop nav shows
export const BOUNDARY_RESISTANCE_FACTOR = 0.18; // Rubber-band resistance damping ratio
export const CLOSE_DIRECTION_RATIO = 1.3; // Dominance factor required to close vs vertical scroll inside drawer
export const OPEN_DIRECTION_RATIO = 1.1; // Dominance factor required to open vs vertical scroll on page

export function isWithinSwipeZone(clientX: number, viewportWidth: number): boolean {
  if (clientX < 0) return false;
  const maxZone = Math.max(SWIPE_INITIATION_MIN_PX, viewportWidth * SWIPE_INITIATION_ZONE_RATIO);
  return clientX <= maxZone;
}

export function calculateEffectiveX(rawX: number, drawerWidth: number): number {
  if (rawX > 0) {
    // Opening beyond 100%
    return rawX * BOUNDARY_RESISTANCE_FACTOR;
  }
  if (rawX < -drawerWidth) {
    // Closing beyond 0%
    const excess = -drawerWidth - rawX;
    return -drawerWidth - excess * BOUNDARY_RESISTANCE_FACTOR;
  }
  return rawX;
}

export function calculateProgress(x: number, drawerWidth: number): number {
  if (drawerWidth <= 0) return 0;
  return Math.max(0, Math.min(1, (x + drawerWidth) / drawerWidth));
}

export function calculateBackdropOpacity(x: number, drawerWidth: number): number {
  const progress = calculateProgress(x, drawerWidth);
  return progress * MAX_BACKDROP_OPACITY;
}

export function checkDirectionLock(
  dx: number,
  dy: number,
  isStartingOpen: boolean
): 'idle' | 'horizontal' | 'vertical' {
  const dist = Math.hypot(dx, dy);
  if (dist < ACTIVATION_DISTANCE) {
    return 'idle';
  }

  if (isStartingOpen) {
    // When drawer is open, user may be scrolling vertical nav links.
    // Require clear horizontal dominance to hijack vertical scroll.
    if (Math.abs(dx) > Math.abs(dy) * CLOSE_DIRECTION_RATIO) {
      return 'horizontal';
    }
    return 'vertical';
  }

  // When drawer is closed, must swipe primarily rightward from left edge
  if (dx > 0 && dx > Math.abs(dy) * OPEN_DIRECTION_RATIO) {
    return 'horizontal';
  }
  return 'vertical';
}

export function decideGestureOutcome(
  progress: number,
  velocity: number,
  isStartingOpen: boolean
): 'open' | 'close' {
  if (!isStartingOpen) {
    // Opening from closed state
    if (velocity < -FLICK_BACK_THRESHOLD) return 'close';
    if (velocity > VELOCITY_THRESHOLD || progress > OPEN_THRESHOLD) return 'open';
    return 'close';
  }

  // Closing from open state
  if (velocity > FLICK_BACK_THRESHOLD) return 'open';
  if (velocity < -VELOCITY_THRESHOLD || progress < 0.6) return 'close';
  return 'open';
}

export function simulateSpringStep(
  currentPos: number,
  targetX: number,
  velocity: number,
  dt: number
): { pos: number; vel: number } {
  const force = -SPRING_STIFFNESS * (currentPos - targetX) - SPRING_DAMPING * velocity;
  const accel = force / SPRING_MASS;
  const newVel = velocity + accel * dt;
  const newPos = currentPos + newVel * dt;
  return { pos: newPos, vel: newVel };
}

export function isSpringSettled(
  currentPos: number,
  targetX: number,
  velocity: number
): boolean {
  return Math.abs(currentPos - targetX) < 0.5 && Math.abs(velocity) < 15;
}

export function calculateVelocity(history: Array<{ x: number; time: number }>): number {
  if (history.length < 2) return 0;
  const first = history[0];
  const last = history[history.length - 1];
  const dt = (last.time - first.time) / 1000;
  if (dt <= 0.005) return 0;
  return (last.x - first.x) / dt;
}
