// One-time backfill: moves the hardcoded data in app/data.js, app/data/schedule.js,
// app/data/matchSummaries.js, app/data/players.js, and app/components/sections/News.js
// into the tccc_* Supabase tables created by supabase/migrations/0001_scorecard_tables.sql.
//
// Run once, locally, after running that migration in the Supabase SQL editor:
//   npm run backfill          (insert)
//   npm run backfill -- --reset   (truncate the 6 tccc_* tables first, then insert)
//
// Resilient by design: every table/step is wrapped so a single broken table
// (e.g. one still stuck from a Supabase-side outage) gets logged and skipped
// instead of aborting the whole run. Check the summary at the end for what
// actually succeeded vs what needs a re-run later.
//
// This is a throwaway tool, not a migration framework — safe to re-run with --reset
// while you're reviewing the KNOWN_ALIASES map below.

import { createClient } from '@supabase/supabase-js';
import { stats2024, stats2025, stats2026 } from '../app/data.js';
import { players } from '../app/data/players.js';
import { schedule2026 } from '../app/data/schedule.js';
import { matchSummaries } from '../app/data/matchSummaries.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Run with: node --env-file=.env.local scripts/backfill.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const RESET = process.argv.includes('--reset');

const stepResults = [];
function recordStep(name, ok, detail) {
  stepResults.push({ name, ok, detail });
}

// ---------------------------------------------------------------------------
// Name reconciliation. This is intentionally minimal — only merge two names
// when there is genuinely no reasonable doubt they're the same person. Every
// other name that doesn't exactly match the roster is auto-created as its
// own player and printed in the warning summary at the end for you to review
// (and merge by hand in the Supabase table editor, or extend this map and
// re-run with --reset) using your own knowledge of the actual roster.
// ---------------------------------------------------------------------------
const KNOWN_ALIASES = {
  // roster canonical name -> extra names found in the stats files for the same person
  Nipun: ['Nipun Rattan'],
};

const normalize = (name) => name.trim().replace(/\s+/g, ' ').toLowerCase();

function allStatNames() {
  const names = new Set();
  for (const season of [stats2024, stats2025, stats2026]) {
    for (const row of season.batting) names.add(row.name);
    for (const row of season.bowling) names.add(row.name);
  }
  return [...names];
}

// normalized name -> canonical name
const nameToCanonical = new Map();
for (const p of players) nameToCanonical.set(normalize(p.name), p.name);
for (const [canonical, aliases] of Object.entries(KNOWN_ALIASES)) {
  for (const alias of aliases) nameToCanonical.set(normalize(alias), canonical);
}

const autoCreatedPlayers = [];
for (const name of allStatNames()) {
  const norm = normalize(name);
  if (!nameToCanonical.has(norm)) {
    nameToCanonical.set(norm, name);
    autoCreatedPlayers.push(name);
  }
}

// canonical name -> { aliases: Set<string>, role, skill, image }
const canonicalInfo = new Map();
function ensureCanonical(name) {
  if (!canonicalInfo.has(name)) {
    canonicalInfo.set(name, { aliases: new Set([name]), role: null, skill: null, image: null });
  }
  return canonicalInfo.get(name);
}
for (const p of players) {
  const info = ensureCanonical(p.name);
  info.role = p.role || null;
  info.skill = p.skill || null;
  info.image = p.image || null;
}
for (const [canonical, aliases] of Object.entries(KNOWN_ALIASES)) {
  const info = ensureCanonical(canonical);
  for (const a of aliases) info.aliases.add(a);
}
for (const name of allStatNames()) {
  const canonical = nameToCanonical.get(normalize(name));
  ensureCanonical(canonical).aliases.add(name);
}

