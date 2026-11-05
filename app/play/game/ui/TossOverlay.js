'use client';

// Single-player-only in-game coin flip, React version of the old
// TossScene.js. Builds the MatchState once the toss resolves and hands it
// up via onMatchReady - online matches skip this entirely (toss already
// happened in app/play/online/OnlineToss.js before GameCanvas even mounts).

import { useState } from 'react';
import { MatchState } from '../engine/MatchState';

const USER_TEAM_KEY = 'A';

export default function TossOverlay({ matchConfig, onMatchReady }) {
  const [stage, setStage] = useState('call'); // 'call' | 'choose' | 'waiting'
  const [flipResult, setFlipResult] = useState(null);
  const [aiMessage, setAiMessage] = useState(null);

  function doToss(call) {
    const flip = Math.random() < 0.5 ? 'heads' : 'tails';
    setFlipResult(flip);
    const userWonToss = flip === call;

    if (userWonToss) {
      setStage('choose');
    } else {
      const aiChoice = Math.random() < 0.6 ? 'B' : 'A';
      setAiMessage(`Opponent won the toss and chose to ${aiChoice === 'B' ? 'bat' : 'bowl'} first.`);
      setStage('waiting');
      setTimeout(() => startMatch(aiChoice), 1400);
    }
  }

  function startMatch(battingFirstTeamKey) {
    const matchSeed = Math.floor(Math.random() * 2 ** 31);
    const matchState = new MatchState({
      oversPerSide: matchConfig.oversPerSide,
      squadSize: matchConfig.squadSize,
      teamA: { id: 'A', name: matchConfig.userTeam.name, players: matchConfig.userTeam.players },
      teamB: { id: 'B', name: matchConfig.opponentTeam.name, players: matchConfig.opponentTeam.players },
      battingFirst: battingFirstTeamKey,
      matchSeed,
    });
    onMatchReady(matchState, USER_TEAM_KEY);
  }

  if (stage === 'call') {
    return (
      <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
        <h3 className="text-2xl font-black text-amber-300">Toss</h3>
        <p className="text-white/80">Call it:</p>
        <div className="flex gap-4">
          <button onClick={() => doToss('heads')} className="btn btn-gold">
            Heads
          </button>
          <button onClick={() => doToss('tails')} className="btn btn-gold">
            Tails
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'choose') {
    return (
      <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
        <h3 className="text-2xl font-black text-amber-300">Toss</h3>
        <p className="text-white">It&apos;s {flipResult}! You won the toss. Bat or bowl?</p>
        <div className="flex gap-4">
          <button onClick={() => startMatch('A')} className="btn btn-gold">
            Bat
          </button>
          <button onClick={() => startMatch('B')} className="btn btn-gold">
            Bowl
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
      <h3 className="text-2xl font-black text-amber-300">Toss</h3>
      <p className="text-white">It&apos;s {flipResult}!</p>
      <p className="max-w-xs text-white/80">{aiMessage}</p>
    </div>
  );
}
