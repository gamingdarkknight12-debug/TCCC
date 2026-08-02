'use client';

import { useEffect, useState } from 'react';
import { Header, SponsorBanner } from './components/UI';
import { Hero } from './components/sections/Hero';
import { News } from './components/sections/News';
import { TeamHub } from './components/sections/TeamHub';
import { Seasons } from './components/sections/Seasons';
import { Schedule } from './components/sections/Schedule';
import { Stats } from './components/sections/Stats';
import { Players } from './components/sections/Players';
import { Gallery } from './components/sections/Gallery';
import { About } from './components/sections/About';

export default function Home() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const updateSection = () => {
      // Gallery uses a compound hash ("gallery/2026/blood-donation") to
      // deep-link a specific year/sub-tab — only the first segment routes
      // which section renders; Gallery itself re-reads the full hash.
      const hash = window.location.hash.replace("#", "").split("/")[0];
      setActiveSection(hash || "home");
    };

    updateSection();
    window.addEventListener("hashchange", updateSection);

    return () => window.removeEventListener("hashchange", updateSection);
  }, []);

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />

      {activeSection === "home" && (
        <div className="sponsor-banner">
          <SponsorBanner />
        </div>
      )}

      {activeSection === "home" && <Hero />}
      {activeSection === "news" && <News />}
      {activeSection === "teamhub" && <TeamHub />}
      {activeSection === "seasons" && <Seasons />}
      {(activeSection === "schedule2026" || activeSection === "standings") && <Schedule />}
      {activeSection === "stats" && <Stats />}
      {activeSection === "players" && <Players />}
      {activeSection === "gallery" && <Gallery />}
      {activeSection === "about" && <About />}

      <footer className="border-t border-white/10 bg-black/40 px-4 py-8 text-center text-sm text-white/60">
        © 2026 Telugu Cricket Club Canada. Built for TCCC.
      </footer>
    </main>
  );
}
