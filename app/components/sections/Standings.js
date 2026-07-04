'use client';

import { useEffect, useState } from 'react';
import { PageWrap, StatTable } from '../UI';

const LEAGUES = ['BEDCL', 'MCPL'];

export function Standings() {
  const [standings, setStandings] = useState([]);
  const [season, setSeason] = useState(new Date().getFullYear());

  useEffect(() => {
    fetch(`/api/standings?season=${season}`)
      .then((res) => res.json())
      .then((data) => setStandings(data.standings || []))
      .catch(() => setStandings([]));
  }, [season]);

  return (
    <PageWrap
      id="standings"
      title="Standings"
      subtitle="Telugu Titans' own season record in BEDCL and MCPL, based on published match results."
    >
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
    </PageWrap>
  );
}
