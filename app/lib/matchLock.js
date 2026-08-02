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

// The Saturday/Sunday of the next upcoming weekend, as YYYY-MM-DD strings.
// If today itself is Saturday, "next" skips ahead 7 days rather than
// reusing today — a fantasy squad is for a match that hasn't happened yet,
// not the one currently underway.
function nextWeekendDates() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return [fmt(saturday), fmt(sunday)];
}

// Fantasy picks are scoped to whatever's on next weekend — one match if
// that's all there is, both if there's a Saturday and Sunday fixture,
// rather than a running list of the next several fixtures regardless of
// how far out they are. Falls back to just the single nearest scheduled
// match if the schedule doesn't happen to land on a Sat/Sun (e.g. a
// midweek MCPL fixture), so the squad builder still has something to
// point at instead of coming up empty.
export async function getUpcomingMatches() {
  const { data, error } = await supabaseServer
    .from('tccc_matches')
    .select('opponent, match_date')
    .eq('team', 'TT')
    .eq('status', 'scheduled')
    .neq('league', 'SEASON')
    .order('match_date', { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const [saturday, sunday] = nextWeekendDates();
  const weekendMatches = data.filter((m) => m.match_date === saturday || m.match_date === sunday);
  const relevant = weekendMatches.length > 0 ? weekendMatches : data.slice(0, 1);

  return relevant.map((m) => ({ opponent: m.opponent, matchDate: m.match_date }));
}
