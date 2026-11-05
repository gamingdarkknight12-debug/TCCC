// The one function both clients in a multiplayer match run independently,
// given the same two commits + the same per-ball seed (see rng.js) + the same
// bowling/batting gameplay params (from difficulty.js + attributeModifiers.js)
// - so neither client needs to be a trusted authority.
//
// v1 simplification: a `dismissalType: 'caught'` result represents "the shot
// carried to a fielder" - at the scene layer (not yet wired, see FieldingPrompt
// in the build plan) this should be treated as provisional and can be
// overturned into a dropped catch by the catch-timing QTE. The engine itself
// has no fielder stats to resolve that, so it always returns the "fielder
// held it" outcome.

import { createRng } from './rng.js';
import { clamp } from './difficulty.js';

const WIDE_OR_NOBALL_CHANCE = 0.05;

/**
 * @param {object} args
 * @param {{line?:string, length?:string, timingAccuracy?:number}} args.bowlerCommit timingAccuracy in [0,1], 1 = perfectly executed delivery (hard to play), line/length are flavor/animation only in v1 - not fed into the math (bowler skill already enters via bowlingParams.lineDeviationPx, which is stat-derived)
 * @param {{shotType:'power'|'defensive', timingError:number}} args.batterCommit timingError in [-1,1], 0 = perfect
 * @param {object} args.bowlingParams from getEffectiveBowlingParams()
 * @param {object} args.battingParams from getEffectiveBattingParams()
 * @param {number} args.seed from rng.seedForBall(matchSeed, cumulativeBallIndex)
 */
export function resolveBall({ bowlerCommit, batterCommit, bowlingParams, battingParams, seed }) {
  const rng = createRng(seed);

  if (rng() < WIDE_OR_NOBALL_CHANCE) {
    return rng() < 0.5
      ? { runsScored: 0, isWicket: false, isWide: true, isNoBall: false }
      : { runsScored: 0, isWicket: false, isWide: false, isNoBall: true };
  }

  const timingQuality = 1 - clamp(Math.abs(batterCommit.timingError ?? 0), 0, 1);
  const bowlerPressure = clamp((bowlingParams.lineDeviationPx ?? 20) / 50, 0, 1);
  const bowlerExecution = clamp(bowlerCommit.timingAccuracy ?? 0.7, 0, 1);
  // A well-executed delivery (high timingAccuracy) makes the ball harder to
  // time; a badly-executed one (full toss/long hop) leaves more room for the
  // batter, on top of the stat-driven bowlerPressure term.
  const effectiveTiming = clamp(timingQuality - bowlerPressure * 0.3 - bowlerExecution * 0.25, 0, 1);

  const wicketChance = clamp(
    (battingParams.dismissalBaseChancePerBall ?? 0.05) * (1 + (1 - effectiveTiming) * 1.5),
    0,
    0.9
  );
  if (rng() < wicketChance) {
    const dismissalType = batterCommit.shotType === 'power' ? 'caught' : 'bowled';
    return { runsScored: 0, isWicket: true, dismissalType, isWide: false, isNoBall: false };
  }

  const isAggressive = batterCommit.shotType === 'power';
  const boundaryChance = clamp(
    (battingParams.aggressionShotChance ?? 0.25) * (isAggressive ? 1 : 0.35) * effectiveTiming,
    0,
    0.8
  );

  const outcomeRoll = rng();
  if (outcomeRoll < boundaryChance * 0.4) {
    return { runsScored: 6, isWicket: false, isAerial: true, isWide: false, isNoBall: false };
  }
  if (outcomeRoll < boundaryChance) {
    return { runsScored: 4, isWicket: false, isWide: false, isNoBall: false };
  }

  const runsRoll = rng();
  const runsScored = runsRoll < 0.45 ? 0 : runsRoll < 0.75 ? 1 : runsRoll < 0.9 ? 2 : 3;
  const isAerial = isAggressive && runsRoll >= 0.9;
  return { runsScored, isWicket: false, isAerial, isWide: false, isNoBall: false };
}
