import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Match id is required.' }, { status: 400 });

  const { data: match, error: matchError } = await supabaseServer
    .from('tccc_matches')
    .select('id, league, season, opponent, match_date, match_time, ground, home_away, status, team_score, opponent_score, result_text, result_type, summary_text, mvp_text, mvp_player_id')
    .eq('id', id)
    .single();
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  const [{ data: battingRows, error: battingError }, { data: bowlingRows, error: bowlingError }] = await Promise.all([
    supabaseServer
      .from('tccc_batting_innings')
      .select('player_id, unmatched_name, runs, balls, fours, sixes, not_out, dismissal, tccc_players(canonical_name)')
      .eq('match_id', id),
    supabaseServer
      .from('tccc_bowling_innings')
      .select('player_id, unmatched_name, overs, runs, wickets, wides, no_balls, maidens, tccc_players(canonical_name)')
      .eq('match_id', id),
  ]);
  if (battingError) return NextResponse.json({ error: battingError.message }, { status: 500 });
  if (bowlingError) return NextResponse.json({ error: bowlingError.message }, { status: 500 });

  return NextResponse.json({
    match,
    battingRows: (battingRows || []).map((r) => ({
      name: r.tccc_players?.canonical_name || r.unmatched_name || '',
      playerId: r.player_id,
      runs: r.runs || 0,
      balls: r.balls || 0,
      fours: r.fours || 0,
      sixes: r.sixes || 0,
      notOut: !!r.not_out,
      dismissal: r.dismissal || '',
    })),
    bowlingRows: (bowlingRows || []).map((r) => ({
      name: r.tccc_players?.canonical_name || r.unmatched_name || '',
      playerId: r.player_id,
      overs: r.overs || 0,
      runs: r.runs || 0,
      wickets: r.wickets || 0,
      wides: r.wides || 0,
      noBalls: r.no_balls || 0,
      maidens: r.maidens || 0,
    })),
  });
}
