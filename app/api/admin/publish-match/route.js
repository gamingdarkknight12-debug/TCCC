import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

// A short, punchy headline for the news card — the full blow-by-blow lives
// in the body via summaryText. Using resultText (a full sentence) as the
// title made every card read like a wall of text with no visual hierarchy.
function shortNewsTitle(opponent, resultType) {
  switch (resultType) {
    case 'win': return `Titans Beat ${opponent}`;
    case 'loss': return `Titans Fall to ${opponent}`;
    case 'tie': return `Titans Tie with ${opponent}`;
    case 'no_result': return `Match vs ${opponent} Abandoned`;
    default: return `Telugu Titans vs ${opponent}`;
  }
}

// Creates or refreshes a single evergreen card (matched by its tag) instead
// of inserting a new one every publish — otherwise "Best Batter" would pile
// up a duplicate every week instead of just staying current.
async function upsertEvergreenCard({ tag, title, body, publishedAt }) {
  const { data: existing } = await supabaseServer
    .from('tccc_news_items')
    .select('id')
    .eq('team', 'TT')
    .eq('tag', tag)
    .limit(1);

  const fields = { title, body, status: 'published', published_at: publishedAt };
  if (existing && existing.length > 0) {
    await supabaseServer.from('tccc_news_items').update(fields).eq('id', existing[0].id);
  } else {
    await supabaseServer.from('tccc_news_items').insert({
      team: 'TT',
      kind: 'manual',
      placement: 'small',
      tag,
      ...fields,
    });
  }
}

// There is only ever one "Latest Match" slot in the flow grid — each publish
// replaces it in place (matched by kind, regardless of league/tag, since the
// display tag changes match to match) rather than piling up a new recap
// card every week alongside the evergreen stat cards.
async function upsertLatestMatchCard(fields) {
  const { data: existing } = await supabaseServer
    .from('tccc_news_items')
    .select('id')
    .eq('team', 'TT')
    .eq('kind', 'match_recap')
    .limit(1);

  if (existing && existing.length > 0) {
    await supabaseServer.from('tccc_news_items').update(fields).eq('id', existing[0].id);
  } else {
    await supabaseServer.from('tccc_news_items').insert({ team: 'TT', kind: 'match_recap', ...fields });
  }
}

// Same aggregation as /api/stats?season=, trimmed to just the totals needed
// here (top scorers/wicket-takers) for the season the just-published match
// belongs to. Also used to build a short, curated options list for prediction
// polls instead of dumping the entire roster in as options.
async function getSeasonLeaders(season) {
  const { data: matches } = await supabaseServer.from('tccc_matches').select('id').eq('team', 'TT').eq('season', season);
  const matchIds = (matches || []).map((m) => m.id);
  if (matchIds.length === 0) return { topBatter: null, topBowler: null, topBatters: [], topBowlers: [] };

  const [{ data: battingRows }, { data: bowlingRows }] = await Promise.all([
    supabaseServer.from('tccc_batting_innings').select('runs, balls, player_id, tccc_players(canonical_name)').in('match_id', matchIds),
    supabaseServer.from('tccc_bowling_innings').select('wickets, runs, player_id, tccc_players(canonical_name)').in('match_id', matchIds),
  ]);

  const battingTotals = new Map();
  for (const r of battingRows || []) {
    if (!r.player_id) continue;
    const name = r.tccc_players?.canonical_name;
    if (!name) continue;
    const agg = battingTotals.get(name) || { name, runs: 0, balls: 0 };
    agg.runs += r.runs || 0;
    agg.balls += r.balls || 0;
    battingTotals.set(name, agg);
  }

  const bowlingTotals = new Map();
  for (const r of bowlingRows || []) {
    if (!r.player_id) continue;
    const name = r.tccc_players?.canonical_name;
    if (!name) continue;
    const agg = bowlingTotals.get(name) || { name, wickets: 0, runs: 0 };
    agg.wickets += r.wickets || 0;
    agg.runs += r.runs || 0;
    bowlingTotals.set(name, agg);
  }

  const battingSorted = [...battingTotals.values()].sort((a, b) => b.runs - a.runs);
  const bowlingSorted = [...bowlingTotals.values()].sort((a, b) => b.wickets - a.wickets);
  return {
    topBatter: battingSorted[0] || null,
    topBowler: bowlingSorted[0] || null,
    topBatters: battingSorted.slice(0, 5).map((b) => b.name),
    topBowlers: bowlingSorted.slice(0, 5).map((b) => b.name),
  };
}

