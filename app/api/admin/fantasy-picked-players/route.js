import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

// Only players actually picked by some fantasy squad — used to scope the
// review page's fielding-stats inputs to relevant players, not the whole roster.
export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: teams, error } = await supabaseServer
    .from('fantasy_teams')
    .select('batter1:batter1_id (id, canonical_name), batter2:batter2_id (id, canonical_name), bowler1:bowler1_id (id, canonical_name), bowler2:bowler2_id (id, canonical_name)');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pickedPlayers = new Map();
  for (const t of teams || []) {
    for (const p of [t.batter1, t.batter2, t.bowler1, t.bowler2]) {
      if (p) pickedPlayers.set(p.id, p.canonical_name);
    }
  }

  const players = [...pickedPlayers.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ players });
}
