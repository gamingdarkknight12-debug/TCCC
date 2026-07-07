'use client';

import { useEffect, useState } from 'react';
import { StatTable } from '../UI';

const LEAGUES = ['BEDCL', 'MCPL'];

export function StandingsGrid({ season = new Date().getFullYear() }) {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    fetch(`/api/standings?season=${season}`)
      .then((res) => res.json())
      .then((data) => setStandings(data.standings || []))
      .catch(() => setStandings([]));
  }, [season]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {LEAGUES.map((league) => {
        const rec = standings.find((s) => s.league === league);
        return (
          <StatTable
            key={league}
            title={`${league} — ${season}`}
            headers={['Games Played', 'Won', 'Lost', 'No Result', 'Tie']}
            rows={
              rec
                ? [[rec.gamesPlayed, rec.won, rec.lost, rec.noResult, rec.tie]]
                : []
            }
          />
        );
      })}
    </div>
  );
}
