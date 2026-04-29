'use client';

import Image from "next/image";
import { useState } from "react";

export function FUCCHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
const [activeMobileMenu, setActiveMobileMenu] = useState("Home");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b10]/95 backdrop-blur">
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
              <div className="text-lg font-black text-amber-300">
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

<div className="group relative">
  <a className="fucc-btn" href="#seasons">Seasons</a>

  <div className="absolute left-0 top-full z-50 hidden pt-2 group-hover:block">
    <div className="min-w-[250px] rounded-2xl border border-white/10 bg-[#15171d] p-3 shadow-2xl">
      <a
        href="#seasons"
        className="block rounded-xl px-4 py-3 font-bold text-white/80 hover:bg-amber-300 hover:text-black"
      >
        Seasons Overview
      </a>

      <a
        href="#schedule"
        className="block rounded-xl px-4 py-3 font-bold text-white/80 hover:bg-amber-300 hover:text-black"
      >
        2026 Season Schedule
      </a>
    </div>
  </div>
</div>


          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 md:hidden"
          >
            <span className="h-0.5 w-6 rounded-full bg-amber-300" />
            <span className="h-0.5 w-6 rounded-full bg-amber-300" />
            <span className="h-0.5 w-6 rounded-full bg-amber-300" />
          </button>
        </div>
      </header>

      {/* Mobile Full Screen Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#090b10] px-5 py-6 md:hidden">
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
  {[
    { name: "Home", href: "/fucc" },
    { name: "News", href: "#news" },
    { name: "Players", href: "#players" },
    { name: "Stats", href: "#stats" },
    { name: "Seasons", href: "#seasons" },
    { name: "Schedule", href: "#schedule" },
  ].map((item) => (
    <a
      key={item.name}
      href={item.href}
      onClick={() => {
        setActiveMobileMenu(item.name);
        setMenuOpen(false);
      }}
      className={`rounded-2xl px-5 py-4 text-xl font-black transition ${
        activeMobileMenu === item.name
          ? "bg-amber-300 text-black"
          : "border border-white/10 bg-white/[0.06] text-white hover:bg-amber-300 hover:text-black"
      }`}
    >
      {item.name}
    </a>
  ))}
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
        <h2 className="text-4xl font-black text-yellow-400 md:text-5xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-white/70">{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

export function FUCCCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
      <h3 className="text-2xl font-black text-amber-300">{title}</h3>
      <p className="mt-4 leading-7 text-white/70">{text}</p>
    </div>
  );
}