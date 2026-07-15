import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const agg = JSON.parse(fs.readFileSync('scripts/2023-aggregated.json', 'utf-8'));

// 2023 extracted name -> canonical roster name (confirmed with user)
const NAME_MAP = {
  'Nipun Rattan': 'Nipun',
  'Anand Maddula': 'Anand Chaitanya Maddula',
  'Aadilkhan Pathan': 'Aadil Khan',
  'Abhishek Tippireddy': 'Abhishek',
  'Suresh Kuna': 'Suresh Kuna',
  'Sumit Sinha': 'Sumit',
  'Charan Teja Bandaru': 'Charan Teja Bandaru',
  'Bhanu Musunuru': 'Bhanu Musunuru',
  'Shanthan A': 'Shanthan Akkiraju',
  'Ramkiran Nersu': 'Ramkiran Nersu',
  'Dheeraj Arcot': 'Dheeraj',
  'Ram Sandeep Chimata': 'Ram Sandeep Chimata',
  'Sai Kiran Reddy Vanteru': 'Sai Kiran Reddy',
  'Sai Ram Dhanam': 'Sai Ram Dhanam',
  'Ravi kiran Konujula': 'Ravi Kiran',
  'Vikas Tiwari': 'Vikas Tiwari',
  'Vinay Kumar Devisetty': 'Vinay Devisetty',
  'Arun Kumar Layam': 'Arun Kumar Layam',
  'Nagesh Kowligi': 'Nagesh Kowgili',
  'Vikranth Nyalakonda': 'Vikranth Nyalakonda',
  'Dhruv Sharma': 'Dhruv',
  'Sai Krishna Adusumilli': 'Sai Krishna Adusumilli',
  'Srikanth Govula': 'Srikanth Govula',
  // Not in NAME_MAP => treated as a brand-new player under their 2023 name as-is:
  // Raghunath Soogoor, Gitarth Rattan, Venky Kesaraju, Ram Khanna, Sai Kiran Galva,
  // Sumanth Repaka, Arnab Sinha, Sree harsha Ramanavarapu, Venkata Ramana Vepa,
  // Hazarathaiah Muthuru
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

// Create the 2023 SEASON aggregate match record (same pattern as 2024/2025).
const { data: existingSeason } = await supabase.from('tccc_matches').select('id').eq('team', 'TT').eq('season', 2023).eq('league', 'SEASON').limit(1);
let matchId;
if (existingSeason && existingSeason.length > 0) {
  matchId = existingSeason[0].id;
  console.log('Reusing existing 2023 SEASON row id', matchId);
} else {
  const { data: match, error } = await supabase.from('tccc_matches').insert({
    team: 'TT', league: 'SEASON', season: 2023, opponent: 'Season Aggregate',
    match_date: '2023-01-01', status: 'published', source_type: 'manual',
  }).select('id').single();
  if (error) throw error;
  matchId = match.id;
  console.log('Created 2023 SEASON row id', matchId);
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
