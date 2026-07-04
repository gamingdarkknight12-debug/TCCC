'use client';

import { PageWrap, InfoCard } from '../UI';

export function About() {
  return (
    <PageWrap id="about" title="About TCCC" subtitle="A cricket club built for community, competition, and growth.">
      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard title="Our Story" text="The club’s roots go back to Andhra Tycoons in 2008, later reformed as Telugu Cricket Club Canada in 2022." />
        <InfoCard title="Our Vision" text="Batting for a stronger South Asian community through cricket, while developing younger players and creating opportunities." />
        <InfoCard title="Competitive + Recreational" text="TCCC supports both serious competition and recreational cricket." />
        <InfoCard title="Future Roadmap" text="Multiple teams, international exposure, cricket leagues, and community-driven development." />
      </div>
    </PageWrap>
  );
}
