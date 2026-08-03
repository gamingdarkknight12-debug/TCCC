'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TabStrip } from '../components/UI';

function MatchScoresTab() {
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    loadRecentMatches();
  }, []);

  async function loadRecentMatches() {
    const res = await fetch('/api/admin/matches');
    const data = await res.json();
    setRecentMatches(data.matches || []);
  }

  async function deleteMatch(id) {
    if (!confirm('Delete this match and all its stats permanently?')) return;
    await fetch(`/api/admin/matches?id=${id}`, { method: 'DELETE' });
    loadRecentMatches();
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-amber-300">Recent Matches</h3>
        <Link href="/admin/import" className="btn btn-gold text-sm">
          + Import a New Scorecard
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {recentMatches.length === 0 ? (
          <p className="text-white/60">No matches yet.</p>
        ) : (
          recentMatches.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-sm text-white/80">
                <span className="font-bold text-amber-300">{m.league}</span> vs {m.opponent} — {m.match_date} —{' '}
                <span className="uppercase text-white/50">{m.status}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/import?matchId=${m.id}`} className="btn btn-ghost text-xs">
                  Import
                </Link>
                <Link href={`/admin/review?matchId=${m.id}`} className="btn btn-ghost text-xs">
                  Edit
                </Link>
                <button onClick={() => deleteMatch(m.id)} className="btn btn-ghost text-xs">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Small copy of Gallery.js's hardcoded config, just so the folder picker
// can suggest/dedupe against the 121 pre-existing static folders too, not
// only the ones already uploaded through this admin tab.
const HARDCODED_GALLERY = {
  2026: ['Blood Donation Drive', 'Game Pictures'],
  2025: [],
  2024: ['Ireland Tour', 'Game Pictures'],
  2023: ['Blood Donation Drive', 'Game Pictures'],
  2022: [],
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function compressImageInBrowser(file, maxDim = 1280, quality = 0.68) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Canvas compression produced no blob.'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image in browser.'));
    };
    img.src = url;
  });
}

function GalleryPhotosTab() {
  const [dynamicFolders, setDynamicFolders] = useState([]);
  const [year, setYear] = useState('');
  const [subTab, setSubTab] = useState('');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    const res = await fetch('/api/admin/gallery-folders');
    const data = await res.json();
    setDynamicFolders(data.folders || []);
  }

  const knownYears = Array.from(
    new Set([...Object.keys(HARDCODED_GALLERY), ...dynamicFolders.map((f) => f.year)])
  ).sort((a, b) => Number(b) - Number(a));

  function knownSubTabsForYear(y) {
    const hardcoded = HARDCODED_GALLERY[y] || [];
    const dynamic = dynamicFolders.filter((f) => f.year === y && f.subTab).map((f) => f.subTab);
    return Array.from(new Set([...hardcoded, ...dynamic]));
  }

  // Soft duplicate-folder protection: if the typed year/sub-tab slugifies to
  // match something that already exists, route into that existing folder
  // (preserving its casing) instead of creating a cosmetic duplicate tab.
  function resolveFolder(rawYear, rawSubTab) {
    const yearSlug = slugify(rawYear);
    const matchedYear = knownYears.find((y) => slugify(y) === yearSlug) || rawYear.trim();

    let matchedSubTab = null;
    if (rawSubTab.trim()) {
      const subSlug = slugify(rawSubTab);
      const candidates = knownSubTabsForYear(matchedYear);
      matchedSubTab = candidates.find((s) => slugify(s) === subSlug) || rawSubTab.trim();
    }

    return { year: matchedYear, subTab: matchedSubTab };
  }

  async function uploadAll() {
    if (!year.trim() || files.length === 0) return;
    const { year: finalYear, subTab: finalSubTab } = resolveFolder(year, subTab);

    setUploading(true);
    const nextResults = [];
    for (const file of files) {
      let blob = file;
      try {
        blob = await compressImageInBrowser(file);
      } catch {
        blob = file; // fall back to the original — server-side Jimp step is the safety net
      }

      const body = new FormData();
      body.append('file', blob, file.name);
      body.append('year', finalYear);
      if (finalSubTab) body.append('subTab', finalSubTab);
      if (caption.trim()) body.append('caption', caption.trim());

      try {
        const res = await fetch('/api/admin/gallery-upload', { method: 'POST', body });
        const data = await res.json();
        nextResults.push({ name: file.name, ok: res.ok && data.ok, error: data.error });
      } catch (err) {
        nextResults.push({ name: file.name, ok: false, error: err.message });
      }
      setResults([...nextResults]);
    }

    setUploading(false);
    setFiles([]);
    loadFolders();
  }

  return (
    <div className="card p-6">
      <h3 className="text-2xl font-bold text-amber-300">Upload Gallery Photos</h3>
      <p className="mt-3 text-white/65">
        Pick the year (and optional sub-tab) these photos belong to — type a new one to create a new folder, or
        match an existing one exactly to add to it. Photos are compressed automatically before upload.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-white/70">
          Year (existing: {knownYears.join(', ')})
          <input
            type="text"
            list="gallery-known-years"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2026 or 2027"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300"
          />
          <datalist id="gallery-known-years">
            {knownYears.map((y) => (
              <option key={y} value={y} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm text-white/70">
          Sub-tab (optional — leave blank for a flat year folder)
          <input
            type="text"
            list="gallery-known-subtabs"
            value={subTab}
            onChange={(e) => setSubTab(e.target.value)}
            placeholder="e.g. Game Pictures"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300"
          />
          <datalist id="gallery-known-subtabs">
            {knownSubTabsForYear(year).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="mt-4 block text-sm text-white/70">
        Caption (optional — applied to all photos in this batch)
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300"
        />
      </label>

      <label className="mt-4 block text-sm text-white/70">
        Photos
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none"
        />
      </label>

      <div className="mt-4">
        <button
          onClick={uploadAll}
          disabled={!year.trim() || files.length === 0 || uploading}
          className="btn btn-gold disabled:opacity-40"
        >
          {uploading ? 'Uploading…' : `Upload ${files.length || ''} Photo${files.length === 1 ? '' : 's'}`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-4 space-y-1">
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl border p-2 text-sm ${
                r.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {r.name}: {r.ok ? 'uploaded' : `failed — ${r.error}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('Match Scores');

  return (
    <div>
      <TabStrip tabs={['Match Scores', 'Gallery Photos']} active={tab} onChange={setTab} />
      {tab === 'Match Scores' ? <MatchScoresTab /> : <GalleryPhotosTab />}
    </div>
  );
}