// ---------------------------------------------------------------------------
// News.js content — transcribed here since News.js has no data file (it's
// hardcoded JSX). Kept in sync manually; this only needs to run once.
// ---------------------------------------------------------------------------
const NEWS_CAROUSEL = [
  ['/players/24.jpeg', 'RED HOT', 'Nipun Rattan', 'Explosive 78 off 41 in MCPL with 8 sixes. Pure destruction mode.'],
  ['/players/9.jpg', 'SPELL MASTER', 'Martin T', 'Brilliant BEDCL spell with 3 wickets for just 21 runs.'],
  ['/players/27.jpeg', 'MATCH WINNER', 'Sreekanth Reddy', 'Calm and classy 60 off 52 to guide Titans home against Jaguar B.'],
  ['/players/28.jpeg', '3-WICKET IMPACT', 'GVK Teja', 'Picked up 3 wickets in MCPL and kept fighting hard with the ball.'],
  ['/players/12.jpeg', 'HAT-TRICK STAR', 'Nikhil Holagunda', 'Four wickets and a hat-trick in the MCPL win. MVP performance when Titans needed it most.'],
  ['/players/13.JPG', 'WATCH OUT', 'Saikiran Loading', 'Watch out for Saikiran who might be heading into his best season yet.'],
  ['/players/16.jpeg', 'PLAYER WATCH', 'Varun – Rising Gem', 'After joining last season, Varun quickly became a valuable player for the team.'],
  ['/players/1.jpeg', 'ABSOLUTE FIRE', 'Amit Turns Back The Clock', 'Amit came in breathing fire with sharp pace, aggressive intent, and serious pressure with the new ball.'],
  ['/players/22.jpeg', 'FIRST BALL STRIKE', 'Inder Makes Statement', 'Wicket on the very first ball — Inder announced himself instantly for the Titans.'],
];

const NEWS_FLOW = [
  { placement: 'main', tag: 'BEDCL Match', title: 'Titans Chase Down Jaguar B', body: 'Telugu Titans chased 152 successfully, finishing 155/3. Sreekanth Reddy led the way with a composed 60, supported by Sandesh and Chaitanya.' },
  { placement: 'small', tag: 'Top Knock', title: 'Nipun Goes Big 💥', body: 'Nipun smashed 78 off 41 in MCPL, including 8 sixes. A proper power-hitting statement from the Titans batter.' },
  { placement: 'small', tag: 'Bowling Star', title: 'Martin Controls BEDCL', body: 'Martin delivered a sharp 5-over spell, taking 3 wickets for just 21 runs and keeping the game under control.' },
  { placement: 'small', tag: 'MCPL Fight', title: 'GVK Teja Strikes Back', body: 'Venkata Krishna Teja picked up 3 wickets in the MCPL match, giving Titans important breakthroughs under pressure.' },
  { placement: 'small', tag: 'Result Update', title: 'Mixed Weekend Results', body: 'Titans won the BEDCL match against Jaguar B by 7 wickets, but fell short in MCPL against Predators CC B by 19 runs.' },
];

async function reset() {
  console.log('--reset: truncating tccc_* tables...');
  for (const table of ['tccc_news_items', 'tccc_batting_innings', 'tccc_bowling_innings', 'tccc_matches', 'tccc_player_aliases', 'tccc_players']) {
    const { error } = await supabase.from(table).delete().gte('id', 0);
    if (error) {
      console.warn(`  reset ${table}: FAILED (${error.message}) — skipping, will still try other tables`);
    } else {
      console.log(`  reset ${table}: ok`);
    }
  }
}

