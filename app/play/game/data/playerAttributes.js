// Hand-authored per-player playing style for the /play cricket mini-game.
// Edit this file directly to set a teammate's skill/style/mode/stamina --
// there's no admin UI for this in v1. Keyed by `canonical_name`, same key
// every other stats file in this codebase uses (app/lib/playerCareer.js,
// app/api/stats/route.js), NOT the opaque DB id.
//
// archetype: one of 'Aggressor' | 'Anchor' | 'Finisher' | 'Workhorse' | 'Wildcard' | 'Balanced'
//   - Aggressor: boundary-hungry, higher risk of getting out going for it.
//   - Anchor ("Mr. Dependable"): low risk, consistent, holds one end up.
//   - Finisher: passive early, explosive in the death overs.
//   - Workhorse: bowling-stamina specialist (burns stamina half as fast).
//   - Wildcard: high variance both ways.
// battingHand: 'right' | 'left'
// bowlingType: 'pace' | 'spin' | null (null = doesn't bowl)
// stamina: 0-100, starting stamina for a bowler (decays per over bowled)

export const DEFAULT_ATTRIBUTES = {
  archetype: 'Balanced',
  battingHand: 'right',
  bowlingType: null,
  stamina: 70,
};

export const PLAYER_ATTRIBUTES = {
  Nipun: { archetype: 'Aggressor', battingHand: 'right', bowlingType: null, stamina: 75 },
  'Charan Teja Bandaru': { archetype: 'Aggressor', battingHand: 'right', bowlingType: 'pace', stamina: 80 },
  'Varun Rambha': { archetype: 'Anchor', battingHand: 'right', bowlingType: 'spin', stamina: 85 },
};

export function getPlayerAttributes(canonicalName) {
  return PLAYER_ATTRIBUTES[canonicalName] || DEFAULT_ATTRIBUTES;
}
