'use client';

import { useEffect, useState } from 'react';
import { PageWrap, TabStrip } from '../UI';

// Media gets added here as it comes in — each entry is just the file path
// under /public, a type ('image' | 'video'), and an optional caption. No
// admin upload flow exists yet; new files are dropped into
// /public/gallery/<year>/ and listed here. Keep photos reasonably
// compressed (resized to ~1280px max dimension) before adding — this page
// does no server-side resizing, so a folder of unoptimized phone photos
// would load slowly. Videos are added as-is (no compression tool available
// here) — keep an eye on file size if a clip runs long.
const YEARS = ['2026', '2025', '2024', '2023', '2022'];

const GALLERY = {
  2026: { subTabs: ['Blood Donation Drive', 'Game Pictures'] },
  2025: { subTabs: null },
  2024: { subTabs: ['Ireland Tour', 'Game Pictures'] },
  2023: { subTabs: ['Blood Donation Drive', 'Game Pictures'] },
  2022: { subTabs: null },
};

const MEDIA = {
  '2026:Blood Donation Drive': Array.from({ length: 25 }, (_, i) => ({
    type: 'image',
    src: `/gallery/2026/blood-donation/${i + 1}.jpg`,
  })),
  '2026:Game Pictures': [
    { type: 'image', src: '/gallery/2026/game-pictures/1.jpg' },
    { type: 'video', src: '/gallery/2026/game-pictures/1.mp4' },
    { type: 'video', src: '/gallery/2026/game-pictures/2.mp4' },
  ],
  2025: [
    { type: 'image', src: '/gallery/2025/1.jpg' },
    { type: 'image', src: '/gallery/2025/2.jpg' },
    { type: 'image', src: '/gallery/2025/3.jpg' },
    { type: 'image', src: '/gallery/2025/4.jpg' },
    { type: 'image', src: '/gallery/2025/5.jpg' },
    { type: 'video', src: '/gallery/2025/1.mp4' },
    { type: 'video', src: '/gallery/2025/2.mp4' },
    { type: 'video', src: '/gallery/2025/3.mp4' },
  ],
  '2024:Ireland Tour': [
    ...Array.from({ length: 27 }, (_, i) => ({
      type: 'image',
      src: `/gallery/2024/ireland-tour/${i + 1}.jpg`,
    })),
    { type: 'video', src: '/gallery/2024/ireland-tour/1.mp4' },
    { type: 'video', src: '/gallery/2024/ireland-tour/2.mp4' },
    { type: 'video', src: '/gallery/2024/ireland-tour/3.mp4' },
  ],
  '2024:Game Pictures': [
    ...Array.from({ length: 6 }, (_, i) => ({
      type: 'image',
      src: `/gallery/2024/game-pictures/${i + 1}.jpg`,
    })),
    { type: 'video', src: '/gallery/2024/game-pictures/1.mp4' },
    { type: 'video', src: '/gallery/2024/game-pictures/2.mp4' },
    { type: 'video', src: '/gallery/2024/game-pictures/3.mp4' },
  ],
  '2023:Blood Donation Drive': Array.from({ length: 18 }, (_, i) => ({
    type: 'image',
    src: `/gallery/2023/blood-donation/${i + 1}.jpg`,
  })),
  '2023:Game Pictures': [
    ...Array.from({ length: 7 }, (_, i) => ({
      type: 'image',
      src: `/gallery/2023/game-pictures/${i + 1}.jpg`,
    })),
    ...Array.from({ length: 19 }, (_, i) => ({
      type: 'video',
      src: `/gallery/2023/game-pictures/${i + 1}.mp4`,
    })),
  ],
  2022: [
    { type: 'image', src: '/gallery/2022/1.jpg' },
    { type: 'image', src: '/gallery/2022/2.jpg' },
  ],
};

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

// Full-size viewer for a photo, with left/right buttons (and arrow keys) to
// step through the rest of the current tab's media without closing back out
// to the grid every time.
function Lightbox({ media, index, onClose, onStep }) {
  const item = media[index];

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onStep(-1);
      if (e.key === 'ArrowRight') onStep(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, onStep]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        aria-label="Close"
      >
        &times;
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onStep(-1);
        }}
        className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:left-6"
        aria-label="Previous"
      >
        &#8249;
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onStep(1);
        }}
        className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:right-6"
        aria-label="Next"
      >
        &#8250;
      </button>

      <div className="max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {item.type === 'video' ? (
          <video src={item.src} controls autoPlay className="max-h-[85vh] max-w-[90vw] rounded-xl" />
        ) : (
          <img src={item.src} alt={item.caption || 'Gallery photo'} className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" />
        )}
        {item.caption && <p className="mt-3 text-center text-sm text-white/70">{item.caption}</p>}
      </div>
    </div>
  );
}

export function Gallery() {
  const [year, setYear] = useState('2026');
  const [subTab, setSubTab] = useState(GALLERY['2026'].subTabs[0]);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const deepLink = parseHash();
    if (deepLink) {
      setYear(deepLink.year);
      setSubTab(deepLink.subTab);
    }
  }, []);

  const yearConfig = GALLERY[year];
  const mediaKey = yearConfig.subTabs ? `${year}:${subTab}` : year;
  const media = MEDIA[mediaKey] || [];

  const stepLightbox = (delta) => {
    setLightboxIndex((current) => (current === null ? null : (current + delta + media.length) % media.length));
  };

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

      {media.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          Photos coming soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {media.map((item, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {item.type === 'video' ? (
                <video src={item.src} controls className="h-[210px] w-full bg-black/20 object-contain sm:h-[260px]" />
              ) : (
                <img
                  src={item.src}
                  alt={item.caption || `${year} gallery`}
                  onClick={() => setLightboxIndex(i)}
                  className="h-[210px] w-full cursor-pointer bg-black/20 object-contain sm:h-[260px]"
                />
              )}
              {item.caption && <p className="p-2 text-xs text-white/60">{item.caption}</p>}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          media={media}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onStep={stepLightbox}
        />
      )}
    </PageWrap>
  );
}
