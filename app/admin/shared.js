export const LEAGUES = ['BEDCL', 'MCPL'];

export function emptyBattingRow() {
  return { name: '', playerId: null, runs: 0, balls: 0, fours: 0, sixes: 0, notOut: false, dismissal: '' };
}

export function emptyBowlingRow() {
  return { name: '', playerId: null, overs: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0, maidens: 0 };
}

export function rowKey(row) {
  return row.playerId ? `id:${row.playerId}` : `name:${(row.name || '').trim().toLowerCase()}`;
}

export function matchRosterId(name, currentRoster) {
  const found = currentRoster.find((p) => p.canonical_name.toLowerCase() === (name || '').toLowerCase());
  return found ? found.id : null;
}

// Drafts a plain-English recap from the reviewed stats — a starting point,
// not a final copy; the admin can edit it before publishing either way.
export function generateSummary(form) {
  const batters = form.battingRows.filter((r) => r.name?.trim());
  const bowlers = form.bowlingRows.filter((r) => r.name?.trim());
  const topBatter = [...batters].sort((a, b) => b.runs - a.runs)[0];
  const topBowler = [...bowlers].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];

  const parts = [];
  if (form.resultText?.trim()) {
    parts.push(form.resultText.trim().replace(/\.?$/, '.'));
  } else if (form.opponent) {
    parts.push(`Telugu Titans faced ${form.opponent}.`);
  }

  if (topBatter && topBatter.runs > 0) {
    parts.push(
      `${topBatter.name} top-scored with ${topBatter.runs}${topBatter.balls ? ` off ${topBatter.balls} balls` : ''}${
        topBatter.notOut ? ' (not out)' : ''
      }.`
    );
  }

  if (topBowler && topBowler.wickets > 0) {
    parts.push(
      `${topBowler.name} led the bowling with ${topBowler.wickets} wicket${topBowler.wickets === 1 ? '' : 's'} for ${topBowler.runs} runs.`
    );
  }

  if (form.teamScore?.trim()) {
    parts.push(`Final score: TT ${form.teamScore.trim()}.`);
  }

  return parts.join(' ');
}

export function pendingInfoFromMatch(match) {
  return {
    league: match.league,
    season: match.season,
    opponent: match.opponent,
    matchDate: match.match_date,
    matchTime: match.match_time || '',
    ground: match.ground || '',
    homeAway: match.home_away || 'Home',
    teamScore: match.team_score || '',
    opponentScore: match.opponent_score || '',
    resultText: match.result_text || '',
    resultType: match.result_type || '',
    summaryText: match.summary_text || '',
    mvpText: match.mvp_text || '',
  };
}

// Sanity checks on the reviewed match before it's allowed to publish. Errors
// block Publish (but not Save as Draft); warnings are informational only.
export function validateMatch(form) {
  const errors = [];
  const warnings = [];

  if (!form.opponent?.trim()) errors.push('Opponent is required.');
  if (!form.matchDate) errors.push('Match date is required.');
  if (!form.resultType) warnings.push("Result Type isn't set — this match won't count toward Standings.");

  if (form.battingRows.length === 0) warnings.push('No batting rows added.');

  const battingSeen = new Set();
  form.battingRows.forEach((r, i) => {
    const label = r.name || `row ${i + 1}`;
    const key = rowKey(r);
    if (key !== 'name:' && battingSeen.has(key)) errors.push(`Batting: "${label}" appears more than once.`);
    battingSeen.add(key);
    if (!r.playerId) warnings.push(`Batting: "${label}" isn't matched to a roster player.`);
    if (r.fours * 4 + r.sixes * 6 > r.runs) {
      errors.push(`Batting: "${label}" — boundaries (${r.fours}x4 + ${r.sixes}x6 = ${r.fours * 4 + r.sixes * 6}) exceed total runs (${r.runs}).`);
    }
    if (r.balls === 0 && r.runs > 0) warnings.push(`Batting: "${label}" has ${r.runs} runs but 0 balls faced.`);
  });

  const totalWickets = form.bowlingRows.reduce((sum, r) => sum + Number(r.wickets || 0), 0);
  if (totalWickets > 10) errors.push(`Total wickets across all bowlers is ${totalWickets} — a team can only lose 10 wickets.`);

  const bowlingSeen = new Set();
  form.bowlingRows.forEach((r, i) => {
    const label = r.name || `row ${i + 1}`;
    const key = rowKey(r);
    if (key !== 'name:' && bowlingSeen.has(key)) errors.push(`Bowling: "${label}" appears more than once.`);
    bowlingSeen.add(key);
    if (!r.playerId) warnings.push(`Bowling: "${label}" isn't matched to a roster player.`);
    if (Number(r.wickets) > 10) errors.push(`Bowling: "${label}" — ${r.wickets} wickets isn't possible for one bowler.`);
    const decimalPart = Math.round((Number(r.overs) % 1) * 10);
    if (decimalPart > 5) errors.push(`Bowling: "${label}" — overs "${r.overs}" is invalid (the digit after the decimal is balls, so it can only be 0-5).`);
  });

  const battingRunsTotal = form.battingRows.reduce((sum, r) => sum + Number(r.runs || 0), 0);
  const teamScoreLeading = parseInt(String(form.teamScore).match(/\d+/)?.[0] ?? '', 10);
  if (!Number.isNaN(teamScoreLeading) && Math.abs(teamScoreLeading - battingRunsTotal) > 15) {
    warnings.push(`Team score (${form.teamScore}) doesn't closely match the sum of batting runs (${battingRunsTotal}) — check for missing rows or extras.`);
  }

  return { errors, warnings };
}

export function blankForm(overrides = {}) {
  return {
    matchId: null,
    league: 'BEDCL',
    season: new Date().getFullYear(),
    opponent: '',
    matchDate: '',
    matchTime: '',
    ground: '',
    homeAway: 'Home',
    teamScore: '',
    opponentScore: '',
    resultText: '',
    resultType: '',
    summaryText: '',
    mvpText: '',
    mvpPlayerId: null,
    sourceType: 'manual',
    sourceFileName: '',
    rawExtraction: null,
    rawOcrText: '',
    battingRows: [emptyBattingRow()],
    bowlingRows: [emptyBowlingRow()],
    ...overrides,
  };
}

export const PENDING_FORM_KEY = 'tccc_admin_pending_form';
