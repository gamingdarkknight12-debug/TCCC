// One-time seed: populates tccc_player_match_adjustments for season 2026 from the
// manually-tracked match-count table that used to live hardcoded in
// app/components/sections/Stats.js (matchCounts2026 / getMatchCount2026).
//
// For each alias group, extra_matches = manually-tracked total - matches already
// derivable from real per-match batting/bowling rows. That delta accounts for
// matches only present in the pre-migration "SEASON" aggregate row, or matches
// where the player fielded but never got a batting/bowling stat line at all.
//
// Requires migration supabase/migrations/0004_player_match_adjustments.sql to have
// been run in the Supabase SQL editor first.
//
// Run with: node --env-file=.env.local --experimental-detect-module scripts/seed-2026-match-adjustments.mjs
//   add --dry-run to preview without writing.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const SEASON = 2026;

const matchCounts2026 = [
  { count: 12, names: ['srikanth', 'srikanth govula', 'srikanth g', 'srikanth reddy'] },
  { count: 11, names: ['nipun'] },
  { count: 10, names: ['varun', 'varun rambha'] },
  { count: 10, names: ['charan', 'charan teja bandaru'] },
  { count: 8, names: ['anand', 'anand chaitanya maddula'] },
  { count: 8, names: ['sai kiran', 'sai kiran reddy'] },
  { count: 8, names: ['shanthan', 'shanthan akkiraju'] },
  { count: 8, names: ['vikas', 'vikas tiwari'] },
  { count: 7, names: ['aadil', 'adil', 'aadil khan', 'adil khan'] },
  { count: 7, names: ['bhanu', 'bhanu musunuru'] },
  { count: 7, names: ['kiran', 'kiran k', 'kiran kakarlapudi'] },
  { count: 7, names: ['martin', 'martin thandhara'] },
  { count: 6, names: ['arun', 'arun kumar layam'] },
  { count: 6, names: ['dheeraj', 'dheeraj n'] },
  { count: 6, names: ['inderjeet', 'inder', 'inderjeet singh tamber'] },
  { count: 5, names: ['gvk teja', 'teja gvk', 'venkata krishna teja gurram', 'venkat krishna teja gurram'] },
  { count: 3, names: ['amit', 'amit koul'] },
  { count: 3, names: ['gowtham', 'gowtam', 'gautham', 'gowtam reddy pidaparti', 'gowtham reddy pidaparti'] },
  { count: 3, names: ['kapil', 'kapil sai darshi'] },
  { count: 3, names: ['manish', 'maneesh'] },
  { count: 3, names: ['naresh', 'naresh pendyala'] },
  { count: 1, names: ['chaitanya praneeth', 'chaitanya praneeth nadimpalli'] },
  { count: 1, names: ['nikhil', 'nikhil holagunda'] },
  { count: 1, names: ['pradeep', 'pradeep pati'] },
  { count: 1, names: ['pranav'] },
  { count: 1, names: ['prasad g'] },
  { count: 1, names: ['raj v'] },
  { count: 1, names: ['ram kiran', 'ramkiran', 'ramkiran nersu'] },
  { count: 1, names: ['ram sandeep', 'ram sandeep chimata'] },
  { count: 1, names: ['sai swethan'] },
  { count: 1, names: ['sandesh', 'sandesh sudini'] },
  { count: 1, names: ['pradhyu g', 'pradyu ghatti', 'pradyu'] },
  { count: 1, names: ['vikranth nyalakonda', 'vikranth'] },
  { count: 1, names: ['sreekanth reddy', 'srekanth reddy'] },
];

const normalize = (n) => (n || '').toLowerCase().trim().replace(/\s+/g, ' ');
const titleCase = (n) => n.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

