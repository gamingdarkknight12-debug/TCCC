'use client';

import { ballsToOvers } from '../../../lib/oversMath';

export default function ResultOverlay({ matchState, result, onMatchComplete }) {
  // Read names from matchState.teams, not a hardcoded 'A' = user assumption
  // - in online play userTeamKey can be 'A' (host) or 'B' (joiner).
  const teamName = (key) => matchState.teams[key].name;

  const headline = result.winner == null ? "It's a tie!" : `${teamName(result.winner)} win by ${result.margin}`;
  const first = result.scoreFirstInnings;
  const second = result.scoreSecondInnings;

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-center">
      <h3 className="text-2xl font-black text-amber-300">Match Complete</h3>
      <p className="text-xl font-bold text-white">{headline}</p>
      <p className="text-white/80">
        {teamName(first.battingTeam)}: {first.runs}/{first.wickets} ({ballsToOvers(first.ballsBowled)} ov)
      </p>
      <p className="text-white/80">
        {teamName(first.battingTeam === 'A' ? 'B' : 'A')}: {second.runs}/{second.wickets} ({ballsToOvers(second.ballsBowled)} ov)
      </p>
      <button onClick={() => onMatchComplete(result)} className="btn btn-gold mt-3">
        Play Again
      </button>
    </div>
  );
}
