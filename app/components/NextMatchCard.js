'use client';

import { useEffect, useState } from 'react';

function getNextMatches(matches) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = matches
    .filter((m) => m.status === 'scheduled')
    .map((m) => ({
      ...m,
      matchDate: new Date(`${m.date}T00:00:00`),
    }))
    .filter((m) => m.matchDate >= today)
    .sort((a, b) => a.matchDate - b.matchDate);

  if (!upcoming.length) return [];

  const firstDate = upcoming[0].matchDate;
  const day = firstDate.getDay(); // 0 Sunday, 6 Saturday

  let weekendStart = new Date(firstDate);
  let weekendEnd = new Date(firstDate);

  if (day === 6) {
    weekendEnd.setDate(weekendStart.getDate() + 1); // Saturday + Sunday
  } else if (day === 0) {
    weekendStart.setDate(weekendStart.getDate() - 1); // Saturday
  }

  weekendStart.setHours(0, 0, 0, 0);
  weekendEnd.setHours(23, 59, 59, 999);

  return upcoming.filter(
    (m) => m.matchDate >= weekendStart && m.matchDate <= weekendEnd
  );
}

export function NextMatchCard() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => setMatches(data.matches || []))
      .catch(() => setMatches([]));
  }, []);

  const nextMatches = getNextMatches(matches);

  if (!nextMatches.length) return null;

  const today = new Date();
  const matchDate = new Date(`${nextMatches[0].date}T00:00:00`);
  const diffDays = Math.ceil((matchDate - today) / (1000 * 60 * 60 * 24));

  let reminderText = "Upcoming Match";
  if (diffDays === 1) reminderText = "Reminder: Match Tomorrow";
  if (diffDays === 0) reminderText = "Match Day";

  return (
    <div className="mt-6 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5">
      <div className="text-sm font-bold uppercase tracking-widest text-amber-300">
        {nextMatches.length > 1 ? `Upcoming Matches` : reminderText}
      </div>

      <div className="mt-4 grid gap-4">
        {nextMatches.map((match, index) => (
          <div
            key={`${match.date}-${match.time}-${index}`}
            className="rounded-2xl border border-amber-300/20 bg-black/20 p-4"
          >
            <h3 className="text-2xl font-black text-white">
              Telugu Titans vs {match.opponent}
            </h3>

            <div className="mt-3 grid gap-2 text-white/75 sm:grid-cols-2">
              <p><span className="text-amber-300">League:</span> {match.league}</p>
              <p><span className="text-amber-300">Date:</span> {match.date}</p>
              <p><span className="text-amber-300">Time:</span> {match.time}</p>
              <p><span className="text-amber-300">Ground:</span> {match.ground}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
