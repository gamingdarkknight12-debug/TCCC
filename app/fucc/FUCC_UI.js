import Image from "next/image";

export function FUCCHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="/fucc" className="flex items-center gap-3">
          <Image
            src="/tccc-logo.png"
            alt="TCCC Logo"
            width={52}
            height={52}
            className="rounded-full object-contain"
            priority
          />

          <div>
            <div className="text-lg font-black text-emerald-800">
              Friends United CC
            </div>
            <div className="text-xs text-slate-600">
              Under TCCC Umbrella
            </div>
          </div>
        </a>

        <nav className="hidden gap-2 md:flex">
<a className="fucc-btn" href="/fucc">Home</a>
<a className="fucc-btn" href="#news">News</a>
<a className="fucc-btn" href="#players">Players</a>
<a className="fucc-btn" href="#stats">Stats</a>
<a className="fucc-btn" href="#schedule">Schedule</a>
        </nav>
      </div>
    </header>
  );
}

export function FUCCPageWrap({ id, title, subtitle, children }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="mb-8">
        <h2 className="text-4xl font-black text-emerald-800 md:text-5xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export function FUCCCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-lg">
      <h3 className="text-2xl font-black text-emerald-800">{title}</h3>
      <p className="mt-4 leading-7 text-slate-600">{text}</p>
    </div>
  );
}