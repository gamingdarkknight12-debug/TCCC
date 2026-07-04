'use client';

import { useEffect, useState } from 'react';
import { PageWrap, StatTable } from '../UI';

const rowsPerPage = 10;

export function Stats() {
  const [season, setSeason] = useState('All-Time');
  const [data, setData] = useState({ batting: [], bowling: [] });
  const [playerSearch, setPlayerSearch] = useState("");
  const [battingPage, setBattingPage] = useState(1);
  const [bowlingPage, setBowlingPage] = useState(1);

  useEffect(() => {
    const seasonParam = season === 'All-Time' ? 'all' : season;
    fetch(`/api/stats?season=${seasonParam}`)
      .then((res) => res.json())
      .then((d) => setData({ batting: d.batting || [], bowling: d.bowling || [] }))
      .catch(() => setData({ batting: [], bowling: [] }));
  }, [season]);

  const battingRows = data.batting;
  const bowlingRows = data.bowling;

  const filteredBattingRows = battingRows.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const filteredBowlingRows = bowlingRows.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const pagedBattingRows = filteredBattingRows.slice(
    (battingPage - 1) * rowsPerPage,
    battingPage * rowsPerPage
  );

  const pagedBowlingRows = filteredBowlingRows.slice(
    (bowlingPage - 1) * rowsPerPage,
    bowlingPage * rowsPerPage
  );

  const battingTotalPages = Math.max(1, Math.ceil(filteredBattingRows.length / rowsPerPage));
  const bowlingTotalPages = Math.max(1, Math.ceil(filteredBowlingRows.length / rowsPerPage));

  return (
    <PageWrap id="stats" title="Player Stats" subtitle="Historical performance across available seasons.">
      <div>
        <div className="mb-6">
          <input
            value={playerSearch}
            onChange={(e) => {
              setPlayerSearch(e.target.value);
              setBattingPage(1);
              setBowlingPage(1);
            }}
            placeholder="Search player stats..."
            className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-amber-300"
          />
        </div>
      </div>
      <div>
        <div className="mb-6 flex flex-wrap gap-3">
          {['All-Time', '2026', '2025', '2024'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSeason(s);
                setBattingPage(1);
                setBowlingPage(1);
              }}
              className={`btn ${season === s ? 'btn-gold' : 'btn-ghost'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-table-grid grid gap-6 lg:grid-cols-2">
        <div>
          <div className="stats-pagination mt-4 flex items-center justify-between">
            <button
              onClick={() => setBattingPage((p) => Math.max(1, p - 1))}
              disabled={battingPage === 1}
              className="btn btn-ghost disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-white/70">
              Page {battingPage} of {battingTotalPages}
            </span>

            <button
              onClick={() => setBattingPage((p) => Math.min(battingTotalPages, p + 1))}
              disabled={battingPage === battingTotalPages}
              className="btn btn-ghost disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <div className="table-wrap">
            <StatTable
              title="Batting Leaders"
              headers={
                season === "2026"
                  ? ["Player", "R", "B", "4s", "6s", "SR", "Avg"]
                  : ["Player", "Runs", "Balls", "4s", "6s", "SR"]
              }
              rows={pagedBattingRows.map((p) =>
                season === "2026"
                  ? [p.name, p.runs, p.balls, p.fours || "-", p.sixes || "-", p.sr, p.avg]
                  : [p.name, p.runs, p.balls, p.fours || "-", p.sixes || "-", p.sr]
              )}
            />
          </div>
        </div>
        <div>
          <div className="stats-pagination mt-4 flex items-center justify-between">
            <button
              onClick={() => setBowlingPage((p) => Math.max(1, p - 1))}
              disabled={bowlingPage === 1}
              className="btn btn-ghost disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-white/70">
              Page {bowlingPage} of {bowlingTotalPages}
            </span>

            <button
              onClick={() => setBowlingPage((p) => Math.min(bowlingTotalPages, p + 1))}
              disabled={bowlingPage === bowlingTotalPages}
              className="btn btn-ghost disabled:opacity-40"
            >
              Next
            </button>
          </div>

          <div className="table-wrap">
            <StatTable
              title="Bowling Leaders"
              headers={
                season === "2026"
                  ? ["Player", "O", "R", "W", "E", "Dots", "Wd", "NB"]
                  : ["Player", "Overs", "Runs", "Wickets", "Eco"]
              }
              rows={pagedBowlingRows.map((p) =>
                season === "2026"
                  ? [p.name, p.overs, p.runs, p.wickets, p.economy, p.dots, p.wides, p.noBalls]
                  : [p.name, p.overs, p.runs, p.wickets, p.economy]
              )}
            />
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
