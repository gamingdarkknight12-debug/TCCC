'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { HighlightCard } from '../UI';
import { NextMatchCard } from '../NextMatchCard';

export function Hero() {
  const [allTime, setAllTime] = useState(null);
  const [season2026, setSeason2026] = useState(null);

  useEffect(() => {
    fetch('/api/stats?season=all')
      .then((res) => res.json())
      .then((data) => setAllTime(data))
      .catch(() => setAllTime({ batting: [], bowling: [] }));

    fetch('/api/stats?season=2026')
      .then((res) => res.json())
      .then((data) => setSeason2026(data))
      .catch(() => setSeason2026({ batting: [], bowling: [] }));
  }, []);

  const topBatter = allTime?.batting?.[0];
  const topBowler = allTime?.bowling?.[0];

  const impactPlayerBat = allTime?.batting?.find((p) => p.name === "Srikanth Govula");
  const impactPlayerBowl = allTime?.bowling?.find((p) => p.name === "Srikanth Govula");
  const impactPlayer = {
    name: "Srikanth Govula",
    runs: impactPlayerBat?.runs || 0,
    wickets: impactPlayerBowl?.wickets || 0,
  };

  const titanBat = season2026?.batting?.find((p) => p.name === "Martin Thandhara");
  const titanBowl = season2026?.bowling?.find((p) => p.name === "Martin Thandhara");
  const titanPlayer = {
    name: "Martin Thandhara",
    runs: titanBat?.runs || 0,
    wickets: titanBowl?.wickets || 0,
  };

  const hasStats = allTime && allTime.batting.length > 0;

  return (
    <section className="relative overflow-hidden px-4 pt-4 pb-16 md:pt-8 md:pb-24">
      {/* Team Switcher - Desktop + Mobile */}
      <div className="relative z-30 mx-auto mb-8 flex max-w-7xl justify-center px-4 md:absolute md:right-8 md:top-8 md:mx-0 md:mb-0 md:block md:px-0">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-xl">
          <span className="rounded-full bg-amber-300 px-5 py-2 text-sm font-black text-black">
            TT
          </span>

          <a
            href="/fucc"
            className="rounded-full px-5 py-2 text-sm font-black text-white transition hover:bg-white/10"
          >
            FUCC
          </a>
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(30,64,175,0.2),transparent_35%)]" />

      <div className="hero-left-content relative mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm text-amber-200">Telugu Titans</div>

          <div className="mobile-title-logo">
            <h1 className="text-5xl font-black leading-none md:text-7xl">
              Beyond the Pitch, <span className="text-amber-300">We Unite.</span>
            </h1>

            <img
              src="/tccc-logo.png"
              alt="TCCC Logo"
              className="mobile-logo-inside"
            />
          </div>

          <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
            A cricket community built on performance, brotherhood, Telugu pride, and opportunities for players to grow on and off the field.
          </p>

          <NextMatchCard />
        </div>

        <div className="home-logo-card flex justify-center lg;:justify-end">
          <div className="rounded-[2rem] border border-amber-300/25 bg-white/5 p-8 shadow-2xl shadow-amber-500/10">
            <Image src="/tccc-logo.png" alt="TCCC Logo" width={320} height={320} priority />
          </div>
        </div>

        {hasStats && (
          <div className="home-stats-grid mt-10 grid   w-[1400px] grid-cols-4 gap-6 max-w-5xl">
            <HighlightCard
              className="highlight-card"
              title="Run Machine"
              name={topBatter?.name}
              stat={`${topBatter?.runs || 0} all-time runs`}
              note="Top run scorer for Titans."
            />

            <HighlightCard
              className="highlight-card"
              title="Wicket Leader"
              name={topBowler?.name}
              stat={`${topBowler?.wickets || 0} all-time wickets`}
              note="Leading wicket taker for Titans."
            />

            <HighlightCard
              className="highlight-card"
              title="Impact Player"
              name={impactPlayer?.name}
              stat={`${impactPlayer?.runs || 0} runs + ${impactPlayer?.wickets || 0} wickets`}
              note="Useful in pressure phases and team balance."
            />

            <HighlightCard
              className="highlight-card"
              title="Emerging Titan of 2026"
              name={titanPlayer?.name}
              stat={`${titanPlayer?.runs || 0} runs + ${titanPlayer?.wickets || 0} wickets`}
              note="This season's standout with bat and ball."
            />
          </div>
        )}
      </div>
    </section>
  );
}
