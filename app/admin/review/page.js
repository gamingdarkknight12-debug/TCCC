'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LEAGUES, blankForm, emptyBattingRow, emptyBowlingRow, generateSummary, validateMatch, PENDING_FORM_KEY } from '../shared';

function ReviewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');

  const [roster, setRoster] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  // React 18 Strict Mode double-invokes effects in dev — without this guard,
  // the second invocation would find the sessionStorage handoff already
  // consumed by the first and silently fall back to a blank/existing form,
  // clobbering the freshly-scanned data.
  const loadedRef = useRef(false);

  useEffect(() => {
    fetch('/api/admin/players').then((r) => r.json()).then((d) => setRoster(d.players || []));
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function load() {
      const pending = sessionStorage.getItem(PENDING_FORM_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_FORM_KEY);
        setForm(JSON.parse(pending));
        setLoading(false);
        return;
      }

      if (matchId) {
        const res = await fetch(`/api/admin/match-detail?id=${matchId}`);
        if (res.ok) {
          const data = await res.json();
          const m = data.match;
          setForm(
            blankForm({
              matchId: m.id,
              league: m.league,
              season: m.season,
              opponent: m.opponent,
              matchDate: m.match_date,
              matchTime: m.match_time || '',
              ground: m.ground || '',
              homeAway: m.home_away || 'Home',
              teamScore: m.team_score || '',
              opponentScore: m.opponent_score || '',
              resultText: m.result_text || '',
              resultType: m.result_type || '',
              summaryText: m.summary_text || '',
              mvpText: m.mvp_text || '',
              mvpPlayerId: m.mvp_player_id || null,
              battingRows: data.battingRows.length ? data.battingRows : [emptyBattingRow()],
              bowlingRows: data.bowlingRows.length ? data.bowlingRows : [emptyBowlingRow()],
            })
          );
          setLoading(false);
          return;
        }
      }

      setForm(blankForm());
      setLoading(false);
    }
    load();
  }, [matchId]);

  const validation = useMemo(() => (form ? validateMatch(form) : { errors: [], warnings: [] }), [form]);

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateRow(kind, index, field, value) {
    setForm((f) => {
      const rows = [...f[kind]];
      rows[index] = { ...rows[index], [field]: value };
      return { ...f, [kind]: rows };
    });
  }

  function addRow(kind) {
    setForm((f) => ({ ...f, [kind]: [...f[kind], kind === 'battingRows' ? emptyBattingRow() : emptyBowlingRow()] }));
  }

  function removeRow(kind, index) {
    setForm((f) => ({ ...f, [kind]: f[kind].filter((_, i) => i !== index) }));
  }

  async function addNewPlayer(kind, index, name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return;

    const res = await fetch('/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();

    if (data.player) {
      setRoster((r) => [...r, data.player]);
      updateRow(kind, index, 'playerId', data.player.id);
      updateRow(kind, index, 'newPlayerName', '');
    }
  }

  async function publish(status) {
    setPublishing(true);
    setPublishMessage('');

    const res = await fetch('/api/admin/publish-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status, createNews: status === 'published' }),
    });
    const data = await res.json();
    setPublishing(false);

    if (!res.ok) {
      setPublishMessage(data.error || 'Publish failed.');
      return;
    }

    router.push('/admin');
  }

  if (loading || !form) {
    return (
      <div className="card p-6">
        <p className="text-white/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-amber-300">Review Before Publishing</h3>
        <Link href="/admin" className="btn btn-ghost text-xs">
          Back to Dashboard
        </Link>
      </div>
      <p className="mt-2 mb-4 text-white/65">
        Fix anything the OCR misread or missed, then publish or save as a draft. Nothing has been saved yet.
      </p>

      {form.parseError && (
        <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          {form.parseError}
        </div>
      )}

      {form.rawOcrText && (
        <details className="mb-6 rounded-xl border border-white/10 bg-black/30 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-amber-300">
            Raw scanned text (reference — click to expand)
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-white/60">
            {form.rawOcrText}
          </pre>
        </details>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/70">
          League
          <select
            value={form.league}
            onChange={(e) => updateForm('league', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          >
            {LEAGUES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-white/70">
          Season
          <input
            type="number"
            value={form.season}
            onChange={(e) => updateForm('season', Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>

        <label className="text-sm text-white/70">
          Opponent
          <input
            value={form.opponent}
            onChange={(e) => updateForm('opponent', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>

        <label className="text-sm text-white/70">
          Match Date
          <input
            type="date"
            value={form.matchDate}
            onChange={(e) => updateForm('matchDate', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>

        <label className="text-sm text-white/70">
          Time
          <input
            value={form.matchTime}
            onChange={(e) => updateForm('matchTime', e.target.value)}
            placeholder="e.g. 7:30 AM"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>

        <label className="text-sm text-white/70">
          Ground
          <input
            value={form.ground}
            onChange={(e) => updateForm('ground', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>

        <label className="text-sm text-white/70">
          Home/Away
          <select
            value={form.homeAway}
            onChange={(e) => updateForm('homeAway', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          >
            <option>Home</option>
            <option>Away</option>
          </select>
        </label>

        <label className="text-sm text-white/70">
          Team Score
          <input
            value={form.teamScore}
            onChange={(e) => updateForm('teamScore', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>

        <label className="text-sm text-white/70">
          Opponent Score
          <input
            value={form.opponentScore}
            onChange={(e) => updateForm('opponentScore', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/70">
          Result
          <input
            value={form.resultText}
            onChange={(e) => updateForm('resultText', e.target.value)}
            placeholder="e.g. Telugu Titans won by 29 runs"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>

        <label className="text-sm text-white/70">
          Result Type <span className="text-amber-300">(drives Standings — pick one)</span>
          <select
            value={form.resultType}
            onChange={(e) => updateForm('resultType', e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          >
            <option value="">Select...</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="no_result">No Result (rain, abandoned)</option>
            <option value="tie">Tie</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="text-sm text-white/70">News Summary</label>
        <button
          type="button"
          onClick={() => updateForm('summaryText', generateSummary(form))}
          className="btn btn-ghost text-xs"
        >
          Auto-Generate from Stats
        </button>
      </div>
      <textarea
        value={form.summaryText}
        onChange={(e) => updateForm('summaryText', e.target.value)}
        className="mt-1 h-24 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/70">
          MVP (news blurb text)
          <input
            value={form.mvpText}
            onChange={(e) => updateForm('mvpText', e.target.value)}
            placeholder="e.g. Nipun (41 off 48)"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          />
        </label>
        <label className="text-sm text-white/70">
          MVP Player <span className="text-amber-300">(their photo becomes the news image)</span>
          <select
            value={form.mvpPlayerId || ''}
            onChange={(e) => updateForm('mvpPlayerId', e.target.value ? Number(e.target.value) : null)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
          >
            <option value="">Not selected</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>{p.canonical_name}</option>
            ))}
          </select>
        </label>
      </div>

      <h4 className="mt-8 text-xl font-bold text-amber-300">Batting</h4>
      <div className="mt-3 space-y-3">
        <div className="hidden gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-white/40 md:grid md:grid-cols-7">
          <span className="col-span-2">Player</span>
          <span>Runs</span>
          <span>Balls</span>
          <span>4s</span>
          <span>6s</span>
          <span>Not Out</span>
        </div>
        {form.battingRows.map((row, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
              <select
                value={row.playerId || ''}
                onChange={(e) => updateRow('battingRows', i, 'playerId', e.target.value ? Number(e.target.value) : null)}
                className="col-span-2 rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white"
              >
                <option value="">{row.name || 'Unmatched'} (unmatched)</option>
                {roster.map((p) => (
                  <option key={p.id} value={p.id}>{p.canonical_name}</option>
                ))}
              </select>
              <input type="number" value={row.runs} onChange={(e) => updateRow('battingRows', i, 'runs', Number(e.target.value))} placeholder="Runs" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <input type="number" value={row.balls} onChange={(e) => updateRow('battingRows', i, 'balls', Number(e.target.value))} placeholder="Balls" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <input type="number" value={row.fours} onChange={(e) => updateRow('battingRows', i, 'fours', Number(e.target.value))} placeholder="4s" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <input type="number" value={row.sixes} onChange={(e) => updateRow('battingRows', i, 'sixes', Number(e.target.value))} placeholder="6s" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <label className="flex items-center gap-1 text-xs text-white/70">
                <input type="checkbox" checked={row.notOut} onChange={(e) => updateRow('battingRows', i, 'notOut', e.target.checked)} /> Not Out
              </label>
            </div>

            {!row.playerId && (
              <div className="mt-2 flex gap-2">
                <input
                  placeholder="Add as new player..."
                  value={row.newPlayerName || ''}
                  onChange={(e) => updateRow('battingRows', i, 'newPlayerName', e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white"
                />
                <button onClick={() => addNewPlayer('battingRows', i, row.newPlayerName || row.name)} className="btn btn-ghost text-xs">
                  Add Player
                </button>
              </div>
            )}

            <button onClick={() => removeRow('battingRows', i)} className="btn btn-ghost mt-2 text-xs">
              Remove Row
            </button>
          </div>
        ))}
        <button onClick={() => addRow('battingRows')} className="btn btn-ghost text-sm">
          + Add batting row
        </button>
      </div>

      <h4 className="mt-8 text-xl font-bold text-amber-300">Bowling</h4>
      <div className="mt-3 space-y-3">
        <div className="hidden gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-white/40 md:grid md:grid-cols-7">
          <span className="col-span-2">Player</span>
          <span>Overs</span>
          <span>Runs</span>
          <span>Wickets</span>
          <span>Wides</span>
          <span>No Balls</span>
        </div>
        {form.bowlingRows.map((row, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
              <select
                value={row.playerId || ''}
                onChange={(e) => updateRow('bowlingRows', i, 'playerId', e.target.value ? Number(e.target.value) : null)}
                className="col-span-2 rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white"
              >
                <option value="">{row.name || 'Unmatched'} (unmatched)</option>
                {roster.map((p) => (
                  <option key={p.id} value={p.id}>{p.canonical_name}</option>
                ))}
              </select>
              <input type="number" step="0.1" value={row.overs} onChange={(e) => updateRow('bowlingRows', i, 'overs', Number(e.target.value))} placeholder="Overs" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <input type="number" value={row.runs} onChange={(e) => updateRow('bowlingRows', i, 'runs', Number(e.target.value))} placeholder="Runs" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <input type="number" value={row.wickets} onChange={(e) => updateRow('bowlingRows', i, 'wickets', Number(e.target.value))} placeholder="Wickets" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <input type="number" value={row.wides} onChange={(e) => updateRow('bowlingRows', i, 'wides', Number(e.target.value))} placeholder="Wides" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
              <input type="number" value={row.noBalls} onChange={(e) => updateRow('bowlingRows', i, 'noBalls', Number(e.target.value))} placeholder="No Balls" className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white" />
            </div>

            {!row.playerId && (
              <div className="mt-2 flex gap-2">
                <input
                  placeholder="Add as new player..."
                  value={row.newPlayerName || ''}
                  onChange={(e) => updateRow('bowlingRows', i, 'newPlayerName', e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white"
                />
                <button onClick={() => addNewPlayer('bowlingRows', i, row.newPlayerName || row.name)} className="btn btn-ghost text-xs">
                  Add Player
                </button>
              </div>
            )}

            <button onClick={() => removeRow('bowlingRows', i)} className="btn btn-ghost mt-2 text-xs">
              Remove Row
            </button>
          </div>
        ))}
        <button onClick={() => addRow('bowlingRows')} className="btn btn-ghost text-sm">
          + Add bowling row
        </button>
      </div>

      <h4 className="mt-8 text-xl font-bold text-amber-300">Data Validation</h4>
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-4">
        {validation.errors.length === 0 && validation.warnings.length === 0 ? (
          <p className="text-sm text-emerald-300">No issues found. Looks good to publish.</p>
        ) : (
          <div className="space-y-3">
            {validation.errors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-300">Errors — must fix before publishing:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-red-300/90">
                  {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-amber-300">Warnings — check these, but won't block publishing:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-200/90">
                  {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => publish('published')}
          disabled={publishing || validation.errors.length > 0}
          title={validation.errors.length > 0 ? 'Fix the errors above before publishing.' : ''}
          className="btn btn-gold disabled:opacity-40"
        >
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
        <button onClick={() => publish('draft')} disabled={publishing} className="btn btn-ghost disabled:opacity-40">
          Save as Draft
        </button>
        <Link href="/admin" className="btn btn-ghost">
          Cancel
        </Link>
      </div>

      {publishMessage && (
        <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">
          {publishMessage}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="card p-6"><p className="text-white/60">Loading…</p></div>}>
      <ReviewPageInner />
    </Suspense>
  );
}
