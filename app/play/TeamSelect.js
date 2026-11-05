'use client';

// Plain React (not Phaser) squad picker for single-player. The user manually
// picks their own squad from the active roster; the AI opponent auto-fills
// from whoever's left, ranked by a simple runs+wickets value score - no fake
// "AI draft" turn, since there's no second human to make that meaningful.

import { useEffect, useState } from 'react';

export default function TeamSelect({ onReady }) {
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState(null);
  const [squadSize, setSquadSize] = useState(6);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetch('/api/game/roster')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPlayers(data.players);
      })
      .catch((e) => setError(e.message));
  }, []);

  function toggle(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= squadSize) return prev;
      return [...prev, id];
    });
  }

  function handleSquadSizeChange(size) {
    setSquadSize(size);
    setSelectedIds((prev) => prev.slice(0, size));
  }

  function confirmSquad() {
    const userPlayers = players.filter((p) => selectedIds.includes(p.id));
    const remaining = players.filter((p) => !selectedIds.includes(p.id));
    const ranked = [...remaining].sort(
      (a, b) => b.batting.runs + b.bowling.wickets * 20 - (a.batting.runs + a.bowling.wickets * 20)
    );
    const opponentPlayers = ranked.slice(0, squadSize);

    onReady({
      squadSize,
      oversPerSide: 5,
      userTeam: { name: 'Your XI', players: userPlayers },
      opponentTeam: { name: 'Opponent XI', players: opponentPlayers },
    });
  }

  if (error) {
    return <div className="card p-6 text-red-400">Couldn't load the roster: {error}</div>;
  }
  if (!players) {
    return <div className="card p-6 text-white/70">Loading roster...</div>;
  }

  const canConfirm = selectedIds.length === squadSize;

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-white/70">Squad size:</span>
        {[6, 8].map((size) => (
          <button
            key={size}
            onClick={() => handleSquadSizeChange(size)}
            className={`btn ${squadSize === size ? 'btn-gold' : 'btn-ghost'}`}
          >
            {size}
          </button>
        ))}
      </div>

      <p className="mb-3 text-white/70">
        Pick {squadSize} players ({selectedIds.length}/{squadSize} selected). The rest of the active
        squad becomes your opponent's XI automatically.
      </p>

      <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
        {players.map((p) => {
          const picked = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                picked ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="font-semibold text-white">{p.name}</div>
              <div className="text-xs text-white/60">
                {p.skill || 'Player'} · {p.attributes.archetype}
                {p.batting.avg != null ? ` · Bat avg ${p.batting.avg}` : ''}
                {p.bowling.wickets ? ` · ${p.bowling.wickets} wkts` : ''}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={confirmSquad}
        disabled={!canConfirm}
        className={`btn mt-5 ${canConfirm ? 'btn-gold' : 'btn-ghost opacity-50'}`}
      >
        Start Match
      </button>
    </div>
  );
}
