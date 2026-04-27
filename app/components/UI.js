import Image from 'next/image';

export function Header({ active = 'Home' }) {
  const pages = ['Home', 'About', 'Leadership', 'Player Stats', 'Seasons', 'Contact'];
  const hrefs = { Home: '/', About: '/#about', Leadership: '/#leadership', 'Player Stats': '/#stats', Seasons: '/#seasons', Contact: '/#contact' };
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b10]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-3">
          <Image src="/tccc-logo.png" alt="TCCC Logo" width={52} height={52} className="rounded-full object-contain" priority />
          <div>
            <div className="text-lg font-bold tracking-wide text-amber-300">TCCC</div>
            <div className="text-xs text-white/70">Beyond the Pitch, We Unite</div>
          </div>
        </a>
        <nav className="hidden gap-2 md:flex">
          {pages.map((p) => <a key={p} href={hrefs[p]} className={`btn ${active === p ? 'btn-gold' : 'btn-ghost'}`}>{p}</a>)}
        </nav>
      </div>
    </header>
  );
}

export function PageWrap({ id, title, subtitle, children }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="mb-8">
        <h2 className="text-4xl font-black text-amber-300 md:text-5xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-white/70">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export function InfoCard({ title, text }) {
  return <div className="card p-6"><h3 className="text-2xl font-bold text-amber-300">{title}</h3><p className="mt-4 leading-7 text-white/75">{text}</p></div>;
}

export function HighlightCard({ title, name, stat, note }) {
  return <div className="gold-card p-5"><div className="text-sm uppercase tracking-widest text-amber-300">{title}</div><h3 className="mt-3 text-2xl font-bold">{name}</h3><div className="mt-2 text-lg font-semibold text-white/90">{stat}</div><p className="mt-3 text-sm leading-6 text-white/60">{note}</p></div>;
}

export function StatTable({ title, headers, rows }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-2xl font-bold text-amber-300">{title}</h3>
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={headers.length} className="text-white/50">No data yet.</td></tr> : rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