async function seedPlayers() {
  const canonicalToId = new Map();
  let failedPlayers = 0;

  for (const [canonical, info] of canonicalInfo) {
    const { data, error } = await supabase
      .from('tccc_players')
      .insert({
        team: 'TT',
        canonical_name: canonical,
        role: info.role,
        skill: info.skill,
        image_path: info.image,
        active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.warn(`  player "${canonical}": FAILED (${error.message}) — skipping`);
      failedPlayers += 1;
      continue;
    }
    canonicalToId.set(canonical, data.id);
  }

  const aliasRows = [];
  for (const [canonical, info] of canonicalInfo) {
    const playerId = canonicalToId.get(canonical);
    if (!playerId) continue; // player insert failed above, nothing to alias
    for (const alias of info.aliases) {
      aliasRows.push({ player_id: playerId, alias });
    }
  }

  let aliasCount = 0;
  if (aliasRows.length) {
    const { error: aliasError } = await supabase
      .from('tccc_player_aliases')
      .upsert(aliasRows, { onConflict: 'alias', ignoreDuplicates: true });
    if (aliasError) {
      console.warn(`  player aliases: FAILED (${aliasError.message}) — skipping`);
    } else {
      aliasCount = aliasRows.length;
    }
  }

  const aliasToPlayerId = new Map();
  for (const [canonical, info] of canonicalInfo) {
    const id = canonicalToId.get(canonical);
    if (!id) continue;
    for (const alias of info.aliases) aliasToPlayerId.set(normalize(alias), id);
  }

  console.log(`Seeded ${canonicalToId.size}/${canonicalInfo.size} players, ${aliasCount} aliases.`);
  recordStep('players', canonicalToId.size > 0, `${canonicalToId.size}/${canonicalInfo.size} inserted, ${failedPlayers} failed`);
  return { aliasToPlayerId };
}

function resolvePlayerId(aliasToPlayerId, rawName) {
  return aliasToPlayerId.get(normalize(rawName)) ?? null;
}

async function seedSchedule() {
  const inserted = [];
  let failed = 0;

  for (const m of schedule2026) {
    const { data, error } = await supabase
      .from('tccc_matches')
      .insert({
        team: 'TT',
        league: m.league,
        season: 2026,
        opponent: m.opponent,
        match_date: m.date,
        match_time: m.time,
        ground: m.ground,
        home_away: m.homeAway,
        status: 'scheduled',
        source_type: 'manual',
      })
      .select('id, opponent, match_date')
      .single();

    if (error) {
      console.warn(`  schedule match vs ${m.opponent}: FAILED (${error.message}) — skipping`);
      failed += 1;
      continue;
    }
    inserted.push(data);
  }

  console.log(`Seeded ${inserted.length}/${schedule2026.length} scheduled matches for 2026.`);
  recordStep('schedule', inserted.length > 0, `${inserted.length}/${schedule2026.length} inserted, ${failed} failed`);
  return inserted;
}

async function applyMatchSummaries(scheduledMatches) {
  const assigned = new Set();
  const ambiguousWarnings = [];
  let applied = 0;
  let failed = 0;

  for (const [key, summary] of Object.entries(matchSummaries)) {
    const opponent = key.replace(/^Telugu Titans vs /, '');
    const candidates = scheduledMatches
      .filter((m) => m.opponent === opponent && !assigned.has(m.id))
      .sort((a, b) => a.match_date.localeCompare(b.match_date));

    if (candidates.length === 0) {
      console.warn(`No unassigned scheduled match found for summary "${key}" — skipped.`);
      continue;
    }

    if (candidates.length > 1) {
      ambiguousWarnings.push(
        `"${key}" matched multiple scheduled dates against ${opponent} (${candidates.map((c) => c.match_date).join(', ')}) — assigned to the earliest (${candidates[0].match_date}). Double-check in the Supabase table editor.`
      );
    }

    const chosen = candidates[0];
    assigned.add(chosen.id);

    const status = /cancel/i.test(summary.result) ? 'cancelled' : 'published';

    const { error } = await supabase
      .from('tccc_matches')
      .update({
        status,
        result_text: summary.result,
        summary_text: summary.summary,
        mvp_text: summary.mvp,
      })
      .eq('id', chosen.id);

    if (error) {
      console.warn(`  summary "${key}": FAILED (${error.message}) — skipping`);
      failed += 1;
      continue;
    }
    applied += 1;
  }

  console.log(`Applied ${applied} match summaries.`);
  if (ambiguousWarnings.length) {
    console.warn('\nAmbiguous summary assignments:');
    ambiguousWarnings.forEach((w) => console.warn(`  - ${w}`));
  }
  recordStep('match summaries', applied > 0, `${applied} applied, ${failed} failed`);
}

async function seedSeasonAggregate(season, seasonStats, aliasToPlayerId) {
  const { data: match, error } = await supabase
    .from('tccc_matches')
    .insert({
      team: 'TT',
      league: 'SEASON',
      season,
      opponent: 'Season Aggregate',
      match_date: `${season}-01-01`,
      status: 'published',
      source_type: 'manual',
    })
    .select('id')
    .single();

  if (error) {
    console.warn(`  season aggregate ${season}: FAILED to create match row (${error.message}) — skipping this season entirely`);
    recordStep(`season aggregate ${season}`, false, error.message);
    return;
  }

  const battingRows = seasonStats.batting.map((p) => ({
    match_id: match.id,
    player_id: resolvePlayerId(aliasToPlayerId, p.name),
    unmatched_name: resolvePlayerId(aliasToPlayerId, p.name) ? null : p.name,
    runs: p.runs ?? 0,
    balls: p.balls ?? 0,
    fours: p.fours ?? 0,
    sixes: p.sixes ?? 0,
    not_out: false,
    innings: p.inns ?? null,
    not_out_count: p.notOut ?? null,
    avg: typeof p.avg === 'number' ? p.avg : (typeof p.avg === 'string' && p.avg !== '-' ? Number(p.avg) : null),
  }));

  const bowlingRows = seasonStats.bowling.map((p) => ({
    match_id: match.id,
    player_id: resolvePlayerId(aliasToPlayerId, p.name),
    unmatched_name: resolvePlayerId(aliasToPlayerId, p.name) ? null : p.name,
    overs: p.overs ?? 0,
    runs: p.runs ?? 0,
    wickets: p.wickets ?? 0,
    wides: p.wides ?? 0,
    no_balls: p.noBalls ?? p.noballs ?? 0,
    dots: p.dots ?? null,
    maidens: p.maiden ?? p.maidens ?? null,
  }));

  let battingOk = false;
  let bowlingOk = false;

  if (battingRows.length) {
    const { error: battingError } = await supabase.from('tccc_batting_innings').insert(battingRows);
    if (battingError) {
      console.warn(`  season aggregate ${season} batting: FAILED (${battingError.message}) — skipping`);
    } else {
      battingOk = true;
    }
  }
  if (bowlingRows.length) {
    const { error: bowlingError } = await supabase.from('tccc_bowling_innings').insert(bowlingRows);
    if (bowlingError) {
      console.warn(`  season aggregate ${season} bowling: FAILED (${bowlingError.message}) — skipping`);
    } else {
      bowlingOk = true;
    }
  }

  console.log(`Seeded season aggregate for ${season}: ${battingOk ? battingRows.length : 0} batting rows, ${bowlingOk ? bowlingRows.length : 0} bowling rows.`);
  recordStep(`season aggregate ${season}`, battingOk || bowlingOk, `batting ${battingOk ? 'ok' : 'failed'}, bowling ${bowlingOk ? 'ok' : 'failed'}`);
}

async function seedNews() {
  const rows = [];

  NEWS_CAROUSEL.forEach(([image, tag, title, body]) => {
    rows.push({
      team: 'TT',
      kind: 'player_highlight',
      placement: 'carousel',
      tag,
      title,
      body,
      image_path: image,
      status: 'published',
      published_at: new Date().toISOString(),
    });
  });

  NEWS_FLOW.forEach(({ placement, tag, title, body }) => {
    rows.push({
      team: 'TT',
      kind: 'manual',
      placement,
      tag,
      title,
      body,
      image_path: null,
      status: 'published',
      published_at: new Date().toISOString(),
    });
  });

  const { error } = await supabase.from('tccc_news_items').insert(rows);
  if (error) {
    console.warn(`  news items: FAILED (${error.message}) — skipping, re-run later once this table is reachable`);
    recordStep('news', false, error.message);
    return;
  }
  console.log(`Seeded ${rows.length} news items.`);
  recordStep('news', true, `${rows.length} inserted`);
}

async function runStep(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn(`\n${label} threw unexpectedly: ${err.message} — skipping, continuing with the rest.\n`);
    recordStep(label, false, err.message);
    return undefined;
  }
}

