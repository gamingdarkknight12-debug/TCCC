import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { getRecentPlayerIds } from '../../../lib/activeRoster';
import { oversToBalls, ballsToOvers, ballsToDecimalOvers } from '../../../lib/oversMath';
import { getPlayerAttributes } from '../../../play/game/data/playerAttributes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Public (no fantasy password gate, unlike /api/fantasy/roster) — this feeds
// the /play mini-game's team-select/draft screens. Returns the current
// active squad only (same getRecentPlayerIds cut Fantasy and the Players
// page use), each with aggregated batting/bowling stats AS NUMBERS (not the
// display-formatted strings /api/stats returns) since difficulty.js consumes
// them directly, plus the hand-authored playing-style attributes from
// app/play/game/data/playerAttributes.js.
export async function GET(request) {
  // See app/api/news/route.js for why this is needed — force-dynamic alone
  // wasn't enough to stop this route serving a frozen response in production.
  void request.headers.get('x-forwarded-for');

  const { data: players, error } = await supabaseServer
    .from('tccc_players')
    .select('id, canonical_name, role, skill, image_path')
    .eq('team', 'TT')
    .eq('active', true)
    .order('canonical_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recentPlayerIds = await getRecentPlayerIds(players);
  const pool = players.filter((p) => recentPlayerIds.has(p.id));
  const poolIds = pool.map((p) => p.id);

  const [{ data: battingRows, error: battingError }, { data: bowlingRows, error: bowlingError }] = await Promise.all([
    poolIds.length
      ? supabaseServer
          .from('tccc_batting_innings')
          .select('player_id, runs, balls, fours, sixes, innings, not_out, not_out_count')
          .in('player_id', poolIds)
      : { data: [], error: null },
    poolIds.length
      ? supabaseServer.from('tccc_bowling_innings').select('player_id, overs, runs, wickets').in('player_id', poolIds)
      : { data: [], error: null },
  ]);

  if (battingError) return NextResponse.json({ error: battingError.message }, { status: 500 });
  if (bowlingError) return NextResponse.json({ error: bowlingError.message }, { status: 500 });

  const battingAgg = new Map();
  for (const row of battingRows) {
    const agg = battingAgg.get(row.player_id) || { runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, notOuts: 0 };
    agg.runs += row.runs || 0;
    agg.balls += row.balls || 0;
    agg.fours += row.fours || 0;
    agg.sixes += row.sixes || 0;
    agg.innings += row.innings ?? 1;
    agg.notOuts += row.not_out_count ?? (row.not_out ? 1 : 0);
    battingAgg.set(row.player_id, agg);
  }

  const bowlingAgg = new Map();
  for (const row of bowlingRows) {
    const agg = bowlingAgg.get(row.player_id) || { balls: 0, runs: 0, wickets: 0 };
    agg.balls += oversToBalls(row.overs || 0);
    agg.runs += row.runs || 0;
    agg.wickets += row.wickets || 0;
    bowlingAgg.set(row.player_id, agg);
  }

  const result = pool.map((p) => {
    const bat = battingAgg.get(p.id);
    const bowl = bowlingAgg.get(p.id);
    const dismissals = bat ? bat.innings - bat.notOuts : 0;
    const bowlDecimalOvers = bowl ? ballsToDecimalOvers(bowl.balls) : 0;

    return {
      id: p.id,
      name: p.canonical_name,
      role: p.role,
      skill: p.skill,
      image: p.image_path,
      batting: bat
        ? {
            runs: bat.runs,
            balls: bat.balls,
            sr: bat.balls > 0 ? Number(((bat.runs / bat.balls) * 100).toFixed(1)) : null,
            avg: dismissals > 0 ? Number((bat.runs / dismissals).toFixed(1)) : null,
          }
        : { runs: 0, balls: 0, sr: null, avg: null },
      bowling: bowl
        ? {
            overs: ballsToOvers(bowl.balls),
            runs: bowl.runs,
            wickets: bowl.wickets,
            economy: bowlDecimalOvers > 0 ? Number((bowl.runs / bowlDecimalOvers).toFixed(1)) : null,
          }
        : { overs: 0, runs: 0, wickets: 0, economy: null },
      attributes: getPlayerAttributes(p.canonical_name),
    };
  });

  return NextResponse.json(
    { players: result },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
