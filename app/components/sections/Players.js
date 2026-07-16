'use client';

import { useEffect, useState } from 'react';
import { PageWrap } from '../UI';
import { slugify } from '../../lib/slugify';

const playersPerPage = 9;

const rolePriority = (role) => {
  if (role === 'Captain') return 0;
  if (role === 'Vice Captain') return 1;
  return 2;
};

export function Players() {
  const [players, setPlayers] = useState([]);
  const [playerCardSearch, setPlayerCardSearch] = useState("");
  const [playerPage, setPlayerPage] = useState(1);
  const [tab, setTab] = useState("active");

  useEffect(() => {
    fetch('/api/players')
      .then((res) => res.json())
      .then((data) => setPlayers(data.players || []))
      .catch(() => setPlayers([]));
  }, []);

  const filteredPlayers = players
    .filter((p) => (tab === "active" ? p.recent : !p.recent))
    .filter((p) => p.name.toLowerCase().includes(playerCardSearch.toLowerCase()))
    .sort((a, b) => {
      const priorityDiff = rolePriority(a.role) - rolePriority(b.role);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });

  const pagedPlayers = filteredPlayers.slice(
    (playerPage - 1) * playersPerPage,
    playerPage * playersPerPage
  );

  const playerTotalPages = Math.ceil(filteredPlayers.length / playersPerPage);

  return (
    <PageWrap
      id="players"
      title="Players"
      subtitle="Meet the Telugu Titans squad under TCCC banner."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { key: "active", label: "Active Players" },
          { key: "alumni", label: "Former Players" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPlayerPage(1);
            }}
            className={`btn ${tab === t.key ? "btn-gold" : "btn-ghost"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        value={playerCardSearch}
        onChange={(e) => {
          setPlayerCardSearch(e.target.value);
          setPlayerPage(1);
        }}
        placeholder="Search player..."
        className="mb-6 w-full max-w-md rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-amber-300"
      />
      <div className="mt-6 flex items-center justify-between rounded-2xl  border-white/10 bg-white/5 px-4 py-3">
        <button
          onClick={() => setPlayerPage((p) => Math.max(1, p - 1))}
          disabled={playerPage === 1}
          className="btn btn-ghost disabled:opacity-40"
        >
          Previous
        </button>

        <span className="text-sm font-bold text-white/70">
          Page {playerPage} of {playerTotalPages}
        </span>

        <button
          onClick={() => setPlayerPage((p) => Math.min(playerTotalPages, p + 1))}
          disabled={playerPage === playerTotalPages}
          className="btn btn-ghost disabled:opacity-40"
        >
          Next
        </button>
      </div>
      <div className="player-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pagedPlayers.map((p, i) => (
          <a
            key={`${p.name}-${i}`}
            href={`/players/${slugify(p.name)}`}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-amber-300/50"
          >
            {p.image ? (
              <img
                src={p.image}
                alt={p.name}
                className="h-72 w-full object-cover"
                style={{ objectPosition: "50% 50%" }}
              />
            ) : (
              <div className="flex h-72 w-full items-center justify-center bg-white/10 text-4xl font-black text-white/30">
                {p.name
                  .split(' ')
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
            )}

            <div className="p-4">
              <h3 className="text-xl font-bold text-amber-300">{p.name}</h3>

              {p.role && (
                <p className="text-sm font-semibold text-yellow-300">
                  {p.role}
                </p>
              )}

              <p className="mt-1 text-white/70">{p.skill}</p>
            </div>
          </a>
        ))}
      </div>
    </PageWrap>
  );
}
