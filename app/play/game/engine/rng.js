// Deterministic PRNG so both clients in a multiplayer match (and single-player
// replays) resolve a ball identically given the same seed — Math.random()
// cannot be used anywhere in the match engine.

export function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a style string hash -> uint32, used to derive a per-ball seed from the
// agreed match seed + ball index (and to build the cheap drift-detection hash
// sent as `ball_resolved`).
export function hashToSeed(...parts) {
  const str = parts.join(':');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seedForBall(matchSeed, cumulativeBallIndex) {
  return hashToSeed(matchSeed, cumulativeBallIndex);
}
