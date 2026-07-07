'use client';

import { useEffect, useState } from 'react';
import { PageWrap } from '../UI';
import { StandingsGrid } from './Standings';

const RESULT_BADGES = {
  win: { label: 'WON', className: 'bg-emerald-400 text-black' },
  loss: { label: 'LOST', className: 'bg-red-400 text-black' },
  tie: { label: 'TIE', className: 'bg-sky-400 text-black' },
};

function resultBadge(match) {
  if (match.status === 'scheduled') return null;
  return RESULT_BADGES[match.result?.resultType] || { label: 'NO RESULT', className: 'bg-white/20 text-white' };
}

function MatchResultModal({ match, onClose }) {
  const result = match.result;
  const badge = resultBadge(match);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-300/20 bg-[#111318] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-black">
              {match.league}
            </span>
            {badge && (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20"
          >
            ×
          </button>
        </div>

        <h3 className="mt-4 text-2xl font-black text-amber-300">
          Telugu Titans vs {match.opponent}
        </h3>
        <p className="mt-1 text-sm text-white/60">{match.day}, {match.date}</p>

        {result ? (
          <>
            <p className="mt-4 text-lg font-bold text-white">{result.result}</p>
            {result.teamScore && result.opponentScore && (
              <p className="mt-1 text-sm text-white/60">
                {result.teamScore} vs {result.opponentScore}
              </p>
            )}
            {result.summary && (
              <p className="mt-4 text-sm leading-7 text-white/75">{result.summary}</p>
            )}

            {result.mvp && (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-black/30 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                  MVP OF THE MATCH
                </p>
                <p className="mt-2 text-2xl font-black text-white">🏆 {result.mvp}</p>
              </div>
            )}

            {(match.bestBatter || match.bestBowler) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {match.bestBatter && (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
                    🏏 Best Batter: {match.bestBatter.name} — {match.bestBatter.runs} runs
                  </div>
                )}
                {match.bestBowler && (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
                    🎯 Best Bowler: {match.bestBowler.name} — {match.bestBowler.wickets} wickets
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm leading-7 text-white/70">
            Match summary and MVP will be updated after the game.
          </p>
        )}
      </div>
    </div>
  );
}

export function Schedule() {
  const [matches, setMatches] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('BEDCL');
  const [openMatch, setOpenMatch] = useState(null);

  useEffect(() => {
    fetch('/api/matches?season=2026')
      .then((res) => res.json())
      .then((data) => setMatches(data.matches || []))
      .catch(() => setMatches([]));
  }, []);

  return (
    <PageWrap
      id="schedule2026"
      title="2026 Season"
      subtitle="Select BEDCL or MCPL schedule, or view the season standings."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedSchedule("BEDCL")}
          className={`btn ${selectedSchedule === "BEDCL" ? "btn-gold" : "btn-ghost"}`}
        >
          BEDCL Schedule
        </button>

        <button
          onClick={() => setSelectedSchedule("MCPL")}
          className={`btn ${selectedSchedule === "MCPL" ? "btn-gold" : "btn-ghost"}`}
        >
          MCPL Schedule
        </button>

        <button
          onClick={() => setSelectedSchedule("STANDINGS")}
          className={`btn ${selectedSchedule === "STANDINGS" ? "btn-gold" : "btn-ghost"}`}
        >
          Standings
        </button>
      </div>

      {selectedSchedule === "STANDINGS" ? (
        <StandingsGrid season={2026} />
      ) : (
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches
          .filter((match) => match.league === selectedSchedule)
          .map((match) => {
            const isFinished = match.status !== 'scheduled';
            const badge = resultBadge(match);

            return (
              <div
                key={match.id}
                onClick={() => isFinished && setOpenMatch(match)}
                className={
                  isFinished
                    ? 'relative cursor-pointer rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 opacity-70 transition hover:opacity-100 hover:border-white/20'
                    : 'relative rounded-2xl border border-white/10 bg-white/5 p-3.5 transition hover:border-amber-300/40 hover:bg-white/10'
                }
              >
                {badge && (
                  <span className={`absolute right-3.5 top-3.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${badge.className}`}>
                    {badge.label}
                  </span>
                )}

                <div className="mb-2 inline-flex rounded-full bg-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-black">
                  {match.league}
                </div>

                <h3 className="text-base font-black text-amber-300">
                  Telugu Titans vs {match.opponent}
                </h3>

                <div className="mt-2.5 space-y-1.5 text-sm text-white/80">
                  <p>
                    <span className="font-black text-amber-300">Date:</span>{" "}
                    {match.day}, {match.date}
                  </p>

                  <p>
                    <span className="font-black text-amber-300">Time:</span>{" "}
                    {match.time}
                  </p>

                  <p>
                    <span className="font-black text-amber-300">Home/Away:</span>{" "}
                    {match.homeAway}
                  </p>

                  <p>
                    <span className="font-black text-amber-300">Ground:</span>{" "}
                    {match.ground}
                  </p>
                </div>

                {isFinished && (
                  <p className="mt-2.5 text-[11px] font-bold uppercase tracking-widest text-white/40">
                    Tap for match summary
                  </p>
                )}
              </div>
            );
          })}
      </div>
      )}

      {openMatch && <MatchResultModal match={openMatch} onClose={() => setOpenMatch(null)} />}
    </PageWrap>
  );
}
