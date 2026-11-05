// AI decision-making for whichever side has no human attached to the
// currently active player - the single-player opponent, and the multiplayer
// fallback once a disconnected player's grace period expires. Pure functions
// of (params, rng) so they're deterministic and testable.

import { clamp } from './difficulty.js';

const LINES = ['off', 'middle', 'leg'];
const LENGTHS = ['short', 'good', 'full'];

export function aiChooseBowlingCommit({ bowlingParams, rng }) {
  const varietyCount = bowlingParams.deliveryVarietyCount ?? 2;
  const lineChoices = LINES.slice(0, Math.max(2, Math.min(3, varietyCount)));
  const lengthChoices = LENGTHS.slice(0, Math.max(2, Math.min(3, varietyCount)));
  return {
    line: lineChoices[Math.floor(rng() * lineChoices.length)],
    length: lengthChoices[Math.floor(rng() * lengthChoices.length)],
    timingAccuracy: clamp(0.6 + (rng() - 0.5) * 0.4, 0, 1),
  };
}

export function aiChooseBattingCommit({ battingParams, rng }) {
  const isAggressive = rng() < (battingParams.aggressionShotChance ?? 0.3);
  return {
    shotType: isAggressive ? 'power' : 'defensive',
    timingError: (rng() - 0.5) * 2, // -1 (early) .. 1 (late), 0 = perfect
  };
}

export function aiChooseNextBowler({ bowlingTeamPlayers, canBowlerBowl, rng }) {
  const eligible = bowlingTeamPlayers.filter((p) => canBowlerBowl(p.id));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(rng() * eligible.length)].id;
}
