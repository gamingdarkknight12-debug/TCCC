'use client';
import { useState } from 'react';
import { Header, PageWrap } from '../components/UI';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [scoreUrl, setScoreUrl] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoginMessage('Checking...');
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (res.ok) { setLoggedIn(true); setLoginMessage('Logged in.'); }
    else setLoginMessage('Wrong password.');
  }

  async function importScore() {
    setImportMessage('Submitting...');
    const res = await fetch('/api/import-score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scoreUrl }) });
    const data = await res.json();
    setImportMessage(data.message || 'Done.');
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />
      <PageWrap title="Admin: Add Match Score" subtitle="Private page for TCCC admins only. This page is not shown in public navigation.">
        {!loggedIn ? (
          <form onSubmit={login} className="card max-w-lg p-6">
            <h3 className="text-2xl font-bold text-amber-300">Admin Login</h3>
            <p className="mt-3 text-white/65">Enter the private admin password.</p>
            <input type="password" className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" />
            <button className="btn btn-gold mt-4" type="submit">Login</button>
            {loginMessage && <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">{loginMessage}</div>}
          </form>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-2xl font-bold text-amber-300">Paste Scorecard Link</h3>
              <p className="mt-3 text-white/65">Use CricClubs or CricHeroes match links after each game.</p>
              <input className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300" value={scoreUrl} onChange={(e) => setScoreUrl(e.target.value)} placeholder="https://... match scorecard link" />
              <button onClick={importScore} className="btn btn-gold mt-4">Import Score</button>
              {importMessage && <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">{importMessage}</div>}
            </div>
            <div className="card p-6">
              <h3 className="text-2xl font-bold text-amber-300">Backend Import Status</h3>
              <div className="mt-4 space-y-3 text-white/75">
                <p>Current export includes the private admin page and secured API route.</p>
                <p>The real CricClubs/CricHeroes parser can be added next when we know the exact scorecard link format.</p>
                <p>Until then, links are captured and validated through the private admin route.</p>
              </div>
            </div>
          </div>
        )}
      </PageWrap>
    </main>
  );
}
