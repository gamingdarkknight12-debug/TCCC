import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season') || String(new Date().getFullYear());

  let query = supabaseServer
    .from('tccc_matches')
    .select('league, result_type')
    .eq('team', 'TT')
    .neq('league', 'SEASON')
    .in('status', ['published', 'cancelled'])
    .eq('season', Number(season));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byLeague = {};
  for (const row of data) {
    if (!byLeague[row.league]) {
      byLeague[row.league] = { league: row.league, gamesPlayed: 0, won: 0, lost: 0, noResult: 0, tie: 0 };
    }
    const rec = byLeague[row.league];
    rec.gamesPlayed += 1;
    if (row.result_type === 'win') rec.won += 1;
    else if (row.result_type === 'loss') rec.lost += 1;
    else if (row.result_type === 'tie') rec.tie += 1;
    else rec.noResult += 1; // covers 'no_result' and any unset/legacy rows
  }

  return NextResponse.json({ standings: Object.values(byLeague) });
}
