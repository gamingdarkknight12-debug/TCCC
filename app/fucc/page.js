import Image from "next/image";
import { FUCCHeader, FUCCPageWrap, FUCCCard } from "./FUCC_UI";
import { fuccPlayers, fuccNews, fuccSchedule } from "./FUCC_data";
import { SponsorBanner } from "../components/UI";


export default function FUCCPage() {
  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <FUCCHeader />
<SponsorBanner />
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        {/* Team Switcher */}
<div className="relative z-30 mx-auto mb-8 flex max-w-7xl justify-center px-4 md:absolute md:right-8 md:top-8 md:mx-0 md:mb-0 md:block md:px-0">
  <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-[#06111f]/80 p-1 backdrop-blur-xl shadow-xl">

    <a
      href="/"
      className="rounded-full px-5 py-2 text-sm font-black text-white transition hover:bg-white/10"
    >
      TT
    </a>

    <span className="rounded-full bg-amber-300 px-5 py-2 text-sm font-black text-black">
      FUCC
    </span>

  </div>
</div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 py-100 px-4 py-2 text-sm font-bold text-amber-300">
              Friends United Cricket Club
            </div>

            <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">
              United by Cricket,{" "}
              <span className="text-amber-300">Driven by Friendship.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
              FUCC is part of the Telugu Cricket Club Canada umbrella, built on
              teamwork, friendship, competition, and community.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
  <a href="#stats" className="fucc-btn">
    View Player Stats
  </a>

  <a href="#players" className="fucc-btn">
    Meet Players
  </a>

  <a href="#schedule" className="fucc-btn">
    Upcoming Match Analysis
  </a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl">
              <Image
                src="/tccc-logo.png"
                alt="TCCC Logo"
                width={420}
                height={420}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <FUCCPageWrap
        id="news"
        title="FUCC News"
        subtitle="Latest Friends United Cricket Club updates."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {fuccNews.map((n) => (
            <FUCCCard key={n.title} title={n.title} text={n.text} />
          ))}
        </div>
      </FUCCPageWrap>

      <FUCCPageWrap
        id="players"
        title="FUCC Players"
        subtitle="Friends United Cricket Club squad details."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {fuccPlayers.map((p) => (
            <div
              key={p.name}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-300/10 text-2xl font-black text-amber-300">
                {p.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <h3 className="text-2xl font-black text-amber-300">
                {p.name}
              </h3>
              <p className="mt-1 text-white/60">{p.role}</p>
              <p className="mt-4 text-white/70">{p.skill}</p>
            </div>
          ))}
        </div>
      </FUCCPageWrap>

      <FUCCPageWrap
        id="stats"
        title="FUCC Stats"
        subtitle="Batting and bowling stats will be added soon."
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <h3 className="text-3xl font-black text-amber-300">
            Stats Coming Soon
          </h3>
          <p className="mt-4 text-white/70">
            Once FUCC scorecards are available, player stats will appear here.
          </p>
        </div>
      </FUCCPageWrap>

      <FUCCPageWrap
        id="schedule"
        title="FUCC Schedule"
        subtitle="Upcoming FUCC matches."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {fuccSchedule.map((m, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-full bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-300">
                {m.league}
              </div>

              <h3 className="text-2xl font-black text-amber-300">
                FUCC vs {m.opponent}
              </h3>

              <div className="mt-4 space-y-2 text-white/70">
                <p>Date: {m.date}</p>
                <p>Time: {m.time}</p>
                <p>Ground: {m.ground}</p>
              </div>
            </div>
          ))}
        </div>
      </FUCCPageWrap>
    </main>
  );
}