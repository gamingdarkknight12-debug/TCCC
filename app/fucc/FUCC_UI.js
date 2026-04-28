'use client';

import Image from "next/image";
import { useState } from "react";

export function FUCCHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sky-400/10 bg-[#06111f]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
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
              Friends United CC
            </div>
            <div className="text-xs text-white/60">
              Under TCCC Umbrella
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

          {/* Switcher */}
          <div className="ml-2 flex items-center gap-1 rounded-full border border-sky-400/20 bg-white/5 p-1">
            <a
              href="/"
              className="rounded-full px-4 py-2 text-sm font-black text-white hover:bg-white/10"
            >
              TT
            </a>

            <span className="rounded-full bg-sky-400 px-4 py-2 text-sm font-black text-black">
              FUCC
            </span>
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-2xl border border-sky-400/20 bg-white/5 md:hidden"
        >
          <span className="h-0.5 w-6 rounded-full bg-sky-300"></span>
          <span className="h-0.5 w-6 rounded-full bg-sky-300"></span>
          <span className="h-0.5 w-6 rounded-full bg-sky-300"></span>
        </button>
      </div>

      {/* Mobile Sidebar */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999] md:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMenuOpen(false)}
          ></div>

          <div className="absolute right-0 top-0 h-full w-[82%] max-w-sm border-l border-sky-400/10 bg-[#06111f] p-6 shadow-2xl">
            {/* Top */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="text-xl font-black text-sky-300">
                  Friends United CC
                </div>
                <div className="text-sm text-white/50">Main Menu</div>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xl text-white"
              >
                ✕
              </button>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <a href="/fucc" onClick={() => setMenuOpen(false)} className="block rounded-2xl bg-sky-400 px-5 py-4 text-lg font-black text-black">
                Home
              </a>

              <a href="#news" onClick={() => setMenuOpen(false)} className="block rounded-2xl bg-white/10 px-5 py-4 text-lg font-bold text-white">
                News
              </a>

              <a href="#players" onClick={() => setMenuOpen(false)} className="block rounded-2xl bg-white/10 px-5 py-4 text-lg font-bold text-white">
                Players
              </a>

              <a href="#stats" onClick={() => setMenuOpen(false)} className="block rounded-2xl bg-white/10 px-5 py-4 text-lg font-bold text-white">
                Stats
              </a>

              <a href="#schedule" onClick={() => setMenuOpen(false)} className="block rounded-2xl bg-white/10 px-5 py-4 text-lg font-bold text-white">
                Schedule
              </a>
            </div>

            {/* Switcher */}
            <div className="mt-8 flex items-center gap-1 rounded-full border border-sky-400/20 bg-white/5 p-1">
              <a
                href="/"
                className="flex-1 rounded-full px-4 py-3 text-center text-sm font-black text-white hover:bg-white/10"
              >
                TT
              </a>

              <span className="flex-1 rounded-full bg-sky-400 px-4 py-3 text-center text-sm font-black text-black">
                FUCC
              </span>
            </div>
          </div>
        </div>
      )}
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