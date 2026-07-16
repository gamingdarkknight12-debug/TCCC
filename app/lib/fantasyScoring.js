import { supabaseServer } from './supabaseServer';

// Fantasy scoring is per-match, not accumulated raw points: each squad's
// match score is 1 pt/run + 20 pts/wicket + 5 pts/catch + 5 pts/run-out
// across its 4 picks (Captain x2, Vice-Captain x1.5), but that score only
// decides who WINS the match — the winner (or every squad tied at the top —
// ties all get full credit, not split) gets 1 league point for that match.
// fantasy_scores.points is that league point (0 or 1); raw_points keeps the
// underlying score so any week's result is auditable, since real prize
// money rides on the season standings. Catches/run-outs come from
// tccc_fielding_stats — a manual escape-hatch table (see its migration
// comment) since the scorecard pipeline doesn't capture fielding at all.
// Recomputed on every published match (upsert on (fantasy_team_id,
// match_id), so re-publishing a corrected scorecard, or adding fielding
// stats afterward, overwrites that match's result rather than
// double-counting). A team becomes "locked" for editing once it has any
// fantasy_scores row — so a team only gets a row here if at least one of
// its own 4 picks actually contributed (batted, bowled, or fielded) in this
// match; a team whose picks sat this one out entirely shouldn't get locked
// over a match that had nothing to do with them.
//
// Returns the per-team raw scores + which team(s) won, so callers (the
// post-publish admin flow) can display the result without a second query.
export async function recalculateFantasyPoints(matchId) {
  const [{ data: battingRows }, { data: bowlingRows }, { data: fieldingRows }, { data: teams }] = await Promise.all([
    supabaseServer.from('tccc_batting_innings').select('player_id, runs').eq('match_id', matchId),
    supabaseServer.from('tccc_bowling_innings').select('player_id, wickets').eq('match_id', matchId),
    supabaseServer.from('tccc_fielding_stats').select('player_id, catches, run_outs').eq('match_id', matchId),
    supabaseServer
      .from('fantasy_teams')
      .select('id, owner_name, batter1_id, batter2_id, bowler1_id, bowler2_id, captain_player_id, vice_captain_player_id'),
  ]);
  if (!teams || teams.length === 0) return { teamScores: [], winners: [] };

  const rawScoreByPlayer = new Map();
  for (const r of battingRows || []) {
    if (!r.player_id) continue;
    rawScoreByPlayer.set(r.player_id, (rawScoreByPlayer.get(r.player_id) || 0) + (r.runs || 0) * 1);
  }
  for (const r of bowlingRows || []) {
    if (!r.player_id) continue;
    rawScoreByPlayer.set(r.player_id, (rawScoreByPlayer.get(r.player_id) || 0) + (r.wickets || 0) * 20);
  }
  for (const r of fieldingRows || []) {
    if (!r.player_id) continue;
    const points = (r.catches || 0) * 5 + (r.run_outs || 0) * 5;
    rawScoreByPlayer.set(r.player_id, (rawScoreByPlayer.get(r.player_id) || 0) + points);
  }
  if (rawScoreByPlayer.size === 0) return { teamScores: [], winners: [] };

  const eligibleTeams = teams.filter((t) =>
    [t.batter1_id, t.batter2_id, t.bowler1_id, t.bowler2_id].some((id) => rawScoreByPlayer.has(id))
  );
  if (eligibleTeams.length === 0) return { teamScores: [], winners: [] };

  const teamRawScores = eligibleTeams.map((t) => {
    const picks = [t.batter1_id, t.batter2_id, t.bowler1_id, t.bowler2_id];
    const rawScore = picks.reduce((sum, playerId) => {
      const base = rawScoreByPlayer.get(playerId) || 0;
      const multiplier = playerId === t.captain_player_id ? 2 : playerId === t.vice_captain_player_id ? 1.5 : 1;
      return sum + base * multiplier;
    }, 0);
    return { team: t, rawScore };
  });

  const maxRawScore = Math.max(...teamRawScores.map((t) => t.rawScore));

  const rows = teamRawScores.map(({ team, rawScore }) => ({
    fantasy_team_id: team.id,
    match_id: matchId,
    raw_points: rawScore,
    points: rawScore === maxRawScore ? 1 : 0,
  }));

  const { error } = await supabaseServer.from('fantasy_scores').upsert(rows, { onConflict: 'fantasy_team_id,match_id' });
  if (error) throw error;

  return {
    teamScores: teamRawScores.map(({ team, rawScore }) => ({ ownerName: team.owner_name, rawScore, won: rawScore === maxRawScore })),
    winners: teamRawScores.filter((t) => t.rawScore === maxRawScore).map((t) => t.team.owner_name),
  };
}

// Season standings — points is the count of match-wins (fantasy_scores.points
// is already 0/1 per match, so summing it directly gives win-count).
export async function getFantasyStandings() {
  const { data: teams, error } = await supabaseServer.from('fantasy_teams').select('id, owner_name');
  if (error) throw error;

  const { data: scores, error: scoreError } = await supabaseServer.from('fantasy_scores').select('fantasy_team_id, points');
  if (scoreError) throw scoreError;

  const pointsByTeam = new Map();
  for (const s of scores || []) {
    pointsByTeam.set(s.fantasy_team_id, (pointsByTeam.get(s.fantasy_team_id) || 0) + Number(s.points || 0));
  }

  return (teams || [])
    .map((t) => ({ ownerName: t.owner_name, points: pointsByTeam.get(t.id) || 0 }))
    .sort((a, b) => b.points - a.points);
}
