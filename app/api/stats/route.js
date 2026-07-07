import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';

function playerName(row) {
  return row.tccc_players?.canonical_name || row.unmatched_name || 'Unknown';
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season') || 'all';

  let matchQuery = supabaseServer.from('tccc_matches').select('id, league').eq('team', 'TT');
  if (season !== 'all') matchQuery = matchQuery.eq('season', Number(season));

  const { data: matches, error: matchError } = await matchQuery;
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  const matchIds = matches.map((m) => m.id);
  if (matchIds.length === 0) return NextResponse.json({ batting: [], bowling: [] });

  // "SEASON" rows are a single synthetic match standing in for a whole
  // pre-migration season's totals (no real per-match breakdown exists for
  // them) — they can't be counted as "1 match played" the way a real match
  // can, so matches-played only counts real, individually-tracked matches.
  const realMatchIds = new Set(matches.filter((m) => m.league !== 'SEASON').map((m) => m.id));

  let adjustmentQuery = supabaseServer
    .from('tccc_player_match_adjustments')
    .select('season, extra_matches, tccc_players(canonical_name)');
  if (season !== 'all') adjustmentQuery = adjustmentQuery.eq('season', Number(season));

  const [
    { data: battingRows, error: battingError },
    { data: bowlingRows, error: bowlingError },
    { data: adjustmentRows, error: adjustmentError },
  ] = await Promise.all([
    supabaseServer
      .from('tccc_batting_innings')
      .select('match_id, runs, balls, fours, sixes, innings, not_out, not_out_count, unmatched_name, tccc_players(canonical_name)')
      .in('match_id', matchIds),
    supabaseServer
      .from('tccc_bowling_innings')
      .select('match_id, overs, runs, wickets, wides, no_balls, dots, unmatched_name, tccc_players(canonical_name)')
      .in('match_id', matchIds),
    adjustmentQuery,
  ]);

  if (battingError) return NextResponse.json({ error: battingError.message }, { status: 500 });
  if (bowlingError) return NextResponse.json({ error: bowlingError.message }, { status: 500 });
  if (adjustmentError) return NextResponse.json({ error: adjustmentError.message }, { status: 500 });

  // Matches played = distinct real matches the player has a batting OR
  // bowling row in (so a bowler who didn't bat, or vice versa, still counts
  // the match once rather than needing to appear in both), plus any manual
  // tccc_player_match_adjustments correction for matches that never produced
  // a stat row at all (see that table's comment for why those exist).
  const matchesByPlayer = new Map();
  for (const row of [...battingRows, ...bowlingRows]) {
    if (!realMatchIds.has(row.match_id)) continue;
    const name = playerName(row);
    if (!matchesByPlayer.has(name)) matchesByPlayer.set(name, new Set());
    matchesByPlayer.get(name).add(row.match_id);
  }

  const adjustmentsByPlayer = new Map();
  for (const row of adjustmentRows || []) {
    const name = row.tccc_players?.canonical_name;
    if (!name) continue;
    adjustmentsByPlayer.set(name, (adjustmentsByPlayer.get(name) || 0) + (row.extra_matches || 0));
  }

  const matchesPlayed = (name) =>
    (matchesByPlayer.get(name)?.size ?? 0) + (adjustmentsByPlayer.get(name) ?? 0);

  const battingMap = new Map();
  for (const row of battingRows) {
    const name = playerName(row);
    if (!battingMap.has(name)) {
      battingMap.set(name, { name, runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, notOuts: 0 });
    }
    const agg = battingMap.get(name);
    agg.runs += row.runs || 0;
    agg.balls += row.balls || 0;
    agg.fours += row.fours || 0;
    agg.sixes += row.sixes || 0;
    agg.innings += row.innings ?? 1;
    agg.notOuts += row.not_out_count ?? (row.not_out ? 1 : 0);
  }

  const batting = [...battingMap.values()]
    .map((p) => {
      const dismissals = p.innings - p.notOuts;
      return {
        name: p.name,
        matches: matchesPlayed(p.name),
        runs: p.runs,
        balls: p.balls,
        fours: p.fours,
        sixes: p.sixes,
        sr: p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '-',
        avg: dismissals > 0 ? (p.runs / dismissals).toFixed(1) : '-',
      };
    })
    .sort((a, b) => b.runs - a.runs);

  const bowlingMap = new Map();
  for (const row of bowlingRows) {
    const name = playerName(row);
    if (!bowlingMap.has(name)) {
      bowlingMap.set(name, { name, overs: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0 });
    }
    const agg = bowlingMap.get(name);
    agg.overs += row.overs || 0;
    agg.runs += row.runs || 0;
    agg.wickets += row.wickets || 0;
    agg.wides += row.wides || 0;
    agg.noBalls += row.no_balls || 0;
    agg.dots += row.dots || 0;
  }

  const bowling = [...bowlingMap.values()]
    .map((p) => ({
      name: p.name,
      matches: matchesPlayed(p.name),
      overs: p.overs,
      runs: p.runs,
      wickets: p.wickets,
      economy: p.overs > 0 ? (p.runs / p.overs).toFixed(1) : '-',
      dots: p.dots,
      wides: p.wides,
      noBalls: p.noBalls,
    }))
    .sort((a, b) => b.wickets - a.wickets);

  return NextResponse.json({ batting, bowling });
}
