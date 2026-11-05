'use client';

// Timing-bar batting mechanic, React version of the old Phaser BattingInput.
// Tapping "Defensive" or "Power Shot" both picks the shot type AND locks in
// the timing at that instant - how far the marker is from the center "sweet
// spot" becomes `timingError` (0 = perfect). Auto-resolves after 3000ms so a
// ball never stalls if nobody acts.

import { useEffect, useRef, useState } from 'react';

const TIMEOUT_MS = 3000;

export default function BattingInput({ durationMs, onResolve }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / durationMs);
      setProgress(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const timeoutId = setTimeout(() => commit('defensive'), TIMEOUT_MS);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commit(shotType) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const timingError = Math.max(-1, Math.min(1, progress * 2 - 1));
    onResolve({ shotType, timingError });
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-[62%] w-[90%] max-w-md -translate-x-1/2 text-center">
      <p className="mb-3 text-sm text-white/80">Tap when the marker is in the green zone!</p>
      <div className="relative h-3 w-full rounded-full bg-white/15">
        <div className="absolute left-1/2 top-1/2 h-6 w-16 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-green-500 bg-green-500/25" />
        <div
          className="absolute top-1/2 h-8 w-1.5 -translate-y-1/2 rounded bg-amber-300"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-4 flex justify-center gap-4">
        <button onClick={() => commit('defensive')} className="btn btn-ghost">
          Defensive
        </button>
        <button onClick={() => commit('power')} className="btn btn-gold">
          Power Shot
        </button>
      </div>
    </div>
  );
}
