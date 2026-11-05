'use client';

// "Basic fielding" v1: a catch-timing QTE for aerial dismissal chances, and a
// run/hold decision (with a probability roll) for risky 2s/3s. Deliberately
// NOT stat-driven - no fielding columns exist in the schema - fixed baseline
// constants, same values as the old Phaser version.

import { useEffect, useRef, useState } from 'react';

const CATCH_SHRINK_MS = 1100;
const CATCH_START_SIZE = 140;
const CATCH_END_SIZE = 20;
const CATCH_SUCCESS_THRESHOLD_SIZE = 56;
const CATCH_BASE_SUCCESS_CHANCE = 0.75;
const RUN_DECISION_TIMEOUT_MS = 2200;
const RUN_OUT_BASE_CHANCE = 0.14;

export function CatchQte({ onResolve }) {
  const [size, setSize] = useState(CATCH_START_SIZE);
  const startRef = useRef(performance.now());
  const rafRef = useRef(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / CATCH_SHRINK_MS);
      const current = CATCH_START_SIZE + (CATCH_END_SIZE - CATCH_START_SIZE) * t;
      setSize(current);
      if (t >= 1) {
        finish(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(caught) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onResolve(caught);
  }

  function handleTap() {
    if (size < CATCH_SUCCESS_THRESHOLD_SIZE) {
      finish(false);
      return;
    }
    finish(Math.random() < CATCH_BASE_SUCCESS_CHANCE);
  }

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4">
      <p className="text-center text-lg font-bold text-amber-300">Catch it! Tap the ball before it drops</p>
      <button
        onClick={handleTap}
        className="flex items-center justify-center rounded-full border-4 border-amber-300 bg-white/20"
        style={{ width: size, height: size }}
      >
        <span className="h-3 w-3 rounded-full bg-white" />
      </button>
    </div>
  );
}

export function RunDecision({ runsOffered, onResolve }) {
  const resolvedRef = useRef(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => commit(false), RUN_DECISION_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commit(ran) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onResolve({ ran, runOut: ran && Math.random() < RUN_OUT_BASE_CHANCE });
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
      <p className="mb-4 text-xl font-bold text-white">Go for {runsOffered}?</p>
      <div className="flex justify-center gap-4">
        <button onClick={() => commit(true)} className="btn btn-gold">
          Run!
        </button>
        <button onClick={() => commit(false)} className="btn btn-ghost">
          Hold
        </button>
      </div>
    </div>
  );
}
