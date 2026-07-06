'use client';

import { useEffect, useState } from 'react';
import { PageWrap, StatTable } from '../UI';

const rowsPerPage = 10;

const matchCounts2026 = [
  {
    count: 12,
    names: [
      'srikanth',
      'srikanth govula',
      'srikanth g',
      'srikanth reddy',
    ],
  },

  {
    count: 11,
    names: ['nipun'],
  },

  {
    count: 10,
    names: ['varun', 'varun rambha'],
  },
  {
    count: 10,
    names: ['charan', 'charan teja bandaru'],
  },

  {
    count: 8,
    names: ['anand', 'anand chaitanya maddula'],
  },
  {
    count: 8,
    names: ['sai kiran', 'sai kiran reddy'],
  },
  {
    count: 8,
    names: ['shanthan', 'shanthan akkiraju'],
  },
  {
    count: 8,
    names: ['vikas', 'vikas tiwari'],
  },

  {
    count: 7,
    names: ['aadil', 'adil', 'aadil khan', 'adil khan'],
  },
  {
    count: 7,
    names: ['bhanu', 'bhanu musunuru'],
  },
  {
    count: 7,
    names: ['kiran', 'kiran k', 'kiran kakarlapudi'],
  },
  {
    count: 7,
    names: ['martin', 'martin thandhara'],
  },

  {
    count: 5,
    names: ['arun', 'arun kumar layam'],
  },
  {
    count: 6,
    names: ['dheeraj', 'dheeraj n'],
  },
  {
    count: 6,
    names: ['inderjeet', 'inder', 'inderjeet singh tamber'],
  },

  {
    count: 5,
    names: [
      'gvk teja',
      'teja gvk',
      'venkata krishna teja gurram',
      'venkat krishna teja gurram',
    ],
  },

  {
    count: 3,
    names: ['amit', 'amit koul'],
  },
  {
    count: 3,
    names: [
      'gowtham',
      'gowtam',
      'gautham',
      'gowtam reddy pidaparti',
      'gowtham reddy pidaparti',
    ],
  },
  {
    count: 3,
    names: ['kapil', 'kapil sai darshi'],
  },
  {
    count: 3,
    names: ['manish', 'maneesh'],
  },
  {
    count: 3,
    names: ['naresh', 'naresh pendyala'],
  },

  {
    count: 1,
    names: ['chaitanya praneeth', 'chaitanya praneeth nadimpalli'],
  },
  {
    count: 1,
    names: ['nikhil', 'nikhil holagunda'],
  },
  {
    count: 1,
    names: ['pradeep', 'pradeep pati'],
  },
  {
    count: 1,
    names: ['pranav'],
  },
  {
    count: 1,
    names: ['prasad g'],
  },
  {
    count: 1,
    names: ['raj v'],
  },
  {
    count: 1,
    names: ['ram kiran', 'ramkiran', 'ramkiran nersu'],
  },
  {
    count: 1,
    names: ['ram sandeep', 'ram sandeep chimata'],
  },
  {
    count: 1,
    names: ['sai swethan'],
  },
  {
    count: 1,
    names: ['sandesh', 'sandesh sudini'],
  },

  {
    count: 2,
    names: ['pradhyu g', 'pradyu ghatti', 'pradyu'],
  },

  {
  count: 1,
  names: ['vikranth nyalakonda', 'vikranth'],
},

  {
  count: 1,
  names: ['Sreekanth Reddy', 'Sreekanth'],
},

];

const normalizePlayerName = (name) =>
  name
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') || '';

const getMatchCount2026 = (name, existingMatches = 0) => {
  const key = normalizePlayerName(name);

  const match = matchCounts2026.find((item) =>
    item.names.some((alias) => normalizePlayerName(alias) === key)
  );

  return match ? match.count : existingMatches || 0;
};

export function Stats() {
  const [season, setSeason] = useState('All-Time');
  const [data, setData] = useState({ batting: [], bowling: [] });
  const [playerSearch, setPlayerSearch] = useState('');
  const [battingPage, setBattingPage] = useState(1);
  const [bowlingPage, setBowlingPage] = useState(1);

  useEffect(() => {
    const seasonParam = season === 'All-Time' ? 'all' : season;

    fetch(`/api/stats?season=${seasonParam}`)
      .then((res) => res.json())
      .then((d) =>
        setData({
          batting: d.batting || [],
          bowling: d.bowling || [],
        })
      )
      .catch(() =>
        setData({
          batting: [],
          bowling: [],
        })
      );
  }, [season]);

  const battingRows =
    season === '2026'
      ? data.batting.map((p) => ({
          ...p,
          matches: getMatchCount2026(p.name, p.matches),
        }))
      : data.batting;

  const bowlingRows =
    season === '2026'
      ? data.bowling.map((p) => ({
          ...p,
          matches: getMatchCount2026(p.name, p.matches),
        }))
      : data.bowling;

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

  const battingTotalPages = Math.max(
    1,
    Math.ceil(filteredBattingRows.length / rowsPerPage)
  );

  const bowlingTotalPages = Math.max(
    1,
    Math.ceil(filteredBowlingRows.length / rowsPerPage)
  );

  return (
    <PageWrap
      id="stats"
      title="Player Stats"
      subtitle="Historical performance across available seasons."
    >
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
              onClick={() =>
                setBattingPage((p) => Math.min(battingTotalPages, p + 1))
              }
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
                season === '2026'
                  ? ['Player', 'M', 'R', 'B', '4s', '6s', 'SR', 'Avg']
                  : ['Player', 'Runs', 'Balls', '4s', '6s', 'SR']
              }
              rows={pagedBattingRows.map((p) =>
                season === '2026'
                  ? [
                      p.name,
                      p.matches,
                      p.runs,
                      p.balls,
                      p.fours || '-',
                      p.sixes || '-',
                      p.sr,
                      p.avg,
                    ]
                  : [
                      p.name,
                      p.runs,
                      p.balls,
                      p.fours || '-',
                      p.sixes || '-',
                      p.sr,
                    ]
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
              onClick={() =>
                setBowlingPage((p) => Math.min(bowlingTotalPages, p + 1))
              }
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
                season === '2026'
                  ? ['Player', 'M', 'O', 'R', 'W', 'E', 'Dots', 'Wd', 'NB']
                  : ['Player', 'Overs', 'Runs', 'Wickets', 'Eco']
              }
              rows={pagedBowlingRows.map((p) =>
                season === '2026'
                  ? [
                      p.name,
                      p.matches,
                      p.overs,
                      p.runs,
                      p.wickets,
                      p.economy,
                      p.dots,
                      p.wides,
                      p.noBalls,
                    ]
                  : [p.name, p.overs, p.runs, p.wickets, p.economy]
              )}
            />
          </div>
        </div>
      </div>
    </PageWrap>
  );
}