import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';

const PUBLIC_STATUSES = ['scheduled', 'published', 'cancelled'];

function dayName(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season');
  const league = searchParams.get('league');

  let query = supabaseServer
    .from('tccc_matches')
    .select('id, league, season, opponent, match_date, match_time, ground, home_away, status, result_text, result_type, summary_text, mvp_text, team_score, opponent_score')
    .eq('team', 'TT')
    .in('status', PUBLIC_STATUSES)
    .neq('league', 'SEASON')
    .order('match_date', { ascending: true });

  if (season) query = query.eq('season', Number(season));
  if (league) query = query.eq('league', league);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const matchIds = data.map((m) => m.id);

  const [{ data: battingRows, error: battingError }, { data: bowlingRows, error: bowlingError }] = await Promise.all([
    matchIds.length
      ? supabaseServer
          .from('tccc_batting_innings')
          .select('match_id, runs, balls, unmatched_name, tccc_players(canonical_name)')
          .in('match_id', matchIds)
      : Promise.resolve({ data: [] }),
    matchIds.length
      ? supabaseServer
          .from('tccc_bowling_innings')
          .select('match_id, wickets, runs, unmatched_name, tccc_players(canonical_name)')
          .in('match_id', matchIds)
      : Promise.resolve({ data: [] }),
  ]);
  if (battingError) return NextResponse.json({ error: battingError.message }, { status: 500 });
  if (bowlingError) return NextResponse.json({ error: bowlingError.message }, { status: 500 });

  // Best batter/bowler per match = our own player with the most runs / most wickets
  // in that match's scorecard (ties broken by whoever appears first).
  const bestBatterByMatch = new Map();
  for (const row of battingRows || []) {
    const name = row.tccc_players?.canonical_name || row.unmatched_name;
    if (!name) continue;
    const current = bestBatterByMatch.get(row.match_id);
    if (!current || row.runs > current.runs) {
      bestBatterByMatch.set(row.match_id, { name, runs: row.runs || 0, balls: row.balls || 0 });
    }
  }

  const bestBowlerByMatch = new Map();
  for (const row of bowlingRows || []) {
    const name = row.tccc_players?.canonical_name || row.unmatched_name;
    if (!name) continue;
    const current = bestBowlerByMatch.get(row.match_id);
    if (!current || row.wickets > current.wickets) {
      bestBowlerByMatch.set(row.match_id, { name, wickets: row.wickets || 0, runs: row.runs || 0 });
    }
  }

  const matches = data.map((m) => ({
    id: m.id,
    league: m.league,
    season: m.season,
    opponent: m.opponent,
    date: m.match_date,
    day: dayName(m.match_date),
    time: m.match_time,
    ground: m.ground,
    homeAway: m.home_away,
    status: m.status,
    bestBatter: bestBatterByMatch.get(m.id) || null,
    bestBowler: bestBowlerByMatch.get(m.id) || null,
    result:
      m.status === 'scheduled'
        ? null
        : {
            result: m.result_text,
            resultType: m.result_type,
            summary: m.summary_text,
            mvp: m.mvp_text,
            teamScore: m.team_score,
            opponentScore: m.opponent_score,
          },
  }));

  return NextResponse.json({ matches });
}