// Same counting as /api/standings, scoped to one league/season.
async function getLeagueRecord(league, season) {
  const { data } = await supabaseServer
    .from('tccc_matches')
    .select('result_type')
    .eq('team', 'TT')
    .eq('league', league)
    .eq('season', season)
    .in('status', ['published', 'cancelled']);

  const rec = { played: 0, won: 0, lost: 0, tie: 0, noResult: 0 };
  for (const row of data || []) {
    rec.played += 1;
    if (row.result_type === 'win') rec.won += 1;
    else if (row.result_type === 'loss') rec.lost += 1;
    else if (row.result_type === 'tie') rec.tie += 1;
    else rec.noResult += 1;
  }
  return rec;
}

// Round-number career milestones worth celebrating. Runs go by 250s/500s
// once past 1000 (a "reached 1500" card matters more often at that level);
// wickets by smaller, more frequent steps since totals run much lower.
const BATTING_MILESTONES = [50, 100, 250, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000];
const BOWLING_MILESTONES = [10, 25, 50, 75, 100, 150, 200, 250, 300];

function milestoneCrossed(before, after, milestones) {
  return milestones.find((m) => before < m && after >= m) || null;
}

function nextMilestone(current, milestones) {
  return milestones.find((m) => m > current) || null;
}

// Career (all-time, every season) totals per player — includes the
// pre-migration "SEASON" aggregate rows, unlike matches-played counting,
// since a milestone is about cumulative runs/wickets, not games attended.
async function getAllTimePlayerTotals() {
  const { data: matches } = await supabaseServer.from('tccc_matches').select('id').eq('team', 'TT');
  const matchIds = (matches || []).map((m) => m.id);
  const totals = new Map(); // name -> { runs, wickets }
  if (matchIds.length === 0) return totals;

  const [{ data: bat }, { data: bowl }] = await Promise.all([
    supabaseServer.from('tccc_batting_innings').select('runs, player_id, tccc_players(canonical_name)').in('match_id', matchIds),
    supabaseServer.from('tccc_bowling_innings').select('wickets, player_id, tccc_players(canonical_name)').in('match_id', matchIds),
  ]);
  for (const r of bat || []) {
    const name = r.tccc_players?.canonical_name;
    if (!r.player_id || !name) continue;
    if (!totals.has(name)) totals.set(name, { runs: 0, wickets: 0 });
    totals.get(name).runs += r.runs || 0;
  }
  for (const r of bowl || []) {
    const name = r.tccc_players?.canonical_name;
    if (!r.player_id || !name) continue;
    if (!totals.has(name)) totals.set(name, { runs: 0, wickets: 0 });
    totals.get(name).wickets += r.wickets || 0;
  }
  return totals;
}

