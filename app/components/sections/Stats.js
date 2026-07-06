'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageWrap } from '../UI';

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
    count: 6,
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
    count: 1,
    names: ['pradhyu g', 'pradyu ghatti', 'pradyu'],
  },
  {
    count: 1,
    names: ['vikranth nyalakonda', 'vikranth'],
  },
  {
    count: 1,
    names: ['sreekanth reddy', 'srekanth reddy'],
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

const getSortValue = (value, type) => {
  if (type === 'text') {
    return String(value ?? '').toLowerCase();
  }

  if (value === '-' || value === null || value === undefined || value === '') {
    return 0;
  }

  const num = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isNaN(num) ? 0 : num;
};

const sortRows = (rows, sortConfig, columns) => {
  if (!sortConfig?.key) return rows;

  const column = columns.find((c) => c.key === sortConfig.key);
  const type = column?.type || 'number';

  return [...rows].sort((a, b) => {
    const aValue = getSortValue(a[sortConfig.key], type);
    const bValue = getSortValue(b[sortConfig.key], type);

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }

    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }

    return 0;
  });
};

const getNextSort = (currentSort, column) => {
  if (currentSort.key === column.key) {
    return {
      key: column.key,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    key: column.key,
    direction: column.type === 'text' ? 'asc' : 'desc',
  };
};

function SortableStatTable({ title, columns, rows, sortConfig, onSort }) {
  const formatValue = (value, column) => {
    if (column.zeroAsDash && Number(value) === 0) return '-';
    if (value === null || value === undefined || value === '') return '-';

    if (column.roundNoDecimal) {
      const num = Number(value);
      return Number.isNaN(num) ? value : Math.round(num);
    }

    return value;
  };

  return (
    <div>
      <h3 className="mb-4 text-2xl font-black text-amber-300">{title}</h3>

      <div className="overflow-x-auto rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="bg-white/10 text-white">
              {columns.map((column) => {
                const isActive = sortConfig.key === column.key;

                return (
                  <th key={column.key} className="px-3 py-3 font-bold">
                    <button
                      type="button"
                      onClick={() => onSort(column)}
                      className="flex items-center gap-1 text-left font-bold hover:text-amber-300"
                    >
                      {column.label}
                      {isActive && (
                        <span className="text-xs text-amber-300">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`${row.name}-${rowIndex}`}
                className="border-b border-white/10"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-3 text-white">
                    {formatValue(row[column.key], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Stats() {
  const [season, setSeason] = useState('All-Time');
  const [data, setData] = useState({ batting: [], bowling: [] });
  const [playerSearch, setPlayerSearch] = useState('');
  const [battingPage, setBattingPage] = useState(1);
  const [bowlingPage, setBowlingPage] = useState(1);

  const [battingSort, setBattingSort] = useState({
    key: 'runs',
    direction: 'desc',
  });

  const [bowlingSort, setBowlingSort] = useState({
    key: 'wickets',
    direction: 'desc',
  });

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

  const battingColumns =
    season === '2026'
      ? [
          { key: 'name', label: 'Player', type: 'text' },
          { key: 'matches', label: 'M', type: 'number' },
          { key: 'runs', label: 'R', type: 'number' },
          { key: 'balls', label: 'B', type: 'number' },
          { key: 'fours', label: '4s', type: 'number', zeroAsDash: true },
          { key: 'sixes', label: '6s', type: 'number', zeroAsDash: true },
          { key: 'sr', label: 'SR', type: 'number', roundNoDecimal: true },
          { key: 'avg', label: 'Avg', type: 'number', roundNoDecimal: true },
        ]
      : [
          { key: 'name', label: 'Player', type: 'text' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'balls', label: 'Balls', type: 'number' },
          { key: 'fours', label: '4s', type: 'number', zeroAsDash: true },
          { key: 'sixes', label: '6s', type: 'number', zeroAsDash: true },
          { key: 'sr', label: 'SR', type: 'number' },
        ];

  const bowlingColumns =
    season === '2026'
      ? [
          { key: 'name', label: 'Player', type: 'text' },
          { key: 'matches', label: 'M', type: 'number' },
          { key: 'overs', label: 'O', type: 'number' },
          { key: 'runs', label: 'R', type: 'number' },
          { key: 'wickets', label: 'W', type: 'number' },
          { key: 'economy', label: 'E', type: 'number' },
          { key: 'wides', label: 'Wd', type: 'number' },
          { key: 'noBalls', label: 'NB', type: 'number' },
        ]
      : [
          { key: 'name', label: 'Player', type: 'text' },
          { key: 'overs', label: 'Overs', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'wickets', label: 'Wickets', type: 'number' },
          { key: 'economy', label: 'Eco', type: 'number' },
        ];

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

  const sortedBattingRows = useMemo(
    () => sortRows(filteredBattingRows, battingSort, battingColumns),
    [filteredBattingRows, battingSort, battingColumns]
  );

  const sortedBowlingRows = useMemo(
    () => sortRows(filteredBowlingRows, bowlingSort, bowlingColumns),
    [filteredBowlingRows, bowlingSort, bowlingColumns]
  );

  const pagedBattingRows = sortedBattingRows.slice(
    (battingPage - 1) * rowsPerPage,
    battingPage * rowsPerPage
  );

  const pagedBowlingRows = sortedBowlingRows.slice(
    (bowlingPage - 1) * rowsPerPage,
    bowlingPage * rowsPerPage
  );

  const battingTotalPages = Math.max(
    1,
    Math.ceil(sortedBattingRows.length / rowsPerPage)
  );

  const bowlingTotalPages = Math.max(
    1,
    Math.ceil(sortedBowlingRows.length / rowsPerPage)
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
            <SortableStatTable
              title="Batting Leaders"
              columns={battingColumns}
              rows={pagedBattingRows}
              sortConfig={battingSort}
              onSort={(column) => {
                setBattingPage(1);
                setBattingSort((current) => getNextSort(current, column));
              }}
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
            <SortableStatTable
              title="Bowling Leaders"
              columns={bowlingColumns}
              rows={pagedBowlingRows}
              sortConfig={bowlingSort}
              onSort={(column) => {
                setBowlingPage(1);
                setBowlingSort((current) => getNextSort(current, column));
              }}
            />
          </div>
        </div>
      </div>
    </PageWrap>
  );
}