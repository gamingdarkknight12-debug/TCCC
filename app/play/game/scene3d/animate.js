// Tiny hand-rolled animation helpers - no tween library. Three.js has no
// built-in Tween (unlike Phaser), and the animations here are simple enough
// (a handful of position/rotation lerps) that pulling in a dependency isn't
// worth it - consistent with this project's "no physics engine, just math"
// approach (see resolveBall.js's own doc comments).

export function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

// A parabolic arc: 0 at t=0 and t=1, peaking at `height` when t=0.5. Used for
// the ball's bounce/flight arc - not real physics, just a shape that reads
// as "the ball went up and came down."
export function arcHeight(t, height) {
  return height * 4 * t * (1 - t);
}

/**
 * A minimal animation scheduler: register a record with an onUpdate(t) and
 * optional onComplete, and call `tick()` once per frame from the RAF loop
 * that drives it. `t` is always clamped to [0,1] (never calls onUpdate with
 * stale time after completion).
 */
export class AnimationScheduler {
  constructor() {
    this.records = [];
  }

  add({ durationMs, onUpdate, onComplete }) {
    this.records.push({ start: performance.now(), durationMs, onUpdate, onComplete, done: false });
  }

  tick(now) {
    for (const record of this.records) {
      if (record.done) continue;
      const t = clamp01((now - record.start) / record.durationMs);
      record.onUpdate(t);
      if (t >= 1) {
        record.done = true;
        record.onComplete?.();
      }
    }
    this.records = this.records.filter((r) => !r.done);
  }

  clear() {
    this.records = [];
  }
}