// One "Milestone Watch" card (upserted, never more than one): celebrates
// whichever player crossed a round-number career milestone in the match
// that was just published, or — if nobody did — teases whoever across the
// whole roster is currently closest to their next one.
async function upsertMilestoneCard(battingInsert, bowlingInsert, publishedAt) {
  const allTime = await getAllTimePlayerTotals(); // already includes this match's rows

  const thisMatchRuns = new Map();
  for (const r of battingInsert) {
    if (!r.player_id) continue;
    thisMatchRuns.set(r.player_id, (thisMatchRuns.get(r.player_id) || 0) + (r.runs || 0));
  }
  const thisMatchWickets = new Map();
  for (const r of bowlingInsert) {
    if (!r.player_id) continue;
    thisMatchWickets.set(r.player_id, (thisMatchWickets.get(r.player_id) || 0) + (r.wickets || 0));
  }

  const playerIds = [...new Set([...thisMatchRuns.keys(), ...thisMatchWickets.keys()])];
  const nameById = new Map();
  if (playerIds.length > 0) {
    const { data: players } = await supabaseServer.from('tccc_players').select('id, canonical_name').in('id', playerIds);
    for (const p of players || []) nameById.set(p.id, p.canonical_name);
  }

  let reached = null; // { name, stat, milestone }
  for (const [playerId, runsThisMatch] of thisMatchRuns) {
    const name = nameById.get(playerId);
    if (!name) continue;
    const after = allTime.get(name)?.runs || 0;
    const crossed = milestoneCrossed(after - runsThisMatch, after, BATTING_MILESTONES);
    if (crossed && (!reached || crossed > reached.milestone)) reached = { name, stat: 'runs', milestone: crossed };
  }
  for (const [playerId, wicketsThisMatch] of thisMatchWickets) {
    const name = nameById.get(playerId);
    if (!name) continue;
    const after = allTime.get(name)?.wickets || 0;
    const crossed = milestoneCrossed(after - wicketsThisMatch, after, BOWLING_MILESTONES);
    if (crossed && (!reached || crossed > reached.milestone)) reached = { name, stat: 'wickets', milestone: crossed };
  }

  if (reached) {
    const statLabel = reached.stat === 'runs' ? 'Runs' : 'Wickets';
    await upsertEvergreenCard({
      tag: 'Milestone Watch',
      title: `🎉 ${reached.name} Reaches ${reached.milestone} ${statLabel}!`,
      body: `${reached.name} has now reached ${reached.milestone} career ${reached.stat} for Telugu Titans.`,
      publishedAt,
    });
    return;
  }

  let closest = null; // { name, stat, gap, target }
  for (const [name, totals] of allTime) {
    const nextRuns = nextMilestone(totals.runs, BATTING_MILESTONES);
    if (nextRuns) {
      const gap = nextRuns - totals.runs;
      if (!closest || gap < closest.gap) closest = { name, stat: 'runs', gap, target: nextRuns };
    }
    const nextWkts = nextMilestone(totals.wickets, BOWLING_MILESTONES);
    if (nextWkts) {
      const gap = nextWkts - totals.wickets;
      if (!closest || gap < closest.gap) closest = { name, stat: 'wickets', gap, target: nextWkts };
    }
  }

  if (closest) {
    const statWord = closest.stat === 'runs' ? (closest.gap === 1 ? 'run' : 'runs') : (closest.gap === 1 ? 'wicket' : 'wickets');
    await upsertEvergreenCard({
      tag: 'Milestone Watch',
      title: `${closest.name} Closing In on ${closest.target} ${closest.stat === 'runs' ? 'Runs' : 'Wickets'}`,
      body: `${closest.name} is just ${closest.gap} ${statWord} away from ${closest.target} career ${closest.stat === 'runs' ? 'runs' : 'wickets'} for Telugu Titans.`,
      publishedAt,
    });
  }
}

// Names of our own players who were named MVP in the last few played
// matches (most recent first, deduped) — used as the options for the
// "who will be Player of the Match" prediction poll instead of the whole
// roster. Opponent MVPs (mvp_player_id null, e.g. their player won it)
// are skipped since they'd never be a valid TT answer anyway.
async function getRecentMvpNames(limit = 5) {
  const { data } = await supabaseServer
    .from('tccc_matches')
    .select('mvp_player_id, match_date, tccc_players(canonical_name)')
    .eq('team', 'TT')
    .eq('status', 'published')
    .not('mvp_player_id', 'is', null)
    .order('match_date', { ascending: false })
    .limit(20);

  const names = [];
  for (const row of data || []) {
    const name = row.tccc_players?.canonical_name;
    if (name && !names.includes(name)) names.push(name);
    if (names.length >= limit) break;
  }
  return names;
}

// A rotating pool of prediction questions — picking a different 3 each time
// (seeded by the next match's id) keeps them varied instead of asking the
// same question every week. Player-based ones use a short, smart shortlist
// (top 5 by the relevant stat, or the last 5 real MVPs) instead of the full
// roster, since a 15+ option poll button list is unusable. Requires at least
// 2 options — a poll with a single candidate (e.g. only one MVP recorded so
// far this season) isn't a real prediction. Deliberately no "Will TT beat
// {opponent}?" or outcome-doubting templates (e.g. "will it be one-sided?")
// — asking teammates to vote Win/Loss/Tie or bet against a close game reads
// as betting against your own team; every template here is something to be
// excited about regardless of the result.
function predictionTemplates(opponent, suffix, { topBatters, topBowlers, recentMvps }) {
  return [
    { q: `Who scores the most runs ${suffix}?`, options: topBatters },
    { q: `Who takes the most wickets ${suffix}?`, options: topBowlers },
    { q: `Will TT post 150+ runs ${suffix}?`, options: ['Yes', 'No'] },
    { q: `Who will be Player of the Match ${suffix}?`, options: recentMvps },
    { q: `Will a Titans batter hit a half-century (50+) ${suffix}?`, options: ['Yes', 'No'] },
    { q: `How many sixes will Titans hit ${suffix}?`, options: ['Under 3', '3 to 6', '7+'] },
    { q: `Who takes the first wicket ${suffix}?`, options: topBowlers },
    { q: `Will Titans win the toss ${suffix}?`, options: ['Yes', 'No'] },
  ].filter((t) => t.options.length > 1);
}

