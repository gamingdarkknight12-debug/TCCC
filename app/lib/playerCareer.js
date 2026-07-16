import { supabaseServer } from './supabaseServer';

// Season-by-season + career totals for one player, on a single canonical
// roster name. Mirrors the matches-played logic in app/api/stats/route.js
// (synthetic "SEASON" aggregate matches don't count as 1 match played, but
// their runs/wickets still count; tccc_player_match_adjustments corrects for
// real matches that never produced a stat row) so a player's profile page
// numbers always agree with the Stats page for the same player.
export async function getPlayerCareer(canonicalName) {
  const { data: matches } = await supabaseServer
    .from('tccc_matches')
    .select('id, league, season')
    .eq('team', 'TT');

  const matchIds = (matches || []).map((m) => m.id);
  const seasonByMatchId = new Map((matches || []).map((m) => [m.id, m.season]));
  const realMatchIds = new Set((matches || []).filter((m) => m.league !== 'SEASON').map((m) => m.id));

  if (matchIds.length === 0) {
    return { seasons: [], career: emptyCareer() };
  }

  const [{ data: battingRows }, { data: bowlingRows }, { data: adjustmentRows }] = await Promise.all([
    supabaseServer
      .from('tccc_batting_innings')
      .select('match_id, runs, balls, fours, sixes, innings, not_out, not_out_count, tccc_players(canonical_name)')
      .in('match_id', matchIds),
    supabaseServer
      .from('tccc_bowling_innings')
      .select('match_id, overs, runs, wickets, tccc_players(canonical_name)')
      .in('match_id', matchIds),
    supabaseServer
      .from('tccc_player_match_adjustments')
      .select('season, extra_matches, tccc_players(canonical_name)'),
  ]);

  const myBatting = (battingRows || []).filter((r) => r.tccc_players?.canonical_name === canonicalName);
  const myBowling = (bowlingRows || []).filter((r) => r.tccc_players?.canonical_name === canonicalName);
  const myAdjustments = (adjustmentRows || []).filter((r) => r.tccc_players?.canonical_name === canonicalName);

  // matches played per season = distinct real matches this player has a
  // batting OR bowling row in, plus any manual adjustment for that season.
  const realMatchesBySeason = new Map(); // season -> Set(matchId)
  for (const row of [...myBatting, ...myBowling]) {
    if (!realMatchIds.has(row.match_id)) continue;
    const season = seasonByMatchId.get(row.match_id);
    if (!realMatchesBySeason.has(season)) realMatchesBySeason.set(season, new Set());
    realMatchesBySeason.get(season).add(row.match_id);
  }
  const adjustmentsBySeason = new Map();
  for (const row of myAdjustments) {
    adjustmentsBySeason.set(row.season, (adjustmentsBySeason.get(row.season) || 0) + (row.extra_matches || 0));
  }
  const matchesPlayed = (season) =>
    (realMatchesBySeason.get(season)?.size ?? 0) + (adjustmentsBySeason.get(season) ?? 0);

  const battingBySeason = new Map();
  for (const row of myBatting) {
    const season = seasonByMatchId.get(row.match_id);
    const agg = battingBySeason.get(season) || { runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, notOuts: 0 };
    agg.runs += row.runs || 0;
    agg.balls += row.balls || 0;
    agg.fours += row.fours || 0;
    agg.sixes += row.sixes || 0;
    agg.innings += row.innings ?? 1;
    agg.notOuts += row.not_out_count ?? (row.not_out ? 1 : 0);
    battingBySeason.set(season, agg);
  }

  const bowlingBySeason = new Map();
  for (const row of myBowling) {
    const season = seasonByMatchId.get(row.match_id);
    const agg = bowlingBySeason.get(season) || { overs: 0, runs: 0, wickets: 0 };
    agg.overs += row.overs || 0;
    agg.runs += row.runs || 0;
    agg.wickets += row.wickets || 0;
    bowlingBySeason.set(season, agg);
  }

  const seasonNumbers = [...new Set([...battingBySeason.keys(), ...bowlingBySeason.keys(), ...adjustmentsBySeason.keys()])]
    .filter((s) => s !== undefined && s !== null)
    .sort((a, b) => b - a);

  const seasons = seasonNumbers.map((season) => {
    const bat = battingBySeason.get(season) || { runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, notOuts: 0 };
    const bowl = bowlingBySeason.get(season) || { overs: 0, runs: 0, wickets: 0 };
    const dismissals = bat.innings - bat.notOuts;
    return {
      season,
      matches: matchesPlayed(season),
      runs: bat.runs,
      balls: bat.balls,
      fours: bat.fours,
      sixes: bat.sixes,
      sr: bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : '-',
      avg: dismissals > 0 ? (bat.runs / dismissals).toFixed(1) : '-',
      overs: bowl.overs,
      wickets: bowl.wickets,
      economy: bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(1) : '-',
    };
  });

  const totals = seasons.reduce(
    (acc, s) => {
      acc.matches += s.matches;
      acc.runs += s.runs;
      acc.balls += s.balls;
      acc.wickets += s.wickets;
      acc.overs += s.overs;
      acc.bowlingRuns += bowlingBySeason.get(s.season)?.runs || 0;
      acc.innings += battingBySeason.get(s.season)?.innings || 0;
      acc.notOuts += battingBySeason.get(s.season)?.notOuts || 0;
      return acc;
    },
    { matches: 0, runs: 0, balls: 0, wickets: 0, overs: 0, bowlingRuns: 0, innings: 0, notOuts: 0 }
  );
  const careerDismissals = totals.innings - totals.notOuts;

  const career = {
    matches: totals.matches,
    runs: totals.runs,
    wickets: totals.wickets,
    avg: careerDismissals > 0 ? (totals.runs / careerDismissals).toFixed(1) : '-',
    economy: totals.overs > 0 ? (totals.bowlingRuns / totals.overs).toFixed(1) : '-',
  };

  return { seasons, career };
}

function emptyCareer() {
  return { matches: 0, runs: 0, wickets: 0, avg: '-', economy: '-' };
}
