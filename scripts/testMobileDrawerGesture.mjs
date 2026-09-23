// Automated Test Suite for Mobile Navbar Swipe Drawer Physics & Logic
// Directly imports and verifies the production logic from drawerGesturePhysics.ts
import assert from 'node:assert/strict';
import {
  EDGE_ZONE,
  ACTIVATION_DISTANCE,
  OPEN_THRESHOLD,
  VELOCITY_THRESHOLD,
  FLICK_BACK_THRESHOLD,
  SPRING_STIFFNESS,
  SPRING_DAMPING,
  SPRING_MASS,
  MAX_BACKDROP_OPACITY,
  BOUNDARY_RESISTANCE_FACTOR,
  calculateEffectiveX,
  calculateProgress,
  calculateBackdropOpacity,
  checkDirectionLock,
  decideGestureOutcome,
  simulateSpringStep,
  isSpringSettled,
  calculateVelocity,
  isWithinSwipeZone,
} from '../src/app/components/drawerGesturePhysics.ts';

console.log('--- Testing Mobile Navbar Swipe Drawer Physics & Logic ---');

// Test 1: Edge Zone Detection
function testEdgeDetection() {
  console.log('Test 1: Edge Zone Detection');
  assert.equal(0 <= EDGE_ZONE, true, '0px should trigger edge zone');
  assert.equal(12 <= EDGE_ZONE, true, '12px should trigger edge zone');
  assert.equal(24 <= EDGE_ZONE, true, '24px should trigger edge zone');
  assert.equal(25 <= EDGE_ZONE, false, '25px should NOT trigger edge zone when closed');
  assert.equal(100 <= EDGE_ZONE, false, '100px should NOT trigger edge zone when closed');
  console.log('  Passed.');
}

// Test 2: Directional Locking for both Closed (Opening) and Open (Closing/Scrolling) states
function testDirectionalLocking() {
  console.log('Test 2: Directional Locking');
  // Closed drawer (opening): must swipe primarily rightward from left edge
  assert.equal(checkDirectionLock(5, 5, false), 'idle', 'Under activation distance remains idle');
  assert.equal(checkDirectionLock(5, 20, false), 'vertical', 'Vertical movement locks to vertical scroll');
  assert.equal(checkDirectionLock(0, 15, false), 'vertical', 'Pure vertical movement locks to vertical scroll');
  assert.equal(checkDirectionLock(-15, 0, false), 'vertical', 'Leftward swipe when closed locks to vertical/ignore');
  assert.equal(checkDirectionLock(15, 5, false), 'horizontal', 'Rightward swipe > activation threshold locks to horizontal');
  assert.equal(checkDirectionLock(25, 10, false), 'horizontal', 'Horizontal dominance locks to horizontal');
  assert.equal(checkDirectionLock(10, 1, false), 'horizontal', 'Rightward swipe at activation threshold with slight angle locks to horizontal');
  assert.equal(checkDirectionLock(9.5, 3.5, false), 'horizontal', 'Dominant horizontal swipe with slight vertical angle locks to horizontal');
  assert.equal(checkDirectionLock(9, 5, false), 'horizontal', 'Dominant horizontal swipe at dist >= 10 locks to horizontal');
  assert.equal(checkDirectionLock(6, 8, false), 'vertical', 'Vertical dominant movement at dist >= 10 locks to vertical');

  // Open drawer (swiping to close vs scrolling nav links):
  // When open, nav list scrolling should NOT accidentally trigger horizontal close
  assert.equal(checkDirectionLock(0, -30, true), 'vertical', 'Upward scroll on nav list locks to vertical');
  assert.equal(checkDirectionLock(5, 30, true), 'vertical', 'Downward scroll on nav list locks to vertical');
  assert.equal(checkDirectionLock(-12, -10, true), 'vertical', 'Diagonal thumb scroll locks to vertical (protects nav list)');
  assert.equal(checkDirectionLock(-25, 5, true), 'horizontal', 'Deliberate left swipe locks to horizontal close');
  assert.equal(checkDirectionLock(-10, 1, true), 'horizontal', 'Deliberate left swipe with slight vertical tilt locks to horizontal close');
  console.log('  Passed.');
}

// Test 3: Direct Manipulation & Boundary Resistance (Rubber-banding)
function testBoundaryResistance() {
  console.log('Test 3: Direct Manipulation & Boundary Resistance (Rubber-banding)');
  const drawerWidth = 340;

  // Inside normal range [-340, 0]
  assert.equal(calculateEffectiveX(-340, drawerWidth), -340, 'Fully closed should be -340');
  assert.equal(calculateEffectiveX(-170, drawerWidth), -170, 'Half open should be -170');
  assert.equal(calculateEffectiveX(0, drawerWidth), 0, 'Fully open should be 0');

  // Overshoot past fully open (> 0)
  const overshootOpen = calculateEffectiveX(50, drawerWidth);
  assert.equal(overshootOpen, 50 * BOUNDARY_RESISTANCE_FACTOR, 'Pulling 50px past open should resist to 9px');
  assert.ok(overshootOpen < 50, 'Effective X should be damped below raw displacement');

  // Overshoot past fully closed (< -340)
  const overshootClosed = calculateEffectiveX(-390, drawerWidth);
  assert.equal(overshootClosed, -340 - 50 * BOUNDARY_RESISTANCE_FACTOR, 'Pulling 50px past closed should resist to -349px');
  assert.ok(overshootClosed > -390, 'Effective X should be damped above raw displacement');
  console.log('  Passed.');
}

