'use client';

export default function ModeSelect({ onSelect }) {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-amber-300">How do you want to play?</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect('single')}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:bg-white/10"
        >
          <div className="text-lg font-bold text-white">Single Player</div>
          <p className="mt-2 text-sm text-white/60">Pick your squad and take on the computer, right now.</p>
        </button>
        <button
          onClick={() => onSelect('online')}
          className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6 text-left hover:bg-amber-300/20"
        >
          <div className="text-lg font-bold text-amber-300">Play Online (1-on-1)</div>
          <p className="mt-2 text-sm text-white/60">
            Draft your XI and play live against a friend - one of you creates a room, the other
            joins with the code.
          </p>
        </button>
      </div>
    </div>
  );
}