async function main() {
  const { data: players, error: playersErr } = await supabase
    .from('tccc_players')
    .select('id, canonical_name')
    .eq('team', 'TT');
  if (playersErr) throw playersErr;

  const { data: matches, error: matchErr } = await supabase
    .from('tccc_matches')
    .select('id, league')
    .eq('team', 'TT')
    .eq('season', SEASON);
  if (matchErr) throw matchErr;
  const realMatchIds = new Set(matches.filter((m) => m.league !== 'SEASON').map((m) => m.id));
  const seasonMatchIds = matches.filter((m) => m.league === 'SEASON').map((m) => m.id);
  const matchIds = matches.map((m) => m.id);

  const [{ data: batting, error: bErr }, { data: bowling, error: wErr }] = await Promise.all([
    supabase.from('tccc_batting_innings').select('match_id, unmatched_name, player_id, tccc_players(canonical_name)').in('match_id', matchIds),
    supabase.from('tccc_bowling_innings').select('match_id, unmatched_name, player_id, tccc_players(canonical_name)').in('match_id', matchIds),
  ]);
  if (bErr) throw bErr;
  if (wErr) throw wErr;

  const dbSumByPlayerId = new Map();
  const seasonRowPlayerIds = new Set();
  for (const row of [...batting, ...bowling]) {
    if (!row.player_id) continue;
    if (seasonMatchIds.includes(row.match_id)) seasonRowPlayerIds.add(row.player_id);
    if (!realMatchIds.has(row.match_id)) continue;
    if (!dbSumByPlayerId.has(row.player_id)) dbSumByPlayerId.set(row.player_id, new Set());
    dbSumByPlayerId.get(row.player_id).add(row.match_id);
  }

  const toInsert = [];
  const toCreate = [];
  const skipped = [];

  for (const group of matchCounts2026) {
    const candidates = players.filter((p) => group.names.some((alias) => normalize(alias) === normalize(p.canonical_name)));

    let chosen = null;
    if (candidates.length > 0) {
      chosen = candidates
        .map((p) => ({ p, sum: dbSumByPlayerId.get(p.id)?.size ?? 0, inSeason: seasonRowPlayerIds.has(p.id) }))
        .sort((a, b) => b.sum - a.sum || Number(b.inSeason) - Number(a.inSeason))[0].p;
    }

    if (!chosen) {
      toCreate.push({ canonical_name: titleCase(group.names[0]), group });
      continue;
    }

    const dbSum = dbSumByPlayerId.get(chosen.id)?.size ?? 0;
    const extra = group.count - dbSum;
    if (extra < 0) {
      skipped.push(`${chosen.canonical_name}: hardcoded=${group.count} < db_sum=${dbSum}, skipping (needs manual review)`);
      continue;
    }
    if (extra === 0) continue; // API already computes this correctly, no adjustment needed

    toInsert.push({ player_id: chosen.id, season: SEASON, extra_matches: extra, note: 'seeded from pre-automation matchCounts2026 table in Stats.js' });
  }

  console.log(`Groups needing a new player record (not found in tccc_players): ${toCreate.length}`);
  for (const c of toCreate) console.log(`  create "${c.canonical_name}" -> extra_matches=${c.group.count}`);

  if (skipped.length) {
    console.log(`\nSkipped (needs manual review):`);
    for (const s of skipped) console.log(`  ${s}`);
  }

  console.log(`\nAdjustment rows to write: ${toInsert.length}`);
  for (const row of toInsert) console.log(`  player_id=${row.player_id} season=${row.season} extra_matches=${row.extra_matches}`);

  if (DRY_RUN) {
    console.log('\n--dry-run set, not writing anything.');
    return;
  }

  for (const c of toCreate) {
    const { data: created, error: createErr } = await supabase
      .from('tccc_players')
      .insert({ team: 'TT', canonical_name: c.canonical_name, active: true })
      .select('id, canonical_name')
      .single();
    if (createErr) {
      console.error(`Failed to create player "${c.canonical_name}":`, createErr.message);
      continue;
    }
    await supabase.from('tccc_player_aliases').insert({ player_id: created.id, alias: c.canonical_name });
    toInsert.push({ player_id: created.id, season: SEASON, extra_matches: c.group.count, note: 'seeded from pre-automation matchCounts2026 table in Stats.js (new player, no prior stat rows found)' });
    console.log(`Created player "${created.canonical_name}" (id=${created.id})`);
  }

  const { error: insertErr } = await supabase
    .from('tccc_player_match_adjustments')
    .upsert(toInsert, { onConflict: 'player_id,season' });
  if (insertErr) throw insertErr;

  console.log(`\nWrote ${toInsert.length} adjustment rows for season ${SEASON}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
