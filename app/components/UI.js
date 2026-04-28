'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export function Header() {
  const [active, setActive] = useState('Home');
  const [menuOpen, setMenuOpen] = useState(false);

  const pages = ['Home', 'News', 'Match Analysis', 'Player Stats', 'Seasons', 'Players', 'About'];

  const hrefs = {
    Home: '/',
    News: '#news',
    'Match Analysis': '#analysis',
    'Player Stats': '#stats',
    Seasons: '#seasons',
    Players: '#players',
    About: '#about',
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const sections = [
      { id: 'news', name: 'News' },
      { id: 'analysis', name: 'Match Analysis' },
      { id: 'stats', name: 'Player Stats' },
      { id: 'seasons', name: 'Seasons' },
      { id: 'schedule2026', name: 'Seasons' },
      { id: 'players', name: 'Players' },
      { id: 'about', name: 'About' },
    ];

    const updateActive = () => {
      let current = 'Home';

      sections.forEach((section) => {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) current = section.name;
        }
      });

      setActive(current);
    };

    updateActive();
    window.addEventListener('scroll', updateActive);
    window.addEventListener('hashchange', updateActive);

    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('hashchange', updateActive);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b10]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/tccc-logo.png"
              alt="TCCC Logo"
              width={52}
              height={52}
              className="rounded-full object-contain"
              priority
            />

            <div>
              <div className="text-lg font-bold tracking-wide text-amber-300">
                Telugu Titans
              </div>
              <div className="text-xs text-white/70">
                Beyond the Pitch, We Unite
              </div>
            </div>
          </a>

          {/* Desktop Menu */}
          <nav className="hidden gap-2 md:flex">
            {pages.map((p) => (
              <a
                key={p}
                href={hrefs[p]}
                className={`btn ${active === p ? 'btn-gold' : 'btn-ghost'}`}
              >
                {p}
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 md:hidden"
            aria-label="Open menu"
          >
            <span className="h-0.5 w-6 rounded-full bg-amber-300" />
            <span className="h-0.5 w-6 rounded-full bg-amber-300" />
            <span className="h-0.5 w-6 rounded-full bg-amber-300" />
          </button>
        </div>
      </header>

      {/* Mobile Full Screen Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] h-[100dvh] overflow-y-auto bg-[#090b10] px-5 py-6 md:hidden">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/tccc-logo.png"
                alt="TCCC Logo"
                width={54}
                height={54}
                className="rounded-full object-contain"
              />

              <div>
                <div className="text-2xl font-black text-amber-300">
                  Telugu Titans
                </div>
                <div className="text-sm text-white/60">
                  Main Menu
                </div>
              </div>
            </div>

            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl text-white"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <div className="grid gap-3">
            {pages.map((p) => (
              <a
                key={p}
                href={hrefs[p]}
                onClick={() => setMenuOpen(false)}
                className={`rounded-2xl px-5 py-4 text-xl font-black transition ${
                  active === p
                    ? 'bg-amber-300 text-black'
                    : 'border border-white/10 bg-white/[0.06] text-white'
                }`}
              >
                {p}
              </a>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5">
            <div className="text-sm font-bold uppercase tracking-widest text-amber-300">
              Telugu Titans
            </div>
            <p className="mt-2 text-white/70">
              Beyond the Pitch, We Unite.
            </p>
          </div>
        </div>
      )}
    </>
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
