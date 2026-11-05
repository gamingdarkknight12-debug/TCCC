// Fielder position table. MatchState's squadSize is 6 or 8 (not 11), so
// after the bowler + wicketkeeper the bowling side has 4 positioned fielders
// at 6-a-side, 6 at 8-a-side. Positions are {name, angleDeg, radiusFraction}
// relative to the pitch center - angleDeg measured from the bowler-to-batsman
// axis (0 = straight down the ground past the batsman), increasing clockwise
// toward the off side. These are purely positional (no movement/AI), used
// both to place fielder figures and to pick a deterministic "fielder
// involved" for the catch QTE / run-out visual (see MatchOrchestrator).

const FIELDER_POSITIONS_6 = [
  { name: 'slip', angleDeg: 200, radiusFraction: 0.3 },
  { name: 'cover', angleDeg: 300, radiusFraction: 0.75 },
  { name: 'mid-on', angleDeg: 30, radiusFraction: 0.8 },
  { name: 'square-leg', angleDeg: 90, radiusFraction: 0.75 },
];

const FIELDER_POSITIONS_8 = [
  ...FIELDER_POSITIONS_6,
  { name: 'mid-off', angleDeg: 330, radiusFraction: 0.8 },
  { name: 'fine-leg', angleDeg: 135, radiusFraction: 0.8 },
];

export function fieldPositionsFor(squadSize) {
  return squadSize >= 8 ? FIELDER_POSITIONS_8 : FIELDER_POSITIONS_6;
}
