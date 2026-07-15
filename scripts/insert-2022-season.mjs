import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const agg = JSON.parse(fs.readFileSync('scripts/2022-aggregated.json', 'utf-8'));

// 2022 extracted name -> canonical roster name (confirmed with user / matched
// against existing 2023 NAME_MAP precedent for the same spelling variants).
const NAME_MAP = {
  'Nipun Rattan': 'Nipun',
  'Anand Maddula': 'Anand Chaitanya Maddula',
  'Dheeraj Arcot': 'Dheeraj',
  'Sai Kiran Reddy Vanteru': 'Sai Kiran Reddy',
  'Ravi kiran Konujula': 'Ravi Kiran',
  'Nagesh Kowligi': 'Nagesh Kowgili',
  // Not in NAME_MAP => treated as a brand-new player under their 2022 name as-is:
  // Sandeep Layam, Likith Kumar reddy Poli, Srikanth Buddi, Kumar Chandra Mallavarapu,
  // Deepak Thakur, Sharukh Khan Mohammed, Mallikarjuna Chari Padira, Chaitanya T,
  // Vinith Reddy Reddy
};

const canonicalName = (extractedName) => NAME_MAP[extractedName] || extractedName;

const { data: existingPlayers } = await supabase.from('tccc_players').select('id, canonical_name').eq('team', 'TT');
const idByName = new Map(existingPlayers.map(p => [p.canonical_name, p.id]));

const allNames = new Set([...agg.batting.map(b => canonicalName(b.name)), ...agg.bowling.map(b => canonicalName(b.name))]);
const toCreate = [...allNames].filter(n => !idByName.has(n));

console.log('Creating new player records:', toCreate);
for (const name of toCreate) {
  const { data, error } = await supabase.from('tccc_players').insert({ team: 'TT', canonical_name: name, active: true }).select('id, canonical_name').single();
  if (error) throw error;
  idByName.set(data.canonical_name, data.id);
  await supabase.from('tccc_player_aliases').insert({ player_id: data.id, alias: name });
}

// Create the 2022 SEASON aggregate match record (same pattern as 2023/2024/2025).
const { data: existingSeason } = await supabase.from('tccc_matches').select('id').eq('team', 'TT').eq('season', 2022).eq('league', 'SEASON').limit(1);
let matchId;
if (existingSeason && existingSeason.length > 0) {
  matchId = existingSeason[0].id;
  console.log('Reusing existing 2022 SEASON row id', matchId);
} else {
  const { data: match, error } = await supabase.from('tccc_matches').insert({
    team: 'TT', league: 'SEASON', season: 2022, opponent: 'Season Aggregate',
    match_date: '2022-01-01', status: 'published', source_type: 'manual',
  }).select('id').single();
  if (error) throw error;
  matchId = match.id;
  console.log('Created 2022 SEASON row id', matchId);
}

// Clear any prior aggregate rows for this match (safe re-run).
await supabase.from('tccc_batting_innings').delete().eq('match_id', matchId);
await supabase.from('tccc_bowling_innings').delete().eq('match_id', matchId);

const battingInsert = agg.batting.map(b => ({
  match_id: matchId,
  player_id: idByName.get(canonicalName(b.name)),
  runs: b.runs, balls: b.balls, fours: b.fours, sixes: b.sixes,
  innings: b.innings, not_out_count: 0,
}));
const { error: battingErr } = await supabase.from('tccc_batting_innings').insert(battingInsert);
if (battingErr) throw battingErr;
console.log(`Inserted ${battingInsert.length} batting rows`);

const bowlingInsert = agg.bowling.map(b => ({
  match_id: matchId,
  player_id: idByName.get(canonicalName(b.name)),
  overs: Math.floor(b.oversBalls / 6) + (b.oversBalls % 6) / 10,
  runs: b.runs, wickets: b.wickets,
}));
const { error: bowlingErr } = await supabase.from('tccc_bowling_innings').insert(bowlingInsert);
if (bowlingErr) throw bowlingErr;
console.log(`Inserted ${bowlingInsert.length} bowling rows`);