async function main() {
  if (RESET) await runStep('reset', reset);

  const playersResult = (await runStep('players', seedPlayers)) || { aliasToPlayerId: new Map() };
  const { aliasToPlayerId } = playersResult;

  const scheduledMatches = (await runStep('schedule', seedSchedule)) || [];

  if (scheduledMatches.length) {
    await runStep('match summaries', () => applyMatchSummaries(scheduledMatches));
  } else {
    console.warn('Skipping match summaries: no scheduled matches were inserted.');
  }

  await runStep('season aggregate 2024', () => seedSeasonAggregate(2024, stats2024, aliasToPlayerId));
  await runStep('season aggregate 2025', () => seedSeasonAggregate(2025, stats2025, aliasToPlayerId));
  await runStep('season aggregate 2026', () => seedSeasonAggregate(2026, stats2026, aliasToPlayerId));

  await runStep('news', seedNews);

  console.log('\n--- Backfill summary ---');
  stepResults.forEach((s) => {
    console.log(`  [${s.ok ? 'OK' : 'FAILED'}] ${s.name} — ${s.detail}`);
  });

  console.log(`\nPlayers auto-created without a known alias (${autoCreatedPlayers.length}) — review these:`);
  autoCreatedPlayers.forEach((name) => console.log(`  - ${name}`));

  const failedSteps = stepResults.filter((s) => !s.ok);
  if (failedSteps.length) {
    console.log(`\n${failedSteps.length} step(s) failed — once the affected table(s) are reachable again, re-run "npm run backfill -- --reset" to redo everything cleanly (safe: re-running with --reset truncates and reinserts from scratch, avoiding duplicate-row conflicts from a partial run).`);
  } else {
    console.log('\nAll steps succeeded.');
  }
  console.log('Spot-check rows in the Supabase table editor before moving to Phase 2.');
}

main().catch((err) => {
  console.error('\nBackfill failed unexpectedly:', err.message);
  process.exit(1);
});
