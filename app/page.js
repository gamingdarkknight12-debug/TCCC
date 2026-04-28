'use client';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Header, PageWrap, InfoCard, HighlightCard, StatTable } from './components/UI';
import { stats2024, stats2025, stats2026, captains, legends, standings2024, standings2025 } from './data';

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export default function Home() {
  const [season, setSeason] = useState('All-Time');
  const [selectedSchedule, setSelectedSchedule] = useState('BEDCL');

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
            <div className="mb-4 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm text-amber-200">Telugu Titans</div>
            <h1 className="text-5xl font-black leading-tight md:text-7xl">Beyond the Pitch, <span className="text-amber-300">We Unite.</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">A cricket community built on performance, brotherhood, Telugu pride, and opportunities for players to grow on and off the field.</p>
            <NextMatchCard />
            <div className="mt-8 flex flex-wrap gap-3">
  <a className="btn btn-gold" href="#stats">View Player Stats</a>

  <a className="btn btn-ghost" href="#players">Meet Players</a>
  <a className="btn btn-ghost" href="#analysis">Upcoming Match Analysis</a>
</div>          </div>
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

     
      <PageWrap
  id="news"
  title="News"
  subtitle="Latest Telugu Titans updates, player stories, and team highlights."
>
{/* Featured Player Carousel */}
<div className="mb-10 overflow-x-auto pb-4">
  <div className="flex gap-6">

    {/* Inder */}
    <div className="min-w-[340px] overflow-hidden rounded-3xl border border-amber-300/20 bg-white/5 shadow-xl md:min-w-[420px]">
      <div className="relative h-80">
        <img
          src="/players/22.jpeg"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 20%" }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-amber-300 px-4 py-1 text-xs font-black text-black">
          NEW SIGNING
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-3xl font-black text-amber-300">Welcome Inder</h3>
        <p className="mt-3 leading-7 text-white/75">
          Telugu Titans welcomes Inder to the squad for the 2026 season.
        </p>
      </div>
    </div>

    {/* Dheeraj */}
    <div className="min-w-[340px] overflow-hidden rounded-3xl border border-amber-300/20 bg-white/5 shadow-xl md:min-w-[420px]">
      <div className="relative h-80">
        <img
          src="/players/23.jpeg"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 20%" }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-amber-300 px-4 py-1 text-xs font-black text-black">
          NEW SIGNING
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-3xl font-black text-amber-300">Welcome Dheeraj</h3>
        <p className="mt-3 leading-7 text-white/75">
          Dheeraj joins Telugu Titans bringing fresh energy and commitment.
        </p>
      </div>
    </div>

    {/* Amit */}
    <div className="min-w-[340px] overflow-hidden rounded-3xl border border-amber-300/20 bg-white/5 shadow-xl md:min-w-[420px]">
      <div className="relative h-80">
        <img
          src="/players/1.jpeg"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 20%" }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-amber-300 px-4 py-1 text-xs font-black text-black">
          NEW SIGNING
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-3xl font-black text-amber-300">Welcome Amit</h3>
        <p className="mt-3 leading-7 text-white/75">
          Amit joins Telugu Titans bringing his amazing round skills to the table.
        </p>
      </div>
    </div>

    {/* Varun */}
    <div className="min-w-[340px] overflow-hidden rounded-3xl border border-amber-300/20 bg-white/5 shadow-xl md:min-w-[420px]">
      <div className="relative h-80">
        <img
          src="/players/16.jpeg"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 20%" }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-amber-300 px-4 py-1 text-xs font-black text-black">
          PLAYER WATCH
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-3xl font-black text-amber-300">Varun – Rising Gem</h3>
        <p className="mt-3 leading-7 text-white/75">
          After joining last season, Varun quickly became a valuable all-round option.
        </p>
      </div>
    </div>

    {/* Saikiran */}
    <div className="min-w-[340px] overflow-hidden rounded-3xl border border-amber-300/20 bg-white/5 shadow-xl md:min-w-[420px]">
      <div className="relative h-80">
        <img
          src="/players/13.JPG"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 20%" }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-amber-300 px-4 py-1 text-xs font-black text-black">
          WATCH OUT
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-3xl font-black text-amber-300">Saikiran Loading</h3>
        <p className="mt-3 leading-7 text-white/75">
          Watch out for Saikiran who might be heading into his best season yet.
        </p>
      </div>
    </div>

    {/* Nipun */}
    <div className="min-w-[340px] overflow-hidden rounded-3xl border border-amber-300/20 bg-white/5 shadow-xl md:min-w-[420px]">
      <div className="relative h-80">
        <img
          src="/players/24.jpeg"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 20%" }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-amber-300 px-4 py-1 text-xs font-black text-black">
          RED HOT
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-3xl font-black text-amber-300">Nipun On Fire</h3>
        <p className="mt-3 leading-7 text-white/75">
          Nipun was breathing fire during practice sessions and looks match ready.
        </p>
      </div>
    </div>

  </div>
</div>
  {/* Modern News Flow */}
  <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-amber-300/15 to-white/5 p-8">
      <div className="mb-3 inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-black">
        Season Focus
      </div>
      <h3 className="text-4xl font-black text-amber-300">
        2026 Double League Challenge
      </h3>
      <p className="mt-4 max-w-3xl leading-8 text-white/75">
        Telugu Titans are competing in both BEDCL and MCPL this season. Squad
        rotation, availability, fitness, and consistency will be key to staying
        competitive across both leagues.
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
        Performer
      </div>
      <h3 className="text-3xl font-black text-amber-300">
        Best Performer: Charan
      </h3>
      <p className="mt-4 leading-7 text-white/75">
        Charan was the standout performer last season with consistent batting
        and leadership from the front.
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <h3 className="text-2xl font-bold text-amber-300">
        Bowling Unit Ready
      </h3>
      <p className="mt-4 leading-7 text-white/75">
        Titans have strong options across pace, spin, and middle overs with
        dependable wicket-taking depth.
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <h3 className="text-2xl font-bold text-amber-300">
        Match Alerts
      </h3>
      <p className="mt-4 leading-7 text-white/75">
        Upcoming match details update automatically on the Home page with
        opponent, date, time, and ground.
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <h3 className="text-2xl font-bold text-amber-300">
        Season Goal
      </h3>
      <p className="mt-4 leading-7 text-white/75">
        Strong performances, playoff qualification, and silverware are the main
        targets for the 2026 season.
      </p>
    </div>
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

<PageWrap
  id="seasons"
  title="Seasons"
  subtitle="Telugu Titans league journey across BEDCL, HDCL, and MCPL."
>
  <div className="grid gap-6 md:grid-cols-3">

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
      <PageWrap
  id="schedule2026"
  title="2026 Season Schedule"
  subtitle="Select BEDCL or MCPL schedule."
>
  <div className="mb-6 flex flex-wrap gap-3">
    <button
      onClick={() => setSelectedSchedule("BEDCL")}
      className={`btn ${selectedSchedule === "BEDCL" ? "btn-gold" : "btn-ghost"}`}
    >
      BEDCL Schedule
    </button>

    <button
      onClick={() => setSelectedSchedule("MCPL")}
      className={`btn ${selectedSchedule === "MCPL" ? "btn-gold" : "btn-ghost"}`}
    >
      MCPL Schedule
    </button>
  </div>

  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
    {schedule2026
      .filter((m) => m.league === selectedSchedule)
      .map((m, i) => (
        <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-black">
            {m.league}
          </div>

          <h3 className="text-2xl font-black text-amber-300">
            Telugu Titans vs {m.opponent}
          </h3>

          <div className="mt-4 space-y-2 text-white/75">
            <p><span className="text-amber-300">Date:</span> {m.day}, {m.date}</p>
            <p><span className="text-amber-300">Time:</span> {m.time}</p>
            <p><span className="text-amber-300">Home/Away:</span> {m.homeAway}</p>
            <p><span className="text-amber-300">Ground:</span> {m.ground}</p>
          </div>
        </div>
      ))}
  </div>
</PageWrap>
      <PageWrap
  id="players"
  title="Players"
  subtitle="Meet the Telugu Titans squad under TCCC banner."
>
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

    {[
      { name: "Bhanu Musunuru", role: "Captain", skill: "All-rounder", image: "/players/4.jpg" },
      { name: "Charan Teja", role: "Captain", skill: "All-rounder", image: "/players/5.jpeg" },
      { name: "Aadil Khan", role: "Vice Captain", skill: "All-rounder", image: "/players/21.jpeg" },
      { name: "Dheeraj", skill: "All-rounder", image: "/players/25.jpg" },
      { name: "Srikanth", skill: "All-rounder", image: "/players/26.jpeg" },
      { name: "Arun", skill: "Bowler", image: "/players/3.jpg" },
      { name: "Amit Koul", skill: "All-rounder", image: "/players/1.jpeg" },
      { name: "Anand Chaitanya", skill: "Batter", image: "/players/2.jpeg" },
      { name: "Kiran",  skill: "All-rounder", image: "/players/7.jpg" },
      { name: "Manish Raj", skill: "Spin Bowling All-rounder", image: "/players/8.png" },
      { name: "Martin Thandhara", skill: "Bowler", image: "/players/9.jpg" },
      { name: "Nagesh Kowligi", skill: "Bowler", image: "/players/10.jpg" },
      { name: "Naveen Gajula", skill: "All-rounder", image: "/players/11.jpeg" },
      { name: "Nipun", skill: "Destructive Batter", image: "/players/24.jpeg" },
      { name: "Nikhil Holagunda", skill: "Spin BowlingAll-rounder", image: "/players/12.jpeg" },
      { name: "Prashanth", skill: "Spin Bowling All-rounder", image: "/players/20.jpg" },
      { name: "Chari", skill: "All-rounder", image: "/players/6.jpeg" },
      { name: "Sai", skill: "Impact Bowler", image: "/players/13.JPG" },
      { name: "Shanthan Akkiraju", skill: "Bowler", image: "/players/14.jpeg" },
      { name: "Varun Rambha", skill: "Batter", image: "/players/16.jpeg" },
      { name: "Vikas Tiwari", skill: "Bowler", image: "/players/17.jpeg" },
      { name: "Vikranth Nyalakonda", skill: "Wicket Keeper / Batter", image: "/players/18.jpeg" },
      { name: "Dheeraj", skill: "Bowler", image: "/players/23.jpeg" },
      { name: "Inderjeet", skill: "Bowler", image: "/players/22.jpeg" }
    ].map((p) => (
      <div
        key={p.name}
        className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
      >
        <img
          src={p.image}
          alt={p.name}
          className="h-72 w-full object-cover"
          style={{ objectPosition: "50% 25%" }} 
          />

        <div className="p-4">
          <h3 className="text-xl font-bold text-amber-300">{p.name}</h3>

          {p.role && (
            <p className="text-sm font-semibold text-yellow-300">
              {p.role}
            </p>
          )}

          <p className="mt-1 text-white/70">{p.skill}</p>
        </div>
      </div>
    ))}

  </div>
</PageWrap>
<PageWrap id="about" title="About TCCC" subtitle="A cricket club built for community, competition, and growth."><div className="grid gap-6 md:grid-cols-2"><InfoCard title="Our Story" text="The club’s roots go back to Andhra Tycoons in 2008, later reformed as Telugu Cricket Club Canada in 2022." /><InfoCard title="Our Vision" text="Batting for a stronger South Asian community through cricket, while developing younger players and creating opportunities." /><InfoCard title="Competitive + Recreational" text="TCCC supports both serious competition and recreational cricket." /><InfoCard title="Future Roadmap" text="Multiple teams, international exposure, cricket leagues, and community-driven development." /></div></PageWrap>

      {/* <PageWrap id="contact" title="Contact / Join TCCC" subtitle="For players, supporters, sponsors, and community members."><div className="card p-6"><h3 className="text-2xl font-bold text-amber-300">Coming Next</h3><p className="mt-4 leading-7 text-white/75">This section can include Instagram, YouTube, WhatsApp contact, sponsor inquiry, and player registration workflow.</p></div></PageWrap> */}
      <footer className="border-t border-white/10 bg-black/40 px-4 py-8 text-center text-sm text-white/60">© 2026 Telugu Cricket Club Canada. Built for TCCC and Telugu Titans.</footer>
    </main>
  );
}

