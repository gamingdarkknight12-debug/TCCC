// Second pass of the difficulty pipeline: stats -> difficulty.js baseline ->
// attributeModifiers.js (this file) -> final gameplay params. Applies the
// manually-authored playing-style archetype (and, for bowlers, remaining
// stamina) on top of the stat-derived baseline from difficulty.js.

import { clamp, bowlingParamsFromThreat, battingParamsFromSolidity } from './difficulty.js';

export const ARCHETYPES = ['Aggressor', 'Anchor', 'Finisher', 'Workhorse', 'Wildcard', 'Balanced'];

const ARCHETYPE_MODIFIERS = {
  Aggressor: { battingAggression: 1.25, battingDismissal: 1.15, bowlingVariety: 1.2, bowlingLineDeviation: 1.15 },
  Anchor: { battingAggression: 0.75, battingDismissal: 0.8, bowlingVariety: 0.85, bowlingLineDeviation: 0.85 },
  Finisher: {
    battingAggression: 0.95,
    battingDismissal: 1.0,
    battingAggressionDeath: 1.4,
    battingDismissalDeath: 1.1,
    bowlingVariety: 1.0,
    bowlingLineDeviation: 1.0,
  },
  // Workhorse is defined by halved stamina decay (see MatchState.decayBowlerStamina),
  // not by a multiplier here.
  Workhorse: { battingAggression: 1.0, battingDismissal: 1.0, bowlingVariety: 1.0, bowlingLineDeviation: 1.0 },
  Wildcard: { battingAggression: 1.5, battingDismissal: 1.5, bowlingVariety: 1.0, bowlingLineDeviation: 1.3 },
  Balanced: { battingAggression: 1.0, battingDismissal: 1.0, bowlingVariety: 1.0, bowlingLineDeviation: 1.0 },
};

function modifiersFor(archetype) {
  return ARCHETYPE_MODIFIERS[archetype] || ARCHETYPE_MODIFIERS.Balanced;
}

// staminaRemaining: 0-100, decayed per-over in MatchState. Below 100, scales
// the bowler's effective threat down (a tired real-bowling-great is easier to
// face) by feeding a reduced threat back through the *same*
// bowlingParamsFromThreat formula, rather than inventing separate knobs.
export function getEffectiveBowlingParams({ threat, archetype = 'Balanced', staminaRemaining = 100 }) {
  const staminaFactor = clamp(staminaRemaining / 100, 0.5, 1);
  const effectiveThreat = clamp(threat * staminaFactor, 0, 100);
  const baseParams = bowlingParamsFromThreat(effectiveThreat);
  const mod = modifiersFor(archetype);
  return {
    ...baseParams,
    deliveryVarietyCount: Math.max(1, Math.round(baseParams.deliveryVarietyCount * mod.bowlingVariety)),
    lineDeviationPx: baseParams.lineDeviationPx * mod.bowlingLineDeviation,
    effectiveThreat,
  };
}

export function getEffectiveBattingParams({ solidity, sr = 50, archetype = 'Balanced', isDeathOvers = false }) {
  const baseParams = battingParamsFromSolidity(solidity, sr);
  const mod = modifiersFor(archetype);
  const useDeathModifiers = archetype === 'Finisher' && isDeathOvers;
  const aggressionMult = useDeathModifiers ? mod.battingAggressionDeath : mod.battingAggression;
  const dismissalMult = useDeathModifiers ? mod.battingDismissalDeath : mod.battingDismissal;
  return {
    aggressionShotChance: clamp(baseParams.aggressionShotChance * aggressionMult, 0, 1),
    dismissalBaseChancePerBall: clamp(baseParams.dismissalBaseChancePerBall * dismissalMult, 0, 1),
  };
}
