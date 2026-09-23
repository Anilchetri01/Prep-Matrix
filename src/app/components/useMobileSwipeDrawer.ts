import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import {
  EDGE_ZONE,
  XL_BREAKPOINT,
  REDUCED_MOTION_DURATION,
  calculateEffectiveX,
  calculateProgress,
  calculateBackdropOpacity,
  checkDirectionLock,
  decideGestureOutcome,
  simulateSpringStep,
  isSpringSettled,
  calculateVelocity,
  isWithinSwipeZone,
} from './drawerGesturePhysics';

interface HistoryPoint {
  x: number;
  time: number;
}

function isConflictingElement(target: EventTarget | null): boolean {
  if (!target) return false;

  const element =
    target instanceof Element
      ? target
      : (target as Node)?.parentElement instanceof Element
      ? (target as Node).parentElement
      : null;

  if (!element) return false;

  // Form controls & editable elements
  if (
    element.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="slider"], [data-no-swipe], [data-no-drawer-swipe], video, audio'
    )
  ) {
    return true;
  }

  // Check if inside a horizontally scrollable container
  let current: Element | null = target;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowX = style.overflowX;
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      current.scrollWidth > current.clientWidth + 2
    ) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

export function useMobileSwipeDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);

  const drawerRef = useRef<HTMLElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentXRef = useRef<number>(-340);
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const trackingRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    startDrawerX: number;
    isStartingOpen: boolean;
    status: 'idle' | 'tracking' | 'horizontal' | 'vertical';
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    startDrawerX: -340,
    isStartingOpen: false,
    status: 'idle',
  });

  const historyRef = useRef<HistoryPoint[]>([]);
  const isTouchActiveRef = useRef(false);
  const location = useLocation();

  // Dynamic drawer width from element or viewport formula
  const getDrawerWidth = useCallback(() => {
    if (drawerRef.current && drawerRef.current.offsetWidth > 0) {
      return drawerRef.current.offsetWidth;
    }
    if (typeof window !== 'undefined') {
      return Math.min(window.innerWidth * 0.88, 340);
    }
    return 340;
  }, []);

  // Update styles directly on DOM nodes for 60/120fps GPU performance without React re-renders
  const applyPosition = useCallback(
    (x: number) => {
      currentXRef.current = x;
      const width = getDrawerWidth();
      const progress = calculateProgress(x, width);

      if (drawerRef.current) {
        drawerRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
        drawerRef.current.style.pointerEvents = progress > 0.02 ? 'auto' : 'none';

        if (progress <= 0.01) {
          drawerRef.current.setAttribute('aria-hidden', 'true');
          drawerRef.current.setAttribute('inert', '');
        } else {
          drawerRef.current.removeAttribute('aria-hidden');
          drawerRef.current.removeAttribute('inert');
        }
      }

      if (backdropRef.current) {
        backdropRef.current.style.opacity = calculateBackdropOpacity(x, width).toString();
        backdropRef.current.style.pointerEvents = progress > 0.05 ? 'auto' : 'none';
      }
    },
    [getDrawerWidth]
  );

  // Animate drawer using spring physics simulation (or easeOut for reduced motion)
  const animateTo = useCallback(
    (targetX: number, initialVelocity = 0, onComplete?: () => void) => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        const startX = currentXRef.current;
        const delta = targetX - startX;
        const startTime = performance.now();

        const tickReduced = (now: number) => {
          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / REDUCED_MOTION_DURATION);
          // Standard ease-out-cubic
          const ease = 1 - Math.pow(1 - t, 3);
          const newX = startX + delta * ease;
          applyPosition(newX);

          if (t >= 1) {
            applyPosition(targetX);
            rafIdRef.current = null;
            onComplete?.();
            return;
          }
          rafIdRef.current = requestAnimationFrame(tickReduced);
        };

        rafIdRef.current = requestAnimationFrame(tickReduced);
        return;
      }

      // Damped harmonic oscillator spring simulation
      let currentPos = currentXRef.current;
      let vel = Math.max(-1800, Math.min(1800, initialVelocity));
      let lastTime = performance.now();

      const tickSpring = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.032);
        lastTime = now;

        const next = simulateSpringStep(currentPos, targetX, vel, dt);
        vel = next.vel;
        currentPos = next.pos;

        if (isSpringSettled(currentPos, targetX, vel)) {
          applyPosition(targetX);
          rafIdRef.current = null;
          onComplete?.();
          return;
        }

        applyPosition(currentPos);
        rafIdRef.current = requestAnimationFrame(tickSpring);
      };

      rafIdRef.current = requestAnimationFrame(tickSpring);
    },
    [applyPosition]
  );

  const openDrawer = useCallback(
    (withVelocity: number | unknown = 0) => {
      const vel = typeof withVelocity === 'number' ? withVelocity : 0;
      const width = getDrawerWidth();
      if (!isOpenRef.current && currentXRef.current < -width + 1) {
        currentXRef.current = -width;
        applyPosition(-width);
      }

      // Immediate state synchronization for seamless icon morph & aria-expanded
      isOpenRef.current = true;
      setIsOpen(true);

      animateTo(0, vel, () => {
        const focusable = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    },
    [animateTo, applyPosition, getDrawerWidth]
  );

  const closeDrawer = useCallback(
    (withVelocity: number | unknown = 0, shouldRestoreFocus = true) => {
      const vel = typeof withVelocity === 'number' ? withVelocity : 0;
      const width = getDrawerWidth();

      // Immediate state synchronization for seamless icon morph & aria-expanded
      isOpenRef.current = false;
      setIsOpen(false);

      animateTo(-width, vel, () => {
        if (shouldRestoreFocus) {
          hamburgerButtonRef.current?.focus();
        }
      });
    },
    [animateTo, getDrawerWidth]
  );

  const toggleDrawer = useCallback(() => {
    if (isOpenRef.current) {
      closeDrawer(0);
    } else {
      openDrawer(0);
    }
  }, [closeDrawer, openDrawer]);

  const startGesture = useCallback(
    (clientX: number, clientY: number, target: EventTarget | null): boolean => {
      if (typeof window === 'undefined' || window.innerWidth >= XL_BREAKPOINT) {
        return false;
      }

      const width = getDrawerWidth();
      const currentX = currentXRef.current;
      const isVisiblyOpen = currentX > -width + 1;
      const isStartingOpen = isOpenRef.current || isVisiblyOpen;

      if (!isStartingOpen) {
        // Drawer is fully closed off-screen:
        // Respect non-conflicting elements and allow swiping across generous left zone / screen
        if (isConflictingElement(target)) return false;
        if (!isWithinSwipeZone(clientX, window.innerWidth)) return false;
      } else {
        // Drawer is open or mid-motion: only initiate drag directly on the drawer element
        // (Do NOT initiate drag on backdrop; backdrop is reserved for tap-to-close)
        const isOnDrawer = drawerRef.current?.contains(target as Node);
        if (!isOnDrawer) return false;
      }

      // Cancel running spring animation immediately for smooth fingertip catching
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      trackingRef.current = {
        startX: clientX,
        startY: clientY,
        startTime: performance.now(),
        startDrawerX: currentXRef.current,
        isStartingOpen,
        status: 'tracking',
      };
      historyRef.current = [{ x: clientX, time: performance.now() }];
      return true;
    },
    [getDrawerWidth]
  );

  const moveGesture = useCallback(
    (clientX: number, clientY: number, cancelable: boolean, preventDefault: () => void) => {
      const tracking = trackingRef.current;
      if (!tracking || tracking.status === 'idle' || tracking.status === 'vertical') {
        return;
      }

      const dx = clientX - tracking.startX;
      const dy = clientY - tracking.startY;

      if (tracking.status === 'tracking') {
        // Early preventDefault if moving with horizontal dominance to prevent mobile browser scroll hijack
        const isHorizontalDominant =
          (!tracking.isStartingOpen && dx > 4 && dx > Math.abs(dy) * 1.1) ||
          (tracking.isStartingOpen && dx < -4 && Math.abs(dx) > Math.abs(dy) * 1.1);

        if (cancelable && isHorizontalDominant) {
          preventDefault();
        }

        const lock = checkDirectionLock(dx, dy, tracking.isStartingOpen);
        if (lock === 'idle') return;
        if (lock === 'vertical') {
          tracking.status = 'vertical';
          return;
        }
        tracking.status = 'horizontal';
        isDraggingRef.current = true;
        if (typeof document !== 'undefined') {
          document.body.style.userSelect = 'none';
        }
      }

      if (tracking.status === 'horizontal') {
        if (cancelable) {
          preventDefault();
        }

        const width = getDrawerWidth();
        // Exact direct manipulation: startDrawerX + dx guarantees zero visual jumping on interruption
        const rawX = tracking.startDrawerX + dx;
        const effectiveX = calculateEffectiveX(rawX, width);

        applyPosition(effectiveX);

        const now = performance.now();
        historyRef.current.push({ x: clientX, time: now });
        historyRef.current = historyRef.current.filter((p) => now - p.time <= 120);
      }
    },
    [applyPosition, getDrawerWidth]
  );

  const endGesture = useCallback(() => {
    const tracking = trackingRef.current;
    const wasDragging = isDraggingRef.current;

    if (typeof document !== 'undefined') {
      document.body.style.userSelect = '';
    }

    if (wasDragging) {
      justDraggedRef.current = true;
      window.setTimeout(() => {
        justDraggedRef.current = false;
      }, 300);
    }

    if (!tracking || tracking.status !== 'horizontal') {
      trackingRef.current = {
        startX: 0,
        startY: 0,
        startTime: 0,
        startDrawerX: -getDrawerWidth(),
        isStartingOpen: false,
        status: 'idle',
      };
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = false;
    const width = getDrawerWidth();
    const now = performance.now();
    let velocity = calculateVelocity(historyRef.current);
    // If the finger paused/rested before release, decay velocity to zero
    if (
      historyRef.current.length > 0 &&
      now - historyRef.current[historyRef.current.length - 1].time > 100
    ) {
      velocity = 0;
    }
    const progress = calculateProgress(currentXRef.current, width);

    const outcome = decideGestureOutcome(progress, velocity, tracking.isStartingOpen);

    if (outcome === 'open') {
      openDrawer(velocity);
    } else {
      closeDrawer(velocity, false);
    }

    trackingRef.current = {
      startX: 0,
      startY: 0,
      startTime: 0,
      startDrawerX: -width,
      isStartingOpen: false,
      status: 'idle',
    };
  }, [closeDrawer, getDrawerWidth, openDrawer]);

  const handleBackdropClick = useCallback(() => {
    if (justDraggedRef.current) return;
    closeDrawer();
  }, [closeDrawer]);

  // Touch event listeners for mobile devices
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isTouchActiveRef.current = true;
      const touch = e.touches[0];
      startGesture(touch.clientX, touch.clientY, e.target);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      moveGesture(touch.clientX, touch.clientY, e.cancelable, () => {
        if (e.cancelable) e.preventDefault();
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length > 0) return;
      endGesture();
      window.setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 300);
    };

    const handleTouchCancel = (e: TouchEvent) => {
      if (e.touches.length > 0) return;
      // System cancelled gesture (e.g. native iOS back navigation swipe or incoming call)
      isDraggingRef.current = false;
      const tracking = trackingRef.current;
      if (tracking && tracking.status === 'horizontal') {
        if (!tracking.isStartingOpen) {
          closeDrawer(0, false);
        } else {
          openDrawer(0);
        }
      }
      trackingRef.current = {
        startX: 0,
        startY: 0,
        startTime: 0,
        startDrawerX: -getDrawerWidth(),
        isStartingOpen: false,
        status: 'idle',
      };
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = '';
      }
      window.setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 300);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [closeDrawer, endGesture, getDrawerWidth, moveGesture, openDrawer, startGesture]);

  // Pointer event listeners for mouse, pen, and Chrome DevTools device mode
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (isTouchActiveRef.current || e.pointerType === 'touch') return;
      if (e.button !== 0) return;
      startGesture(e.clientX, e.clientY, e.target);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isTouchActiveRef.current || e.pointerType === 'touch') return;
      if (e.pointerType === 'mouse' && e.buttons === 0) {
        if (trackingRef.current.status !== 'idle') {
          endGesture();
        }
        return;
      }
      moveGesture(e.clientX, e.clientY, e.cancelable, () => {
        if (e.cancelable) e.preventDefault();
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isTouchActiveRef.current || e.pointerType === 'touch') return;
      endGesture();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (isTouchActiveRef.current || e.pointerType === 'touch') return;
      isDraggingRef.current = false;
      const tracking = trackingRef.current;
      if (tracking && tracking.status === 'horizontal') {
        if (!tracking.isStartingOpen) {
          closeDrawer(0, false);
        } else {
          openDrawer(0);
        }
      }
      trackingRef.current = {
        startX: 0,
        startY: 0,
        startTime: 0,
        startDrawerX: -getDrawerWidth(),
        isStartingOpen: false,
        status: 'idle',
      };
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = '';
      }
    };

    const handleClickCapture = (e: MouseEvent) => {
      if (justDraggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (trackingRef.current.status !== 'idle') {
        e.preventDefault();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: false });
    window.addEventListener('click', handleClickCapture, { capture: true });
    window.addEventListener('dragstart', handleDragStart);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('click', handleClickCapture, { capture: true });
      window.removeEventListener('dragstart', handleDragStart);
    };
  }, [closeDrawer, endGesture, getDrawerWidth, moveGesture, openDrawer, startGesture]);

  // Prevent background page scrolling when drawer is fully open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Accessibility: Escape key closing & Tab focus containment
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDrawer, isOpen]);

  // Route change: close drawer automatically
  useEffect(() => {
    if (isOpenRef.current) {
      closeDrawer(0, false);
    }
  }, [location.pathname, closeDrawer]);

  // Responsive breakpoint & orientation resize management
  useEffect(() => {
    const handleResize = () => {
      const width = getDrawerWidth();
      if (window.innerWidth >= XL_BREAKPOINT) {
        if (isOpenRef.current) {
          isOpenRef.current = false;
          setIsOpen(false);
        }
        applyPosition(-width);
      } else {
        // Under mobile breakpoint: keep offscreen if closed, aligned to 0 if open
        if (!isOpenRef.current) {
          applyPosition(-width);
        } else {
          applyPosition(0);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyPosition, getDrawerWidth]);

  // Initial placement off-screen
  useEffect(() => {
    const width = getDrawerWidth();
    applyPosition(-width);
  }, [applyPosition, getDrawerWidth]);

  // Cleanup pending RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    drawerRef,
    backdropRef,
    hamburgerButtonRef,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    handleBackdropClick,
  };
}
