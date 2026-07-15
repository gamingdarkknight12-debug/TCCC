'use client';

import { PageWrap, InfoCard } from '../UI';

export function Seasons() {
  return (
    <PageWrap
      id="seasons"
      title="Seasons"
      subtitle="Telugu Titans league journey across BEDCL, HDCL, and MCPL."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          title="2022 Season"
          text="MCPL Division 2: Telugu Titans finished 6th of 9 teams with 30 points (5W-7L, NRR -0.010)."
        />

        <InfoCard
          title="2023 Season"
          text=" MCPL: Telugu Titans fielded two teams - Telugu Titans-A finished 7th in the Meadowvale Conference with 42 points (7W-5L), and Telugu Titans-B finished 13th in the Heartland Conference with 12 points (1W-9L)."
        />

        <InfoCard
          title="2024 Season"
          text="BEDCL: Telugu Titans finished 6th in Division E - Conference A with 25 points. HDCL: Telugu Titans finished 8th in Group C with 30 points."
        />

        <InfoCard
          title="2025 Season"
          text="BEDCL: Telugu Titan finished 4th in Division F - Conference B with 70 points. HDCL: Telugu Titans finished 6th in Group A with 75 points."
        />

        <InfoCard
          title="2026 Season"
          text="Telugu Titans are competing in BEDCL and MCPL with a stronger squad, better depth, and bigger goals for the season."
        />
      </div>

      <div className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
        <h3 className="text-2xl font-bold text-amber-300">
          Season Direction
        </h3>

        <p className="mt-4 leading-7 text-white/75">
          From rebuilding years to a stronger 2026 squad, Telugu Titans are focused
          on consistency, availability, stronger batting partnerships, controlled
          bowling, and converting close matches into wins.
        </p>
      </div>
    </PageWrap>
  );
}
