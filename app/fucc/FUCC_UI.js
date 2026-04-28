'use client';

import Image from "next/image";
import { useState } from "react";

export function FUCCHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-sky-400/10 bg-[#06111f]/95 backdrop-blur">
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
              <div className="text-lg font-black text-sky-300">
                TCCC
              </div>
              <div className="text-xs text-white/60">
                Beyond the Pitch, We Unite
              </div>
            </div>
          </a>

          {/* Desktop Menu */}
          <nav className="hidden items-center gap-2 md:flex">
            <a className="fucc-btn" href="/fucc">Home</a>
            <a className="fucc-btn" href="#news">News</a>
            <a className="fucc-btn" href="#players">Players</a>
            <a className="fucc-btn" href="#stats">Stats</a>
            <a className="fucc-btn" href="#schedule">Schedule</a>


          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-2xl border border-sky-400/20 bg-white/5 md:hidden"
          >
            <span className="h-0.5 w-6 rounded-full bg-sky-300" />
            <span className="h-0.5 w-6 rounded-full bg-sky-300" />
            <span className="h-0.5 w-6 rounded-full bg-sky-300" />
          </button>
        </div>
      </header>

      {/* Mobile Full Screen Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#06111f] px-5 py-6 md:hidden">
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
                <div className="text-2xl font-black text-sky-300">
                  Friends United CC
                </div>
                <div className="text-sm text-white/60">Main Menu</div>
              </div>
            </div>

            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl text-white"
            >
              ×
            </button>
          </div>

          <div className="grid gap-3">
            <a onClick={() => setMenuOpen(false)} href="/fucc" className="rounded-2xl bg-sky-400 px-5 py-4 text-xl font-black text-black">
              Home
            </a>
            <a onClick={() => setMenuOpen(false)} href="#news" className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-xl font-black text-white">
              News
            </a>
            <a onClick={() => setMenuOpen(false)} href="#players" className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-xl font-black text-white">
              Players
            </a>
            <a onClick={() => setMenuOpen(false)} href="#stats" className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-xl font-black text-white">
              Stats
            </a>
            <a onClick={() => setMenuOpen(false)} href="#schedule" className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-xl font-black text-white">
              Schedule
            </a>
          </div>

        </div>
      )}
    </>
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