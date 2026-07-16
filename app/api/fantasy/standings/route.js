import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { isFantasyAuthed } from '../../../lib/fantasyAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req) {
  if (!isFantasyAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: teams, error } = await supabaseServer.from('fantasy_teams').select('id, owner_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: scores, error: scoreError } = await supabaseServer.from('fantasy_scores').select('fantasy_team_id, points');
  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 });

  const pointsByTeam = new Map();
  for (const s of scores || []) {
    pointsByTeam.set(s.fantasy_team_id, (pointsByTeam.get(s.fantasy_team_id) || 0) + Number(s.points || 0));
  }

  const standings = (teams || [])
    .map((t) => ({ ownerName: t.owner_name, points: pointsByTeam.get(t.id) || 0 }))
    .sort((a, b) => b.points - a.points);

  return NextResponse.json(
    { standings },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