// Deterministic seeded shuffle (mulberry32) so the 3 picked questions vary
// week to week without being random on every request — same match id always
// produces the same shuffle, but consecutive match ids land on different
// permutations of the pool instead of an adjacent, thematically-similar slice.
function seededShuffle(items, seed) {
  let state = seed;
  const next = () => {
    state |= 0; state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Triggered right after publishing a match (no cron/scheduling needed) —
// creates 3 prediction polls for whichever match is next on the schedule,
// which then sit open for voting until that match is played. Old prediction
// polls (from whichever match was "next" before this one) are removed first
// so Voting Arena doesn't accumulate a growing pile of stale predictions —
// only the current upcoming match's polls are ever shown.
async function createPredictionPolls(afterMatchDate) {
  const { data: nextMatchRows } = await supabaseServer
    .from('tccc_matches')
    .select('id, season, opponent, match_date')
    .eq('team', 'TT')
    .eq('status', 'scheduled')
    .gt('match_date', afterMatchDate)
    .order('match_date', { ascending: true })
    .limit(1);

  const nextMatch = nextMatchRows?.[0];
  if (!nextMatch) return;

  const shortDate = new Date(nextMatch.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const suffix = `vs ${nextMatch.opponent} (${shortDate})`;

  const { data: existingPredictionRows } = await supabaseServer
    .from('teamhub_polls')
    .select('id, match_date')
    .ilike('poll_name', `Predict:%${suffix}`)
    .limit(1);
  // Already created for this match — unless those rows predate match_date being
  // tracked (null), in which case fall through and recreate them properly.
  if (existingPredictionRows && existingPredictionRows.length > 0 && existingPredictionRows[0].match_date) return;

  const [{ topBatters, topBowlers }, recentMvps] = await Promise.all([
    getSeasonLeaders(nextMatch.season),
    getRecentMvpNames(5),
  ]);
  if (topBatters.length === 0 && topBowlers.length === 0 && recentMvps.length === 0) return;

  // Clear out whatever prediction polls were made for the previous "next
  // match" — they're for a match that's now been played, so they're stale.
  await supabaseServer.from('teamhub_polls').delete().ilike('poll_name', 'Predict:%');

  const templates = predictionTemplates(nextMatch.opponent, suffix, { topBatters, topBowlers, recentMvps });
  if (templates.length === 0) return;

  // Rotate which questions get picked so it's not the same 3 every week —
  // shuffle the whole eligible pool (seeded by the next match's id) and take
  // the first 3, rather than a contiguous slice, so the picks aren't always
  // adjacent, thematically-similar entries when the pool has shrunk (e.g.
  // early season, before top-5/MVP lists have much data yet).
  const picks = seededShuffle(templates, nextMatch.id).slice(0, Math.min(3, templates.length));

  const rows = [];
  picks.forEach(({ q, options }) => {
    options.forEach((opt) => rows.push({ poll_name: `Predict: ${q}`, option_name: opt, votes: 0, match_date: nextMatch.match_date }));
  });
  await supabaseServer.from('teamhub_polls').insert(rows);
}

export async function POST(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await req.json();
  const {
    matchId,
    status,
    league,
    season,
    opponent,
    matchDate,
    matchTime,
    ground,
    homeAway,
    teamScore,
    opponentScore,
    resultText,
    resultType,
    summaryText,
    mvpText,
    mvpPlayerId,
    sourceType,
    sourceFileName,
    rawExtraction,
    battingRows = [],
    bowlingRows = [],
    createNews,
    newsTag,
  } = body;

  if (!opponent || !matchDate || !league) {
    return NextResponse.json({ error: 'Opponent, match date, and league are required.' }, { status: 400 });
  }

  const matchStatus = status === 'draft' ? 'draft' : 'published';

  const matchFields = {
    league,
    season: season || new Date(matchDate).getFullYear(),
    opponent,
    match_date: matchDate,
    match_time: matchTime || null,
    ground: ground || null,
    home_away: homeAway || null,
    status: matchStatus,
    source_type: sourceType || 'manual',
    source_file_name: sourceFileName || null,
    result_text: resultText || null,
    result_type: resultType || null,
    summary_text: summaryText || null,
    mvp_text: mvpText || null,
    mvp_player_id: mvpPlayerId || null,
    team_score: teamScore || null,
    opponent_score: opponentScore || null,
    raw_extraction: rawExtraction || null,
  };

  let match;
  if (matchId) {
    // Attaching a scorecard to an existing (usually scheduled) match — update
    // it in place and clear any prior innings rows so re-imports don't duplicate.
    const { data, error } = await supabaseServer
      .from('tccc_matches')
      .update(matchFields)
      .eq('id', matchId)
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    match = data;

    await supabaseServer.from('tccc_batting_innings').delete().eq('match_id', matchId);
    await supabaseServer.from('tccc_bowling_innings').delete().eq('match_id', matchId);
  } else {
    const { data, error } = await supabaseServer
      .from('tccc_matches')
      .insert({ team: 'TT', ...matchFields })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    match = data;
  }

  const battingInsert = battingRows.map((r) => ({
    match_id: match.id,
    player_id: r.playerId || null,
    unmatched_name: r.playerId ? null : (r.name || null),
    runs: r.runs || 0,
    balls: r.balls || 0,
    fours: r.fours || 0,
    sixes: r.sixes || 0,
    not_out: !!r.notOut,
    dismissal: r.dismissal || null,
  }));

  const bowlingInsert = bowlingRows.map((r) => ({
    match_id: match.id,
    player_id: r.playerId || null,
    unmatched_name: r.playerId ? null : (r.name || null),
    overs: r.overs || 0,
    runs: r.runs || 0,
    wickets: r.wickets || 0,
    wides: r.wides || 0,
    no_balls: r.noBalls || 0,
    dots: r.dots ?? null,
    maidens: r.maidens ?? null,
  }));

  if (battingInsert.length) {
    const { error } = await supabaseServer.from('tccc_batting_innings').insert(battingInsert);
    if (error) return NextResponse.json({ error: `Match saved, but batting rows failed: ${error.message}`, matchId: match.id }, { status: 500 });
  }

  if (bowlingInsert.length) {
    const { error } = await supabaseServer.from('tccc_bowling_innings').insert(bowlingInsert);
    if (error) return NextResponse.json({ error: `Match saved, but bowling rows failed: ${error.message}`, matchId: match.id }, { status: 500 });
  }

  let mvpPlayer = null;
  let resolvedMvpPlayerId = mvpPlayerId || null;
  if (mvpPlayerId) {
    const { data } = await supabaseServer
      .from('tccc_players')
      .select('canonical_name, image_path')
      .eq('id', mvpPlayerId)
      .single();
    mvpPlayer = data || null;
  }

  // No MVP explicitly chosen during review — auto-pick this match's standout
  // performer (best knock vs best bowling spell, weighting a wicket roughly
  // like 20 runs of impact) so the carousel still gets a highlight every
  // match instead of silently doing nothing.
  if (!mvpPlayer) {
    const bestBat = [...battingRows].filter((r) => r.playerId).sort((a, b) => (b.runs || 0) - (a.runs || 0))[0];
    const bestBowl = [...bowlingRows].filter((r) => r.playerId).sort((a, b) => (b.wickets || 0) - (a.wickets || 0))[0];
    const batScore = bestBat?.runs || 0;
    const bowlScore = (bestBowl?.wickets || 0) * 20;
    const standoutId = bowlScore > batScore ? bestBowl?.playerId : (bestBat?.playerId || bestBowl?.playerId);
    if (standoutId) {
      const { data } = await supabaseServer
        .from('tccc_players')
        .select('canonical_name, image_path')
        .eq('id', standoutId)
        .single();
      mvpPlayer = data || null;
      resolvedMvpPlayerId = standoutId;
    }
  }

  if (createNews && matchStatus === 'published' && summaryText) {
    const now = new Date();
    // The evergreen spotlight/update cards below get a timestamp a minute
    // earlier so this match's own recap always sorts as the newest — and
    // therefore the "main" hero card — regardless of insert/update order.
    const evergreenTimestamp = new Date(now.getTime() - 60000).toISOString();

    await upsertLatestMatchCard({
      match_id: match.id,
      placement: 'main',
      tag: newsTag || `${league} Match`,
      title: shortNewsTitle(opponent, resultType),
      body: summaryText,
      image_path: mvpPlayer?.image_path || null,
      status: 'published',
      published_at: now.toISOString(),
    });

    // A carousel highlight for this match's standout, so the featured-player
    // strip stays populated with real performances instead of going stale.
    // No longer gated on having a photo — a highlight with no image just
    // renders with an initials placeholder on the frontend until one's added.
    // If this player already has a carousel card from an earlier match, that
    // old one is replaced (not stacked) so the strip shows their latest form.
    if (mvpPlayer) {
      const mvpBatting = battingRows.find((r) => r.playerId === resolvedMvpPlayerId);
      const mvpBowling = bowlingRows.find((r) => r.playerId === resolvedMvpPlayerId);
      let tag = 'MATCH IMPACT';
      if (mvpBowling?.wickets >= 3) tag = `${mvpBowling.wickets}-WICKET IMPACT`;
      else if (mvpBatting?.runs >= 40) tag = 'TOP KNOCK';
      else if (mvpBatting?.runs > 0 || mvpBowling?.wickets > 0) tag = 'MATCH WINNER';

      const highlightBody =
        mvpText?.trim() ||
        [
          mvpBatting?.runs ? `${mvpBatting.runs} off ${mvpBatting.balls} balls` : null,
          mvpBowling?.wickets ? `${mvpBowling.wickets}/${mvpBowling.runs}` : null,
        ]
          .filter(Boolean)
          .join(', ') ||
        `Standout performance vs ${opponent}.`;

      await supabaseServer
        .from('tccc_news_items')
        .delete()
        .eq('team', 'TT')
        .eq('placement', 'carousel')
        .eq('title', mvpPlayer.canonical_name);

      await supabaseServer.from('tccc_news_items').insert({
        team: 'TT',
        match_id: match.id,
        kind: 'player_highlight',
        placement: 'carousel',
        tag,
        title: mvpPlayer.canonical_name,
        body: highlightBody,
        image_path: mvpPlayer.image_path || null,
        status: 'published',
        published_at: now.toISOString(),
      });
    }

    // Evergreen spotlight + league-record cards, refreshed (not duplicated)
    // on every publish so the flow grid always reflects current form instead
    // of just a lone match recap. Each gets a distinct 1-second-apart offset
    // (instead of sharing one timestamp) so their relative order in the flow
    // grid is deterministic rather than depending on undefined tie-break
    // behavior for equal published_at values.
    const offsetEvergreen = (secondsEarlier) =>
      new Date(new Date(evergreenTimestamp).getTime() - secondsEarlier * 1000).toISOString();

    const matchSeason = matchFields.season;

    // Single "Milestone Watch" card instead of separate Best Batter/Best
    // Bowler cards — those duplicated leaderboards already shown on the
    // Stats page and Team Hub's Awards Room. This is something genuinely
    // new: celebrates whoever just crossed a round-number career milestone,
    // or teases whoever's closest to one if nobody did this match.
    await upsertMilestoneCard(battingInsert, bowlingInsert, offsetEvergreen(2));

    // Refresh BOTH league standings cards on every publish (not just the
    // league that was just played) so BEDCL Update and MCPL Update always
    // stay paired/adjacent in the flow grid, instead of drifting apart based
    // on whichever league last happened to have a match.
    const ALL_LEAGUES = ['BEDCL', 'MCPL'];
    for (const [i, lg] of ALL_LEAGUES.entries()) {
      const leagueRecord = await getLeagueRecord(lg, matchSeason);
      if (leagueRecord.played > 0) {
        const parts = [`${leagueRecord.won}W`, `${leagueRecord.lost}L`];
        if (leagueRecord.tie) parts.push(`${leagueRecord.tie}T`);
        if (leagueRecord.noResult) parts.push(`${leagueRecord.noResult}NR`);
        await upsertEvergreenCard({
          tag: `${lg} Update`,
          title: `${lg} Standings Update`,
          body: `Telugu Titans are ${parts.join('-')} in ${lg} this season after ${leagueRecord.played} match${leagueRecord.played === 1 ? '' : 'es'}.`,
          publishedAt: offsetEvergreen(i),
        });
      }
    }
  }

  // POTM voting (fan vote for who was Player of the Match) was removed:
  // Awards Room already auto-crowns standout performers straight from real
  // stats, and the POTM polls never got real engagement (mostly 0 votes,
  // partly because of a since-fixed reveal-timing bug, but mainly because
  // nobody used it) — so it was cut rather than kept as unused clutter.
  if (matchStatus === 'published') {
    await createPredictionPolls(matchDate);
  }

  // Explicit Supabase keep-alive touch. Publishing already writes heavily to
  // Supabase above, which alone resets the free-tier 7-day inactivity clock —
  // this call is redundant for that purpose, kept only so every scorecard
  // update visibly pings the project regardless of how the writes above change.
  await supabaseServer.from('tccc_matches').select('id').limit(1);

  return NextResponse.json({ matchId: match.id });
}
