// Maps REAL aggregate stats (from /api/game/roster) to gameplay parameters.
// Heuristic v1 formulas, deliberately simple — tune the lerp bounds after
// playtesting against real player names, not a validated analytics model.
//
// Callers must pass numeric fields (the roster API returns sr/avg/economy as
// formatted strings like "34.5" for display — parse with Number() before
// calling in here, and treat '-' as missing/null).

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

// Higher threat (0-100) = tougher bowler to face.
export function computeBowlingThreat({ wickets = 0, economy = null } = {}) {
  if (economy == null) return 50; // no bowling data -> "average club player"
  return clamp(Math.round(wickets * 3 - economy * 2 + 50), 0, 100);
}

// Higher solidity (0-100) = harder to dismiss when the AI controls this batter.
export function computeBattingSolidity({ avg = null, sr = null } = {}) {
  if (avg == null && sr == null) return 50;
  return clamp(Math.round((avg || 0) * 1.5 + (sr || 0) * 0.3), 0, 100);
}

export function bowlingParamsFromThreat(threat) {
  return {
    reactionWindowMs: lerp(900, 550, threat / 100),
    lineDeviationPx: lerp(10, 40, threat / 100),
    deliveryVarietyCount: threat > 66 ? 4 : threat > 33 ? 3 : 2,
  };
}

export function battingParamsFromSolidity(solidity, sr = 50) {
  return {
    dismissalBaseChancePerBall: lerp(0.08, 0.02, solidity / 100),
    aggressionShotChance: lerp(0.2, 0.45, clamp((sr || 50) / 150, 0, 1)),
  };
}

export function getBowlerDifficulty(bowlingStats) {
  const threat = computeBowlingThreat(bowlingStats);
  return { threat, ...bowlingParamsFromThreat(threat) };
}

export function getBatterDifficulty(battingStats) {
  const solidity = computeBattingSolidity(battingStats);
  return { solidity, ...battingParamsFromSolidity(solidity, battingStats.sr) };
}
