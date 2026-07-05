import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('tccc_matches')
    .select('id, league, season, opponent, match_date, match_time, ground, home_away, status, team_score, opponent_score, result_text, result_type, summary_text, mvp_text')
    .eq('team', 'TT')
    .neq('league', 'SEASON')
    .order('match_date', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}

export async function DELETE(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Match id is required.' }, { status: 400 });

  const { error } = await supabaseServer.from('tccc_matches').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: 'Match deleted.' });
}
