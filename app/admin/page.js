'use client';

import { useState } from 'react';
import { Header, PageWrap } from '../components/UI';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [scoreUrl, setScoreUrl] = useState('');
  const [deleteUrl, setDeleteUrl] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

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

  async function importScore() {
    setImportMessage('Submitting...');

    const res = await fetch('/api/import-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoreUrl }),
    });

    const data = await res.json();
    setImportMessage(data.message || 'Done.');
  }

  async function deleteScore() {
    setDeleteMessage('Deleting...');

    const res = await fetch('/api/delete-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoreUrl: deleteUrl }),
    });

    const data = await res.json();
    setDeleteMessage(data.message || 'Delete completed.');
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
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-2xl font-bold text-amber-300">
                Import Scorecard
              </h3>

              <p className="mt-3 text-white/65">
                Paste CricClubs or CricHeroes match link after each game.
              </p>

              <input
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300"
                value={scoreUrl}
                onChange={(e) => setScoreUrl(e.target.value)}
                placeholder="https://... match scorecard link"
              />

              <button onClick={importScore} className="btn btn-gold mt-4">
                Import Score
              </button>

              {importMessage && (
                <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">
                  {importMessage}
                </div>
              )}

              <hr className="my-8 border-white/10" />

              <h3 className="text-2xl font-bold text-amber-300">
                Delete Imported Score
              </h3>

              <p className="mt-3 text-white/65">
                If a wrong scorecard was imported, paste the same match URL here
                to remove it.
              </p>

              <input
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300"
                value={deleteUrl}
                onChange={(e) => setDeleteUrl(e.target.value)}
                placeholder="Paste scorecard URL to delete"
              />

              <button onClick={deleteScore} className="btn btn-ghost mt-4">
                Delete Imported Score
              </button>

              {deleteMessage && (
                <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">
                  {deleteMessage}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="text-2xl font-bold text-amber-300">
                Backend Import Status
              </h3>

              <div className="mt-4 space-y-3 text-white/75">
                <p>Admin login is protected through the secured API route.</p>
                <p>Import Score will add match data using the scorecard URL.</p>
                <p>Delete Imported Score will remove the data linked to that URL.</p>
                <p>
                  Full CricClubs/CricHeroes parsing can be connected when the
                  exact scorecard format is finalized.
                </p>
              </div>
            </div>
          </div>
        )}
      </PageWrap>
    </main>
  );
}