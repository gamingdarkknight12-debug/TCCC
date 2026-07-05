'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    loadRecentMatches();
  }, []);

  async function loadRecentMatches() {
    const res = await fetch('/api/admin/matches');
    const data = await res.json();
    setRecentMatches(data.matches || []);
  }

  async function deleteMatch(id) {
    if (!confirm('Delete this match and all its stats permanently?')) return;
    await fetch(`/api/admin/matches?id=${id}`, { method: 'DELETE' });
    loadRecentMatches();
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-amber-300">Recent Matches</h3>
        <Link href="/admin/import" className="btn btn-gold text-sm">
          + Import a New Scorecard
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {recentMatches.length === 0 ? (
          <p className="text-white/60">No matches yet.</p>
        ) : (
          recentMatches.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-sm text-white/80">
                <span className="font-bold text-amber-300">{m.league}</span> vs {m.opponent} — {m.match_date} —{' '}
                <span className="uppercase text-white/50">{m.status}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/import?matchId=${m.id}`} className="btn btn-ghost text-xs">
                  Import
                </Link>
                <Link href={`/admin/review?matchId=${m.id}`} className="btn btn-ghost text-xs">
                  Edit
                </Link>
                <button onClick={() => deleteMatch(m.id)} className="btn btn-ghost text-xs">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
