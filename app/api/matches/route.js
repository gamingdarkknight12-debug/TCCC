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
    .select('id, league, season, opponent, match_date, match_time, ground, home_away, status, result_text, summary_text, mvp_text, team_score, opponent_score')
    .eq('team', 'TT')
    .in('status', PUBLIC_STATUSES)
    .neq('league', 'SEASON')
    .order('match_date', { ascending: true });

  if (season) query = query.eq('season', Number(season));
  if (league) query = query.eq('league', league);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
    result:
      m.status === 'scheduled'
        ? null
        : {
            result: m.result_text,
            summary: m.summary_text,
            mvp: m.mvp_text,
            teamScore: m.team_score,
            opponentScore: m.opponent_score,
          },
  }));

  return NextResponse.json({ matches });
}
