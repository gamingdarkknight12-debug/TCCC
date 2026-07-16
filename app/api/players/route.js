import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request) {
  // See app/api/news/route.js for why this is needed — force-dynamic alone
  // wasn't enough to stop this route serving a frozen response in production.
  void request.headers.get('x-forwarded-for');

  const CURRENT_SEASON = 2026;

  // Confirmed by Shanthan to be on the current squad even though they don't
  // have a real 2026 stat row yet (joined mid-season, fielded without
  // batting/bowling, etc). Once a player here gets a real 2026 stat row
  // they'll qualify automatically and can be dropped from this list.
  const MANUAL_ACTIVE_OVERRIDE = new Set([
    'Dheeraj A',
    'Mallikarjun',
    'Manish Raj',
    'Prashanth',
    'Ramkiran Nersu',
    'Ram Sandeep Chimata',
    'Sai Swethan',
    'Siddarth Narasimhan',
    'Sreekanth Reddy',
  ]);

  const [{ data, error }, { data: matches }] = await Promise.all([
    supabaseServer
      .from('tccc_players')
      .select('id, canonical_name, role, skill, image_path')
      .eq('team', 'TT')
      .eq('active', true)
      .order('canonical_name'),
    supabaseServer.from('tccc_matches').select('id, season, league').eq('team', 'TT').eq('season', CURRENT_SEASON),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // "SEASON" rows are the single synthetic aggregate match standing in for a
  // whole pre-migration season's totals (every season through 2025 is one of
  // these — only 2026 has real per-match rows). Counting that placeholder as
  // "played this season" is how a player with zero real 2026 appearances
  // could still show as active — this only counts real matches.
  const recentMatchIds = new Set((matches || []).filter((m) => m.league !== 'SEASON').map((m) => m.id));
  const playerIds = data.map((p) => p.id);

  const [{ data: battingRows }, { data: bowlingRows }] = await Promise.all([
    supabaseServer.from('tccc_batting_innings').select('player_id, match_id').in('player_id', playerIds),
    supabaseServer.from('tccc_bowling_innings').select('player_id, match_id').in('player_id', playerIds),
  ]);

  const recentPlayerIds = new Set();
  for (const row of [...(battingRows || []), ...(bowlingRows || [])]) {
    if (recentMatchIds.has(row.match_id)) recentPlayerIds.add(row.player_id);
  }

  const players = data.map((p) => ({
    name: p.canonical_name,
    role: p.role,
    skill: p.skill,
    image: p.image_path,
    // Played (batted or bowled) in a real 2026 match, or manually confirmed
    // — used to split the roster into "Active Players" and "Former Players"
    // tabs, rather than showing every player who's ever worn the shirt in
    // one long list.
    recent: recentPlayerIds.has(p.id) || MANUAL_ACTIVE_OVERRIDE.has(p.canonical_name),
  }));

  return NextResponse.json(
    { players },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
