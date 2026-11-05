'use client';

// Bowling mechanic, React version of the old Phaser BowlingInput: pick a
// line (flavor/animation only - see resolveBall.js's doc comment), then a
// timing-bar "release" tap whose accuracy becomes `timingAccuracy`, the
// number that actually makes the delivery harder or easier to face.

import { useEffect, useRef, useState } from 'react';

const TIMEOUT_MS = 3000;
const LINES = [
  { key: 'off', label: 'Off' },
  { key: 'middle', label: 'Middle' },
  { key: 'leg', label: 'Leg' },
];

export default function BowlingInput({ durationMs, onResolve }) {
  const [line, setLine] = useState(null);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!line) return undefined;
    startRef.current = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / durationMs);
      setProgress(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const timeoutId = setTimeout(commit, TIMEOUT_MS);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  function commit() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const offset = Math.min(1, Math.abs(progress * 2 - 1));
    const timingAccuracy = 1 - offset;
    const length = offset < 0.25 ? 'good' : progress < 0.5 ? 'short' : 'full';
    onResolve({ line, length, timingAccuracy });
  }

  if (!line) {
    return (
      <div className="pointer-events-auto absolute left-1/2 top-[62%] w-[90%] max-w-md -translate-x-1/2 text-center">
        <p className="mb-3 text-sm text-white/80">Choose your line:</p>
        <div className="flex justify-center gap-3">
          {LINES.map((l) => (
            <button key={l.key} onClick={() => setLine(l.key)} className="btn btn-ghost">
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-[62%] w-[90%] max-w-md -translate-x-1/2 text-center">
      <p className="mb-3 text-sm text-white/80">Tap &quot;Release!&quot; at the perfect moment</p>
      <div className="relative h-3 w-full rounded-full bg-white/15">
        <div className="absolute left-1/2 top-1/2 h-6 w-16 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-green-500 bg-green-500/25" />
        <div
          className="absolute top-1/2 h-8 w-1.5 -translate-y-1/2 rounded bg-amber-300"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-4 flex justify-center">
        <button onClick={commit} className="btn btn-gold">
          Release!
        </button>
      </div>
    </div>
  );
}
