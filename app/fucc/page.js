import Image from "next/image";
import { FUCCHeader, FUCCPageWrap, FUCCCard } from "./FUCC_UI";
import { fuccPlayers, fuccNews, fuccSchedule } from "./FUCC_data";

export default function FUCCPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900">
      <FUCCHeader />

      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-emerald-700/20 bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">
              Friends United Cricket Club
            </div>

            <h1 className="text-5xl font-black leading-tight text-slate-950 md:text-7xl">
              United by Cricket,{" "}
              <span className="text-emerald-700">Driven by Friendship.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
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
            <div className="rounded-[2rem] border border-emerald-900/10 bg-white p-8 shadow-2xl">
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
              className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-lg"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-800">
                {p.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <h3 className="text-2xl font-black text-emerald-800">
                {p.name}
              </h3>
              <p className="mt-1 text-slate-500">{p.role}</p>
              <p className="mt-4 text-slate-600">{p.skill}</p>
            </div>
          ))}
        </div>
      </FUCCPageWrap>

      <FUCCPageWrap
        id="stats"
        title="FUCC Stats"
        subtitle="Batting and bowling stats will be added soon."
      >
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-lg">
          <h3 className="text-3xl font-black text-emerald-800">
            Stats Coming Soon
          </h3>
          <p className="mt-4 text-slate-600">
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
              className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                {m.league}
              </div>

              <h3 className="text-2xl font-black text-emerald-800">
                FUCC vs {m.opponent}
              </h3>

              <div className="mt-4 space-y-2 text-slate-600">
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