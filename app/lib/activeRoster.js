import { supabaseServer } from './supabaseServer';

const CURRENT_SEASON = 2026;

// Confirmed by Shanthan to be on the current squad even though they don't
// have a real 2026 stat row yet (joined mid-season, fielded without
// batting/bowling, etc). Once a player here gets a real 2026 stat row they'll
// qualify automatically and can be dropped from this list.
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

// Returns the set of active TT player ids who count as "currently playing"
// (real 2026 match appearance, or manually confirmed) — shared by the public
// roster split (Active/Former tabs) and the Fantasy League pick list, so a
// player only shows up as pickable if they're actually on the current squad.
export async function getRecentPlayerIds(players) {
  const { data: matches } = await supabaseServer
    .from('tccc_matches')
    .select('id, league')
    .eq('team', 'TT')
    .eq('season', CURRENT_SEASON);

  // "SEASON" rows are the single synthetic aggregate match standing in for a
  // whole pre-migration season's totals — only 2026 has real per-match rows.
  const recentMatchIds = new Set((matches || []).filter((m) => m.league !== 'SEASON').map((m) => m.id));
  const playerIds = players.map((p) => p.id);

  const [{ data: battingRows }, { data: bowlingRows }] = await Promise.all([
    supabaseServer.from('tccc_batting_innings').select('player_id, match_id').in('player_id', playerIds),
    supabaseServer.from('tccc_bowling_innings').select('player_id, match_id').in('player_id', playerIds),
  ]);

  const recentPlayerIds = new Set();
  for (const row of [...(battingRows || []), ...(bowlingRows || [])]) {
    if (recentMatchIds.has(row.match_id)) recentPlayerIds.add(row.player_id);
  }

  for (const p of players) {
    if (MANUAL_ACTIVE_OVERRIDE.has(p.canonical_name)) recentPlayerIds.add(p.id);
  }

  return recentPlayerIds;
}
