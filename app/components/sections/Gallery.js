'use client';

import { useEffect, useState } from 'react';
import { PageWrap, TabStrip } from '../UI';

// Photos get added here as they come in — each entry is just the file path
// under /public plus an optional caption. No admin upload flow exists yet;
// new photos are dropped into /public/gallery/<year>/ and listed here.
// Keep uploaded files reasonably compressed (resized to ~1600px max
// dimension, saved as .jpg) before adding — this page has no server-side
// resizing, so a folder of unoptimized phone photos would load slowly.
const YEARS = ['2026', '2025', '2024', '2023', '2022'];

const GALLERY = {
  2026: { subTabs: ['Blood Donation Drive', 'Game Pictures'] },
  2025: { subTabs: null },
  2024: { subTabs: ['Ireland Tour', 'Game Pictures'] },
  2023: { subTabs: null },
  2022: { subTabs: null },
};

const PHOTOS = {}; // e.g. { '2026:Blood Donation Drive': [{ src: '/gallery/2026/bd-1.jpg', caption: '...' }] }

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Deep-links from elsewhere on the site (e.g. the News page's Blood
// Donation card) land here via a compound hash like
// "gallery/2026/blood-donation" — parsed once on mount to preselect the
// right year and sub-tab instead of always opening on the default.
function parseHash() {
  const parts = window.location.hash.replace('#', '').split('/');
  const [, yearPart, subPart] = parts;
  if (!yearPart || !GALLERY[yearPart]) return null;

  const subTabs = GALLERY[yearPart].subTabs;
  const subTab = subPart && subTabs ? subTabs.find((t) => slugify(t) === subPart) : null;
  return { year: yearPart, subTab: subTab || subTabs?.[0] || null };
}

export function Gallery() {
  const [year, setYear] = useState('2026');
  const [subTab, setSubTab] = useState(GALLERY['2026'].subTabs[0]);

  useEffect(() => {
    const deepLink = parseHash();
    if (deepLink) {
      setYear(deepLink.year);
      setSubTab(deepLink.subTab);
    }
  }, []);

  const yearConfig = GALLERY[year];
  const photoKey = yearConfig.subTabs ? `${year}:${subTab}` : year;
  const photos = PHOTOS[photoKey] || [];

  return (
    <PageWrap
      id="gallery"
      title="Gallery"
      subtitle="Match days, tours, and community events — season by season."
    >
      <TabStrip
        tabs={YEARS}
        active={year}
        onChange={(y) => {
          setYear(y);
          setSubTab(GALLERY[y].subTabs?.[0] || null);
        }}
      />

      {yearConfig.subTabs && (
        <TabStrip tabs={yearConfig.subTabs} active={subTab} onChange={setSubTab} />
      )}

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          Photos coming soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {photos.map((photo, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <img src={photo.src} alt={photo.caption || `${year} gallery`} className="h-full w-full object-cover" />
              {photo.caption && <p className="p-2 text-xs text-white/60">{photo.caption}</p>}
            </div>
          ))}
        </div>
      )}
    </PageWrap>
  );
}