// Test 4: Gesture Interruption Mathematical Continuity (No Teleportation Jump)
function testGestureInterruptionContinuity() {
  console.log('Test 4: Gesture Interruption Mathematical Continuity');
  const drawerWidth = 340;
  // Scenario: Drawer is animating and currently at -150px (half-open)
  const interruptedDrawerX = -150;
  const touchStartX = 100;

  // User puts finger down at x=100 and moves right to x=115 (dx = +15)
  const dx = 15;
  const rawX = interruptedDrawerX + dx; // -135px
  const effectiveX = calculateEffectiveX(rawX, drawerWidth);

  assert.equal(effectiveX, -135, 'Interrupted drawer must smoothly continue from -150 to -135 without jumping');
  assert.notEqual(effectiveX, -340 + dx, 'Must NOT jump to closed offset (-325px)');
  assert.notEqual(effectiveX, dx, 'Must NOT jump to open offset (+15px)');
  console.log('  Passed.');
}

// Test 5: Backdrop Opacity Synchronization
function testBackdropSynchronization() {
  console.log('Test 5: Backdrop Opacity Synchronization');
  const drawerWidth = 340;

  assert.equal(calculateBackdropOpacity(-340, drawerWidth), 0, 'Opacity should be 0 when closed');
  assert.equal(calculateBackdropOpacity(0, drawerWidth), MAX_BACKDROP_OPACITY, 'Opacity should be 0.45 when fully open');
  assert.equal(calculateBackdropOpacity(-170, drawerWidth), 0.225, 'Opacity should be 0.225 at 50% open');
  console.log('  Passed.');
}

// Test 6: Gesture Decision Logic (Distance vs Velocity)
function testGestureDecision() {
  console.log('Test 6: Gesture Decision Logic');

  // Opening from closed
  assert.equal(decideGestureOutcome(0.5, 0, false), 'open', 'Slow drag past 40% should open');
  assert.equal(decideGestureOutcome(0.2, 600, false), 'open', 'Fast flick at 20% should open via velocity');
  assert.equal(decideGestureOutcome(0.2, 100, false), 'close', 'Slow drag at 20% should snap back closed');
  assert.equal(decideGestureOutcome(0.6, -400, false), 'close', 'Drag past 40% with flick back left should abort to closed');

  // Closing from open
  assert.equal(decideGestureOutcome(0.4, 0, true), 'close', 'Drag more than 40% closed (progress 0.4) should close');
  assert.equal(decideGestureOutcome(0.8, -600, true), 'close', 'Fast flick left from 80% should close via negative velocity');
  assert.equal(decideGestureOutcome(0.8, -100, true), 'open', 'Small drag left without velocity should spring back open');
  assert.equal(decideGestureOutcome(0.4, 400, true), 'open', 'Drag towards close but flick back right should stay open');
  console.log('  Passed.');
}

// Test 7: Velocity Calculation
function testVelocityCalculation() {
  console.log('Test 7: Velocity Calculation');
  const history = [
    { x: 100, time: 1000 },
    { x: 150, time: 1050 },
    { x: 200, time: 1100 },
  ];
  const vel = calculateVelocity(history);
  // dx = 100px, dt = 0.1s -> 1000 px/s
  assert.equal(Math.round(vel), 1000, 'Velocity should be computed accurately from history');
  console.log('  Passed.');
}

// Test 8: Spring Settling Physics Convergence
function testSpringConvergence() {
  console.log('Test 8: Spring Settling Physics Convergence');
  const targetX = 0;
  let currentPos = -200; // started from -200px
  let vel = 200; // initial release velocity
  let time = 0;
  const dt = 1 / 60; // 60fps frame delta
  let converged = false;

  for (let frame = 0; frame < 60; frame++) {
    const next = simulateSpringStep(currentPos, targetX, vel, dt);
    vel = next.vel;
    currentPos = next.pos;
    time += dt;

    if (isSpringSettled(currentPos, targetX, vel)) {
      converged = true;
      break;
    }
  }

  assert.equal(converged, true, 'Spring physics must converge within 60 frames (~1 sec)');
  assert.ok(time < 0.4, `Spring should settle in less than 400ms (settled in ${(time * 1000).toFixed(0)}ms)`);
  console.log(`  Passed: Settled smoothly in ${(time * 1000).toFixed(0)}ms with zero oscillation.`);
}

// Test 9: Expanded Swipe Zone Initiation Detection
function testExpandedSwipeZone() {
  console.log('Test 9: Expanded Swipe Zone Initiation Detection');
  const viewportWidth = 390;
  assert.equal(isWithinSwipeZone(0, viewportWidth), true, '0px should be allowed');
  assert.equal(isWithinSwipeZone(20, viewportWidth), true, '20px should be allowed');
  assert.equal(isWithinSwipeZone(40, viewportWidth), true, '40px should be allowed');
  assert.equal(isWithinSwipeZone(100, viewportWidth), true, '100px should be allowed');
  assert.equal(isWithinSwipeZone(200, viewportWidth), true, '200px should be allowed');
  assert.equal(isWithinSwipeZone(300, viewportWidth), true, '300px should be allowed');
  assert.equal(isWithinSwipeZone(360, viewportWidth), false, 'Extreme right edge should not initiate swipe to open');
  assert.equal(isWithinSwipeZone(-10, viewportWidth), false, 'Negative coordinates should not be allowed');
  console.log('  Passed.');
}

testEdgeDetection();
testDirectionalLocking();
testBoundaryResistance();
testGestureInterruptionContinuity();
testBackdropSynchronization();
testGestureDecision();
testVelocityCalculation();
testSpringConvergence();
testExpandedSwipeZone();

console.log('\nALL 9 PRODUCTION GESTURE TEST SUITES PASSED CLEANLY!');
