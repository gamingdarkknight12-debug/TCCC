// Cricket "overs" figures are ball-count notation, not decimals — 4.1 means
// 4 overs + 1 ball (25 balls total), not 4.1 overs. Summing raw overs values
// with plain `+=` across innings is wrong in two ways: floating-point noise
// (e.g. 35.699999999999996), and — more seriously — a wrong total whenever
// ball-remainders add past 5 (3.4 + 2.5 naively = 5.9, but the true total is
// 22+17=39 balls = 6 overs 3 balls = 6.3). Always convert to balls, sum
// balls (plain integers), then convert back to overs notation once at the end.
export function oversToBalls(overs) {
  const whole = Math.floor(overs);
  const partialBalls = Math.round((overs - whole) * 10);
  return whole * 6 + partialBalls;
}

export function ballsToOvers(balls) {
  return Math.floor(balls / 6) + (balls % 6) / 10;
}

// For a per-over RATE (economy, runs conceded per over) — never divide by
// the notation value from ballsToOvers. "16.5" means 16 overs + 5 balls, not
// literally 16.5 of something; treating it as a decimal divisor understates
// the true overs bowled (5 balls is 5/6 = 0.83 of an over, not 0.5), which
// systematically overstates economy. The true decimal for rate math is
// simply balls/6.
export function ballsToDecimalOvers(balls) {
  return balls / 6;
}
