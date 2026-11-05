'use client';

export default function BowlerChoice({ players, onResolve }) {
  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
      <p className="mb-4 text-lg font-bold text-amber-300">Choose your bowler:</p>
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {players.map((p) => (
          <button key={p.id} onClick={() => onResolve(p.id)} className="btn btn-ghost">
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
