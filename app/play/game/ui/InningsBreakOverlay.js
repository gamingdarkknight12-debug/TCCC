'use client';

export default function InningsBreakOverlay({ summaryText, target, onResolve }) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
      <h3 className="text-2xl font-black text-amber-300">Innings Break</h3>
      <p className="text-white">{summaryText}</p>
      <p className="text-white/70">Target: {target}</p>
      <button onClick={() => onResolve()} className="btn btn-gold mt-3">
        Start 2nd Innings
      </button>
    </div>
  );
}
