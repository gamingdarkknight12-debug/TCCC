'use client';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Header, PageWrap, InfoCard, HighlightCard, StatTable } from './components/UI';
import { stats2024, stats2025, stats2026, captains, legends, standings2024, standings2025 } from './data';

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export default function Home() {
  const [season, setSeason] = useState('All-Time');
  const allTime = useMemo(() => {
    const batting = {};
    [...stats2025.batting, ...stats2024.batting].forEach((p) => {
      const key = p.name.toLowerCase().trim();
      if (!batting[key]) batting[key] = { name: p.name, runs: 0, balls: 0, fours: 0, sixes: 0, inns: 0 };
      batting[key].runs += num(p.runs); batting[key].balls += num(p.balls); batting[key].fours += num(p.fours); batting[key].sixes += num(p.sixes); batting[key].inns += num(p.inns);
    });
    const bowling = {};
    [...stats2025.bowling, ...stats2024.bowling].forEach((p) => {
      const key = p.name.toLowerCase().trim();
      if (!bowling[key]) bowling[key] = { name: p.name, overs: 0, runs: 0, wickets: 0, inns: 0 };
      bowling[key].overs += num(p.overs); bowling[key].runs += num(p.runs); bowling[key].wickets += num(p.wickets); bowling[key].inns += num(p.inns);
    });
    return { batting: Object.values(batting).sort((a,b) => b.runs-a.runs), bowling: Object.values(bowling).sort((a,b) => b.wickets-a.wickets) };
  }, []);
  const data = season === '2026' ? stats2026 : season === '2025' ? stats2025 : season === '2024' ? stats2024 : allTime;
  const topBatter = allTime.batting[0];
  const topBowler = allTime.bowling[0];
  const impactPlayer = allTime.batting.find((p) => p.name === 'Aadil') || allTime.batting[2];
  const emergingPlayer = { name: 'Kapil', runs: 62, wickets: 11 };

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(30,64,175,0.2),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm text-amber-200">Telugu Cricket Club Canada</div>
            <h1 className="text-5xl font-black leading-tight md:text-7xl">Beyond the Pitch, <span className="text-amber-300">We Unite.</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">A cricket community built on performance, brotherhood, Telugu pride, and opportunities for players to grow on and off the field.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a className="btn btn-gold" href="#stats">View Player Stats</a><a className="btn btn-ghost" href="#leadership">Meet Captains</a></div>
          </div>
          <div className="flex justify-center"><div className="rounded-[2rem] border border-amber-300/25 bg-white/5 p-8 shadow-2xl shadow-amber-500/10"><Image src="/tccc-logo.png" alt="TCCC Crest" width={420} height={420} priority /></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8"><div className="grid gap-4 md:grid-cols-4">
        <HighlightCard title="Run Machine" name={topBatter.name} stat={`${topBatter.runs} all-time runs`} note="Most consistent batting contributor from available data." />
        <HighlightCard title="Wicket Leader" name={topBowler.name} stat={`${topBowler.wickets} all-time wickets`} note="Reliable wicket-taking option across seasons." />
        <HighlightCard title="Impact Player" name={impactPlayer.name} stat={`${impactPlayer.runs} runs + all-round value`} note="Useful in pressure phases and team balance." />
        <HighlightCard title="Emerging Force" name={emergingPlayer.name} stat={`${emergingPlayer.wickets} wickets + ${emergingPlayer.runs} runs`} note="Useful lower-order and bowling impact option for the squad." />
      </div></section>

      <section className="mx-auto max-w-7xl px-4 py-12"><div className="mb-6"><h2 className="text-3xl font-black text-amber-300 md:text-4xl">Legends of Our Team</h2><p className="mt-2 text-white/65">Honouring players who helped build the team’s competitive identity.</p></div><div className="grid gap-6 md:grid-cols-2">{legends.map((l) => <div key={l.name} className="gold-card p-6"><div className="text-sm uppercase tracking-widest text-amber-300">{l.title}</div><h3 className="mt-3 text-3xl font-black">{l.name}</h3><div className="mt-3 rounded-2xl bg-black/30 p-4 text-lg font-bold text-amber-200">{l.stats}</div><p className="mt-4 leading-7 text-white/75">{l.note}</p></div>)}</div></section>

      <PageWrap id="about" title="About TCCC" subtitle="A cricket club built for community, competition, and growth."><div className="grid gap-6 md:grid-cols-2"><InfoCard title="Our Story" text="The club’s roots go back to Andhra Tycoons in 2008, later reformed as Telugu Cricket Club Canada in 2022." /><InfoCard title="Our Vision" text="Batting for a stronger South Asian community through cricket, while developing younger players and creating opportunities." /><InfoCard title="Competitive + Recreational" text="TCCC supports both serious competition and recreational cricket." /><InfoCard title="Future Roadmap" text="Multiple teams, international exposure, cricket leagues, and community-driven development." /></div></PageWrap>

      <PageWrap id="leadership" title="Leadership" subtitle="Captains guiding Telugu Titans under the TCCC banner."><div className="grid gap-6 md:grid-cols-3">{captains.map((c) => <div key={c.name} className="card p-6"><div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-amber-300 text-3xl font-black text-black">{c.name.split(' ').map((x) => x[0]).join('')}</div><h3 className="text-2xl font-bold text-amber-300">{c.name}</h3><p className="mt-1 text-sm text-white/60">{c.role}</p><p className="mt-4 leading-7 text-white/75">{c.note}</p></div>)}</div></PageWrap>

      <PageWrap
  id="players"
  title="Players"
  subtitle="Meet the Telugu Titans squad under TCCC banner."
>
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

    {[
  { name: "Amit Koul", skill: "All-rounder", image: "/players/1.jpeg" },
  { name: "Anand Chaitanya", skill: "All-rounder", image: "/players/2.jpeg" },
  { name: "Arun", role: "", skill: "Bowler", image: "/players/3.jpg" },
  { name: "Bhanu Musunuru", role: "Captain", skill: "All-rounder, energy, presence", image: "/players/4.jpg" },
  { name: "Charan Teja", role: "Captain", skill: "Wicket Keeper/Batter", image: "/players/5.jpeg" },
  { name: "Chari", skill: "All-rounder", image: "/players/6.jpeg" },
  { name: "Aadil Khan", role: "Vice Captain", skill: "All-rounder", image: "/players/7.jpg" },
  { name: "Manish Raj", skill: "Spin Bowling All rounder", image: "/players/8.png" },
  { name: "Martin Thandhara", skill: "To be updated", image: "/players/9.jpg" },
  { name: "Nagesh Kowligi", skill: "All-rounder", image: "/players/10.jpg" },
  { name: "Naveen Gajula", skill: "All-rounder", image: "/players/11.jpeg" },
  { name: "Nikhil Holagunda", skill: "All-rounder",  image: "/players/12.jpeg" },
  { name: "Sai", skill: "Impact Bowler", image: "/players/13.jpeg" },
  { name: "Shanthan Akkiraju", skill: "Bowler", image: "/players/14.jpeg" },
  { name: "STP", skill: "", skill: "Bowler", image: "/players/15.jpeg" },
  { name: "Varun Rambha", skill: "All-rounder", image: "/players/16.jpeg" },
  { name: "Vikas Tiwari", skill: "Bowler",  image: "/players/17.jpeg" },
  { name: "Vikranth Nyalakonda", skill: "Wicket Keeper/Batter",  image: "/players/18.jpeg" }

    ].map((p)=>(
      <div key={p.name} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <img src={p.img} className="h-72 w-full object-cover" />
        <div className="p-4">
          <h3 className="text-xl font-bold text-amber-300">{p.name}</h3>
          <p className="text-white/70">{p.role}</p>
        </div>
      </div>
    ))}

  </div>
</PageWrap>

<PageWrap
  id="analysis"
  title="Match Analysis"
  subtitle="Upcoming clash: Telugu Titans vs Brampton Strikers | Next Sunday"
>
  <div className="grid gap-6 md:grid-cols-2">

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-2xl font-bold text-amber-300">
        Opponent Snapshot
      </h3>

      <ul className="space-y-3 text-white/80">
        <li>• Strong batting unit with aggressive top order</li>
        <li>• Capable of scoring fast in powerplay</li>
        <li>• Bowling attack becomes dangerous if defending 170+</li>
        <li>• Pressure builds when early wickets fall</li>
      </ul>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-2xl font-bold text-amber-300">
        Players To Watch (Brampton Strikers)
      </h3>

      <div className="space-y-3 text-white/80">
        <p>🔥 Ali Shah – Top scorer in previous clash (64)</p>
        <p>🔥 Ravi Patil – Finisher + wicket taker</p>
        <p>🔥 Hamza Talal – Impact batting + fielding</p>
        <p>🔥 Hafiz Asim Ali – Dangerous middle overs hitter</p>
      </div>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-2xl font-bold text-amber-300">
        Titans Strategy
      </h3>

      <ul className="space-y-3 text-white/80">
        <li>• Get Ali Shah early</li>
        <li>• Tight powerplay bowling first 6 overs</li>
        <li>• Varun / Charan anchor chase smartly</li>
        <li>• Nipun/ Anand can accelerate the scoring</li>
        <li>• Save wickets till final 8 overs while chasing</li>
      </ul>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-2xl font-bold text-amber-300">
        Prediction
      </h3>

      <p className="leading-7 text-white/80">
        If Titans remove Ali Shah early and keep extras under control,
        this becomes a 50-50 contest. Score target range: 155–175.
      </p>
    </div>

  </div>
</PageWrap>
      <PageWrap id="stats" title="Player Stats" subtitle="Historical performance across available seasons."><div className="mb-6 flex flex-wrap gap-3">{['All-Time','2026','2025','2024'].map((s) => <button key={s} onClick={() => setSeason(s)} className={`btn ${season === s ? 'btn-gold' : 'btn-ghost'}`}>{s}</button>)}</div>{season === '2026' && <div className="mb-6 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">2026 stats will populate here after admin score imports.</div>}<div className="grid gap-6 lg:grid-cols-2"><StatTable title="Batting Leaders" headers={['Player','Runs','Balls','4s','6s','SR']} rows={data.batting.map((p) => [p.name,p.runs,p.balls,p.fours || '-',p.sixes || '-',p.sr || (p.balls ? ((p.runs/p.balls)*100).toFixed(1) : '-')])} /><StatTable title="Bowling Leaders" headers={['Player','Overs','Runs','Wickets','Eco']} rows={data.bowling.map((p) => [p.name,p.overs,p.runs,p.wickets,p.economy || (p.overs ? (p.runs/p.overs).toFixed(1) : '-')])} /></div></PageWrap>

      <PageWrap id="seasons" title="Seasons" subtitle="League participation, standings, and 2026 direction."><div className="grid gap-6 md:grid-cols-3 mb-6"><InfoCard title="2024 Season" text="TCCC/Titans played both BEDCL and HDCL. In BEDCL standings, GTA Legends finished Division E Conference A with 25 points." /><InfoCard title="2025 Season" text="TCCC/Titans again played both BEDCL and HDCL. GTA Legends finished Division F Conference B with 70 points." /><InfoCard title="2026 Season" text="TCCC/Telugu Titans are contenders in both BEDCL and MCPL." /></div><div className="grid gap-6 lg:grid-cols-2"><Standing title="2024 BEDCL Standing" rows={standings2024} /><Standing title="2025 BEDCL Standing" rows={standings2025} /></div></PageWrap>

      <PageWrap id="contact" title="Contact / Join TCCC" subtitle="For players, supporters, sponsors, and community members."><div className="card p-6"><h3 className="text-2xl font-bold text-amber-300">Coming Next</h3><p className="mt-4 leading-7 text-white/75">This section can include Instagram, YouTube, WhatsApp contact, sponsor inquiry, and player registration workflow.</p></div></PageWrap>
      <footer className="border-t border-white/10 bg-black/40 px-4 py-8 text-center text-sm text-white/60">© 2026 Telugu Cricket Club Canada. Built for TCCC and Telugu Titans.</footer>
    </main>
  );
}

function Standing({ title, rows }) {
  return <StatTable title={title} headers={['Conference','Team','GP','W','L','NR','Pts']} rows={rows} />;
}
