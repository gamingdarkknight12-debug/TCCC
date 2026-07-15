import fs from 'fs';

const battingLines = fs.readFileSync('C:/Users/shant/AppData/Local/Temp/claude/C--Users-shant-OneDrive-Documents-GitHub-TCCC/a85a1000-c427-4b54-91df-9c78c43fa5ba/scratchpad/2023-batting.jsonl', 'utf-8').trim().split('\n').map(l => JSON.parse(l));
const bowlingLines = fs.readFileSync('C:/Users/shant/AppData/Local/Temp/claude/C--Users-shant-OneDrive-Documents-GitHub-TCCC/a85a1000-c427-4b54-91df-9c78c43fa5ba/scratchpad/2023-bowling.jsonl', 'utf-8').trim().split('\n').map(l => JSON.parse(l));

const battingTotals = new Map();
for (const r of battingLines) {
  if (!battingTotals.has(r.name)) battingTotals.set(r.name, { runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0 });
  const t = battingTotals.get(r.name);
  t.runs += r.runs; t.balls += r.balls; t.fours += r.fours; t.sixes += r.sixes; t.innings += 1;
}

const bowlingTotals = new Map();
for (const r of bowlingLines) {
  if (!bowlingTotals.has(r.name)) bowlingTotals.set(r.name, { overs: 0, runs: 0, wickets: 0 });
  const t = bowlingTotals.get(r.name);
  // overs like 4.1 = 4 overs + 1 ball, need proper ball-based accumulation
  const wholeOvers = Math.floor(r.overs);
  const extraBalls = Math.round((r.overs - wholeOvers) * 10);
  t.overs += wholeOvers * 6 + extraBalls; // store in balls internally
  t.runs += r.runs;
  t.wickets += r.wickets;
}

console.log('=== BATTING TOTALS ===');
for (const [name, t] of [...battingTotals.entries()].sort((a,b) => b[1].runs - a[1].runs)) {
  console.log(`${name}: ${t.runs} runs, ${t.balls} balls, ${t.fours}x4, ${t.sixes}x6, ${t.innings} innings`);
}

console.log('\n=== BOWLING TOTALS ===');
for (const [name, t] of [...bowlingTotals.entries()].sort((a,b) => b[1].wickets - a[1].wickets)) {
  const totalOversDisplay = `${Math.floor(t.overs/6)}.${t.overs%6}`;
  console.log(`${name}: ${t.wickets} wkts, ${t.runs} runs, ${totalOversDisplay} overs`);
}

fs.writeFileSync('scripts/2023-aggregated.json', JSON.stringify({
  batting: [...battingTotals.entries()].map(([name, t]) => ({ name, ...t })),
  bowling: [...bowlingTotals.entries()].map(([name, t]) => ({ name, oversBalls: t.overs, runs: t.runs, wickets: t.wickets })),
}, null, 2));