function Standing({ title, rows }) {
  return <StatTable title={title} headers={['Conference','Team','GP','W','L','NR','Pts']} rows={rows} />;
}

const schedule2026 = [
  // BEDCL
  { league: "BEDCL", opponent: "Brampton Strikers", date: "2026-05-03", day: "Sunday", time: "11:35 AM", ground: "Dixie-407 - C (North-West)", homeAway: "Home" },
  { league: "BEDCL", opponent: "CricKnights", date: "2026-05-17", day: "Sunday", time: "3:40 PM", ground: "Dixie-407 - A (North-East)", homeAway: "Home" },
  { league: "BEDCL", opponent: "GTA Sultans", date: "2026-05-24", day: "Sunday", time: "7:30 AM", ground: "Keele West", homeAway: "Away" },
  { league: "BEDCL", opponent: "Jaguar B", date: "2026-05-31", day: "Sunday", time: "7:30 AM", ground: "Dixie-407 - C (North-West)", homeAway: "Away" },
  { league: "BEDCL", opponent: "GTA Sultans", date: "2026-06-14", day: "Sunday", time: "7:30 AM", ground: "Creditview - C", homeAway: "Home" },
  { league: "BEDCL", opponent: "CricKnights", date: "2026-06-20", day: "Saturday", time: "7:30 AM", ground: "Humber College Ground", homeAway: "Away" },
  { league: "BEDCL", opponent: "Brampton Browns", date: "2026-06-27", day: "Saturday", time: "11:35 AM", ground: "Torbram Ground", homeAway: "Home" },
  { league: "BEDCL", opponent: "Meadowvale Mustangs", date: "2026-07-04", day: "Saturday", time: "7:30 AM", ground: "BSP - Artificial", homeAway: "Away" },
  { league: "BEDCL", opponent: "Avengers B", date: "2026-07-11", day: "Saturday", time: "7:30 AM", ground: "Creditview - A", homeAway: "Away" },
  { league: "BEDCL", opponent: "Northern Warriors", date: "2026-07-19", day: "Sunday", time: "7:30 AM", ground: "Keele West", homeAway: "Home" },
  { league: "BEDCL", opponent: "6ixers", date: "2026-08-02", day: "Sunday", time: "7:30 AM", ground: "Creditview - A", homeAway: "Home" },
  { league: "BEDCL", opponent: "Meadowvale Mustangs", date: "2026-08-09", day: "Sunday", time: "3:40 PM", ground: "Humber College Ground", homeAway: "Home" },
  { league: "BEDCL", opponent: "Avengers B", date: "2026-08-22", day: "Saturday", time: "7:30 AM", ground: "Humber College Ground", homeAway: "Home" },
  { league: "BEDCL", opponent: "Brampton Browns", date: "2026-08-30", day: "Sunday", time: "7:30 AM", ground: "BSP - Artificial", homeAway: "Away" },
  { league: "BEDCL", opponent: "Golden United", date: "2026-09-06", day: "Sunday", time: "7:30 AM", ground: "Dixie-407 - C (North-West)", homeAway: "Away" },
  { league: "BEDCL", opponent: "Kanada Sports Team", date: "2026-09-19", day: "Saturday", time: "11:35 AM", ground: "BSP - Artificial", homeAway: "Away" },

  // MCPL
  { league: "MCPL", opponent: "AKAAL XI", date: "2026-05-17", day: "Sunday", time: "3:45 PM", ground: "Mavis", homeAway: "Away" },
  { league: "MCPL", opponent: "SuperNovas CC", date: "2026-05-23", day: "Saturday", time: "9:00 AM", ground: "Danville", homeAway: "Home" },
  { league: "MCPL", opponent: "Toronto Lightning XI", date: "2026-05-31", day: "Sunday", time: "TBD", ground: "Aquinas", homeAway: "Away" },
  { league: "MCPL", opponent: "Northern Lightning CC", date: "2026-06-07", day: "Sunday", time: "8:00 AM", ground: "Aquinas", homeAway: "Home" },
  { league: "MCPL", opponent: "AKAAL XI", date: "2026-06-24", day: "Wednesday", time: "5:30 PM", ground: "Danville", homeAway: "Away" },
  { league: "MCPL", opponent: "Predators CC B", date: "2026-06-28", day: "Sunday", time: "8:45 AM", ground: "Mavis", homeAway: "Home" },
  { league: "MCPL", opponent: "Toronto Pacers", date: "2026-07-01", day: "Wednesday", time: "8:45 AM", ground: "Mavis", homeAway: "Home" },
];
function getNextMatch() {
  const today = new Date();
  today.setHours(0,0,0,0);

  return schedule2026
    .map((m) => ({ ...m, matchDate: new Date(`${m.date}T00:00:00`) }))
    .filter((m) => m.matchDate >= today)
    .sort((a,b) => a.matchDate - b.matchDate)[0];
}
function NextMatchCard() {
  const nextMatch = getNextMatch();

  if (!nextMatch) return null;

  const today = new Date();
  const matchDate = new Date(`${nextMatch.date}T00:00:00`);
  const diffDays = Math.ceil((matchDate - today) / (1000 * 60 * 60 * 24));

  let reminderText = "Upcoming Match";
  if (diffDays === 1) reminderText = "Reminder: Match Tomorrow";
  if (diffDays === 0) reminderText = "Match Day";

  return (
    <div className="mt-6 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5">
      <div className="text-sm font-bold uppercase tracking-widest text-amber-300">
        {reminderText}
      </div>

      <h3 className="mt-2 text-2xl font-black text-white">
        Telugu Titans vs {nextMatch.opponent}
      </h3>

      <div className="mt-3 grid gap-2 text-white/75 sm:grid-cols-2">
        <p><span className="text-amber-300">League:</span> {nextMatch.league}</p>
        <p><span className="text-amber-300">Date:</span> {nextMatch.day}, {nextMatch.date}</p>
        <p><span className="text-amber-300">Time:</span> {nextMatch.time}</p>
        <p><span className="text-amber-300">Ground:</span> {nextMatch.ground}</p>
      </div>
    </div>
  );
}