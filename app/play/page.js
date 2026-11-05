'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '../components/UI';
import TeamSelect from './TeamSelect';
import ModeSelect from './online/ModeSelect';
import OnlineFlow from './online/OnlineFlow';

// Never SSR'd - GameCanvas imports three.js at module scope, which touches
// `window` on load.
const GameCanvas = dynamic(() => import('./GameCanvas'), { ssr: false });

export default function PlayPage() {
  const [mode, setMode] = useState(null); // 'single' | 'online'
  const [gameProps, setGameProps] = useState(null); // props to hand to GameCanvas once ready
  const [matchKey, setMatchKey] = useState(0);

  function handleMatchComplete() {
    setMode(null);
    setGameProps(null);
    setMatchKey((k) => k + 1);
  }

  return (
    <>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-black text-amber-300 sm:text-4xl md:text-5xl">Play</h2>
        <p className="mt-3 max-w-3xl text-white/70">
          A 5-over cricket match against your TCCC teammates — solo vs the computer, or 1-on-1
          online against a friend.
        </p>

        <div className="mt-8">
          {gameProps ? (
            <GameCanvas key={matchKey} {...gameProps} onMatchComplete={handleMatchComplete} />
          ) : mode === 'single' ? (
            <TeamSelect
              key={matchKey}
              onReady={(matchConfig) => setGameProps({ matchConfig })}
            />
          ) : mode === 'online' ? (
            <OnlineFlow key={matchKey} onReady={setGameProps} />
          ) : (
            <ModeSelect onSelect={setMode} />
          )}
        </div>
      </section>
    </>
  );
}
