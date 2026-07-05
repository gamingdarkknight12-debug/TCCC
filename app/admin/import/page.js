'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { blankForm, emptyBattingRow, emptyBowlingRow, matchRosterId, pendingInfoFromMatch, PENDING_FORM_KEY } from '../shared';

function ImportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');

  const [roster, setRoster] = useState([]);
  const [pendingMatchInfo, setPendingMatchInfo] = useState(null);
  const [battingFile, setBattingFile] = useState(null);
  const [bowlingFile, setBowlingFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseElapsedSec, setParseElapsedSec] = useState(0);
  const [parseError, setParseError] = useState('');
  const parseTimerRef = useRef(null);

  useEffect(() => {
    fetch('/api/admin/players').then((r) => r.json()).then((d) => setRoster(d.players || []));
  }, []);

  useEffect(() => {
    if (!matchId) return;
    fetch(`/api/admin/match-detail?id=${matchId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.match) setPendingMatchInfo(pendingInfoFromMatch(data.match));
      });
  }, [matchId]);

  useEffect(() => () => stopParseTimer(), []);

  function stopParseTimer() {
    if (parseTimerRef.current) {
      clearInterval(parseTimerRef.current);
      parseTimerRef.current = null;
    }
  }

  function goToReview(form) {
    sessionStorage.setItem(PENDING_FORM_KEY, JSON.stringify(form));
    router.push(matchId ? `/admin/review?matchId=${matchId}` : '/admin/review');
  }

  async function scanOneImage(file, section) {
    const body = new FormData();
    body.append('file', file);
    body.append('section', section);
    body.append('roster', JSON.stringify(roster.map((p) => p.canonical_name)));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/admin/parse-scorecard', { method: 'POST', body, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) return { section, fileName: file.name, error: data.error || 'Scan failed.' };
      return { section, fileName: file.name, candidates: data.candidates, rawText: data.rawText };
    } catch (err) {
      return { section, fileName: file.name, error: err.name === 'AbortError' ? 'timed out after 30s' : err.message };
    }
  }

  async function scanScorecards() {
    if (!battingFile && !bowlingFile) return;
    setParsing(true);
    setParseError('');
    setParseElapsedSec(0);
    parseTimerRef.current = setInterval(() => setParseElapsedSec((s) => s + 1), 1000);

    const jobs = [];
    if (battingFile) jobs.push(scanOneImage(battingFile, 'batting'));
    if (bowlingFile) jobs.push(scanOneImage(bowlingFile, 'bowling'));
    const results = await Promise.all(jobs);

    stopParseTimer();
    setParsing(false);

    const battingResult = results.find((r) => r.section === 'batting');
    const bowlingResult = results.find((r) => r.section === 'bowling');

    const failures = results.filter((r) => r.error);
    const combinedError = failures.length
      ? failures.map((r) => `${r.section === 'batting' ? 'Batting' : 'Bowling'} scan (${r.fileName}) failed: ${r.error}.`).join(' ') +
        ' Fill in those rows manually.'
      : '';

    const rawOcrText = results
      .filter((r) => r.rawText)
      .map((r) => `--- ${r.section === 'batting' ? 'Batting' : 'Bowling'} scan (${r.fileName}) ---\n${r.rawText}`)
      .join('\n\n');

    goToReview(
      blankForm({
        matchId: matchId ? Number(matchId) : null,
        ...pendingMatchInfo,
        sourceType: 'image',
        sourceFileName: [battingFile?.name, bowlingFile?.name].filter(Boolean).join(' + '),
        rawOcrText,
        parseError: combinedError,
        battingRows: battingResult?.candidates?.length
          ? battingResult.candidates.map((r) => ({
              name: r.name,
              playerId: matchRosterId(r.name, roster),
              runs: r.runs || 0,
              balls: r.balls || 0,
              fours: r.fours || 0,
              sixes: r.sixes || 0,
              notOut: !!r.notOut,
              dismissal: r.dismissal || '',
            }))
          : [emptyBattingRow()],
        bowlingRows: bowlingResult?.candidates?.length
          ? bowlingResult.candidates.map((r) => ({
              name: r.name,
              playerId: matchRosterId(r.name, roster),
              overs: r.overs || 0,
              runs: r.runs || 0,
              wickets: r.wickets || 0,
              wides: r.wides || 0,
              noBalls: r.noBalls || 0,
              dots: r.dots || 0,
              maidens: r.maidens || 0,
            }))
          : [emptyBowlingRow()],
      })
    );
  }

  function enterManually() {
    goToReview(blankForm({ matchId: matchId ? Number(matchId) : null, ...pendingMatchInfo }));
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-amber-300">Import Scorecard</h3>
        <Link href="/admin" className="btn btn-ghost text-xs">
          Back to Dashboard
        </Link>
      </div>

      {pendingMatchInfo ? (
        <div className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
          <p className="text-sm text-amber-200">
            Attaching a scorecard to <strong>{pendingMatchInfo.league} vs {pendingMatchInfo.opponent}</strong> —{' '}
            {pendingMatchInfo.matchDate}. League/opponent/date are pre-filled from that match in the next step.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-white/65">
          Upload the Telugu Titans batting table and/or bowling table as separate screenshots — since each box is
          labeled, we don't have to guess which table is which. Free OCR reads the text and takes a best-effort guess
          at each row; expect to fix names and numbers in the review step (the raw scanned text is shown there too,
          so you can cross-check). Nothing goes live until you hit Publish. PDFs aren't supported by this free method
          — screenshots/photos only.
        </p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-white/70">
          Batting screenshot
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBattingFile(e.target.files?.[0] || null)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none"
          />
        </label>
        <label className="block text-sm text-white/70">
          Bowling screenshot
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBowlingFile(e.target.files?.[0] || null)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={scanScorecards}
          disabled={(!battingFile && !bowlingFile) || parsing}
          className="btn btn-gold disabled:opacity-40"
        >
          {parsing ? `Scanning… ${parseElapsedSec}s (gives up at 30s)` : 'Scan Uploaded Screenshot(s)'}
        </button>
        <span className="text-sm text-white/50">or</span>
        <button onClick={enterManually} disabled={parsing} className="btn btn-ghost disabled:opacity-40">
          Enter Scores Manually
        </button>
      </div>

      {parsing && (
        <p className="mt-3 text-xs text-white/50">
          Still working — this counter keeps ticking while it's alive. If it reaches 30s with no result, you'll be
          moved to manual entry automatically for that screenshot.
        </p>
      )}

      {parseError && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {parseError}
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="card p-6"><p className="text-white/60">Loading…</p></div>}>
      <ImportPageInner />
    </Suspense>
  );
}
