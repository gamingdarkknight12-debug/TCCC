'use client';

import { useEffect, useState } from 'react';
import { PageWrap } from '../UI';

export function Schedule() {
  const [matches, setMatches] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('BEDCL');
  const [flippedMatch, setFlippedMatch] = useState(null);

  useEffect(() => {
    fetch('/api/matches?season=2026')
      .then((res) => res.json())
      .then((data) => setMatches(data.matches || []))
      .catch(() => setMatches([]));
  }, []);

  return (
    <PageWrap
      id="schedule2026"
      title="2026 Season Schedule"
      subtitle="Select BEDCL or MCPL schedule."
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
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {matches
          .filter((match) => match.league === selectedSchedule)
          .map((match) => {
            const result = match.result;
            const isFlipped = flippedMatch === match.id;

            return (
              <div
                key={match.id}
                onClick={() =>
                  setFlippedMatch(isFlipped ? null : match.id)
                }
                className="cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-300/40 hover:bg-white/10"
              >
                {isFlipped ? (
                  result ? (
                    <>
                      <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-black">
                        MATCH SUMMARY
                      </span>

                      <h3 className="mt-4 text-2xl font-black text-amber-300">
                        {result.result}
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-white/75">
                        {result.summary}
                      </p>

                      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-black/30 p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                          MVP OF THE MATCH
                        </p>
                        <p className="mt-2 text-2xl font-black text-white">
                          🏆 {result.mvp}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-amber-300">
                        MATCH SUMMARY
                      </span>

                      <h3 className="mt-4 text-2xl font-black text-amber-300">
                        Result Coming Soon
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-white/70">
                        Match summary and MVP will be updated after the game.
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <div className="mb-3 inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-black">
                      {match.league}
                    </div>

                    <h3 className="text-2xl font-black text-amber-300">
                      Telugu Titans vs {match.opponent}
                    </h3>

                    <div className="mt-5 space-y-3 text-white/80">
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
                  </>
                )}
              </div>
            );
          })}
      </div>
    </PageWrap>
  );
}
