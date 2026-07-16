import { supabaseServer } from './supabaseServer';

// Local calendar day as YYYY-MM-DD — same day-granularity approach already
// used for poll reveal timing (see todayStr() in TeamHub.js). match_time is
// free-text and never validated (e.g. "7:30 AM"), so parsing it precisely
// risks locking at the wrong hour on a bad value; comparing dates only is
// safe and just locks a few hours earlier than the actual bowl time.
function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Fantasy picks lock for the whole day of the nearest still-scheduled real
// match, and reopen once that match is published (it drops out of the
// 'scheduled' query, so the next upcoming match — if any — becomes the one
// being checked). Prevents picking or editing a squad with knowledge of a
// match already underway.
export async function isFantasyLocked() {
  const { data, error } = await supabaseServer
    .from('tccc_matches')
    .select('opponent, match_date')
    .eq('team', 'TT')
    .eq('status', 'scheduled')
    .neq('league', 'SEASON')
    .order('match_date', { ascending: true })
    .limit(1);
  if (error) throw error;

  const nextMatch = data?.[0];
  if (!nextMatch) return { locked: false, reason: null };

  if (nextMatch.match_date <= todayStr()) {
    return { locked: true, reason: `Picks are closed — the match vs ${nextMatch.opponent} is underway. Reopens once results are published.` };
  }
  return { locked: false, reason: null };
}

// The next few scheduled real matches, so the squad-picking UI can say what
// the picks actually apply to (one match, or a whole weekend of them).
export async function getUpcomingMatches(limit = 3) {
  const { data, error } = await supabaseServer
    .from('tccc_matches')
    .select('opponent, match_date')
    .eq('team', 'TT')
    .eq('status', 'scheduled')
    .neq('league', 'SEASON')
    .order('match_date', { ascending: true })
    .limit(limit);
  if (error) throw error;

  return (data || []).map((m) => ({ opponent: m.opponent, matchDate: m.match_date }));
}
