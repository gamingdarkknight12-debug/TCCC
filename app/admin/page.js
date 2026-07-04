'use client';

import { useEffect, useState } from 'react';
import { Header, PageWrap } from '../components/UI';

const LEAGUES = ['BEDCL', 'MCPL'];

function emptyBattingRow() {
  return { name: '', playerId: null, runs: 0, balls: 0, fours: 0, sixes: 0, notOut: false, dismissal: '' };
}

function emptyBowlingRow() {
  return { name: '', playerId: null, overs: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0, maidens: 0 };
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const [roster, setRoster] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);

  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [step, setStep] = useState('upload'); // upload | review

  const [form, setForm] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');

  async function login(e) {
    e.preventDefault();
    setLoginMessage('Checking...');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setLoggedIn(true);
      setLoginMessage('Logged in.');
    } else {
      setLoginMessage('Wrong password.');
    }
  }

  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/admin/players').then((r) => r.json()).then((d) => setRoster(d.players || []));
    loadRecentMatches();
  }, [loggedIn]);

  async function loadRecentMatches() {
    const res = await fetch('/api/admin/matches');
    const data = await res.json();
    setRecentMatches(data.matches || []);
  }

  function matchRosterId(name, currentRoster) {
    const found = currentRoster.find((p) => p.canonical_name.toLowerCase() === (name || '').toLowerCase());
    return found ? found.id : null;
  }

  async function parseScorecard() {
    if (!file) return;
    setParsing(true);
    setParseError('');

    const body = new FormData();
    body.append('file', file);

    const res = await fetch('/api/admin/parse-scorecard', { method: 'POST', body });
    const data = await res.json();
    setParsing(false);

    if (!res.ok) {
      setParseError(data.error || 'Parse failed.');
      return;
    }

    const p = data.parsed;
    setForm({
      league: LEAGUES.includes(p.league) ? p.league : 'BEDCL',
      season: new Date().getFullYear(),
      opponent: p.opponent || '',
      matchDate: p.matchDate || '',
      matchTime: '',
      ground: '',
      homeAway: 'Home',
      teamScore: p.teamScore || '',
      opponentScore: p.opponentScore || '',
      resultText: p.resultText || '',
      resultType: '',
      summaryText: p.draftSummary || '',
      mvpText: p.mvpGuess || '',
      sourceType: file.type.startsWith('image/') ? 'image' : 'pdf',
      sourceFileName: file.name,
      rawExtraction: p,
      rawOcrText: data.rawText || '',
      battingRows: (p.battingTT || []).map((r) => ({
        name: r.name,
        playerId: matchRosterId(r.name, roster),
        runs: r.runs || 0,
        balls: r.balls || 0,
        fours: r.fours || 0,
        sixes: r.sixes || 0,
        notOut: !!r.notOut,
        dismissal: r.dismissal || '',
      })),
      bowlingRows: (p.bowlingTT || []).map((r) => ({
        name: r.name,
        playerId: matchRosterId(r.name, roster),
        overs: r.overs || 0,
        runs: r.runs || 0,
        wickets: r.wickets || 0,
        wides: r.wides || 0,
        noBalls: r.noBalls || 0,
        dots: r.dots || 0,
        maidens: r.maidens || 0,
      })),
    });
    setStep('review');
  }

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

    setPublishMessage(status === 'draft' ? 'Saved as draft.' : 'Published — it will show up on the live site now.');
    setForm(null);
    setFile(null);
    setStep('upload');
    loadRecentMatches();
  }

  async function deleteMatch(id) {
    if (!confirm('Delete this match and all its stats permanently?')) return;
    await fetch(`/api/admin/matches?id=${id}`, { method: 'DELETE' });
    loadRecentMatches();
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />

      <PageWrap
        title="Admin: Match Score Management"
        subtitle="Private page for Telugu Titans admins only. This page is not shown in public navigation."
      >
        {!loggedIn ? (
          <form onSubmit={login} className="card max-w-lg p-6">
            <h3 className="text-2xl font-bold text-amber-300">Admin Login</h3>

            <p className="mt-3 text-white/65">
              Enter the private admin password.
            </p>

            <input
              type="password"
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
            />

            <button className="btn btn-gold mt-4" type="submit">
              Login
            </button>

            {loginMessage && (
              <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">
                {loginMessage}
              </div>
            )}
          </form>
        ) : (
          <div className="grid gap-6">
            {step === 'upload' && (
              <div className="card p-6">
                <h3 className="text-2xl font-bold text-amber-300">Import Scorecard</h3>

                <p className="mt-3 text-white/65">
                  Upload a scorecard screenshot or photo (CricHeroes or any scoring app). Free OCR reads the text off
                  it and takes a rough guess at player rows — it's not as sharp as a human, so expect to fix names,
                  fill in missing columns, and re-check rows in the review step. The raw scanned text is shown there
                  too, so you can cross-check against it. Nothing goes live until you hit Publish. PDFs aren't
                  supported by this free method — screenshots/photos only.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none"
                />

                <button
                  onClick={parseScorecard}
                  disabled={!file || parsing}
                  className="btn btn-gold mt-4 disabled:opacity-40"
                >
                  {parsing ? 'Reading scorecard…' : 'Parse Scorecard'}
                </button>

                {parseError && (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    {parseError}
                  </div>
                )}
              </div>
            )}

            {step === 'review' && form && (
              <div className="card p-6">
                <h3 className="text-2xl font-bold text-amber-300">Review Before Publishing</h3>
                <p className="mt-2 mb-4 text-white/65">
                  Fix anything the OCR misread or missed, then publish or save as a draft. Nothing has been saved yet.
                </p>

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

                <label className="mt-4 block text-sm text-white/70">
                  News Summary
                  <textarea
                    value={form.summaryText}
                    onChange={(e) => updateForm('summaryText', e.target.value)}
                    className="mt-1 h-24 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
                  />
                </label>

                <label className="mt-4 block text-sm text-white/70">
                  MVP
                  <input
                    value={form.mvpText}
                    onChange={(e) => updateForm('mvpText', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white"
                  />
                </label>

                <h4 className="mt-8 text-xl font-bold text-amber-300">Batting</h4>
                <div className="mt-3 space-y-3">
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

                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={() => publish('published')} disabled={publishing} className="btn btn-gold disabled:opacity-40">
                    {publishing ? 'Publishing…' : 'Publish'}
                  </button>
                  <button onClick={() => publish('draft')} disabled={publishing} className="btn btn-ghost disabled:opacity-40">
                    Save as Draft
                  </button>
                  <button onClick={() => { setStep('upload'); setForm(null); }} className="btn btn-ghost">
                    Cancel
                  </button>
                </div>

                {publishMessage && (
                  <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">
                    {publishMessage}
                  </div>
                )}
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-2xl font-bold text-amber-300">Recent Matches</h3>

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
                      <button onClick={() => deleteMatch(m.id)} className="btn btn-ghost text-xs">
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </PageWrap>
    </main>
  );
}
