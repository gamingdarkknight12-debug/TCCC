'use client';

import { useEffect, useState } from 'react';
import { Header, PageWrap } from '../components/UI';

export default function AdminLayout({ children }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // The login cookie is httpOnly (invisible to JS) and lasts 8 hours, but
  // `loggedIn` above is plain React state that resets on every mount — so
  // without this check, navigating away from /admin and back always showed
  // the password form again even though the still-valid cookie meant the
  // server would have accepted any admin request anyway.
  useEffect(() => {
    fetch('/api/admin/check-auth')
      .then((res) => {
        if (res.ok) setLoggedIn(true);
      })
      .finally(() => setCheckingSession(false));
  }, []);

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

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />

      <PageWrap
        title="Admin: Match Score Management"
        subtitle="Private page for Telugu Titans admins only. This page is not shown in public navigation."
      >
        {checkingSession ? (
          <div className="card max-w-lg p-6 text-white/60">Checking session…</div>
        ) : !loggedIn ? (
          <form onSubmit={login} className="card max-w-lg p-6">
            <h3 className="text-2xl font-bold text-amber-300">Admin Login</h3>

            <p className="mt-3 text-white/65">
              Enter the private admin password.
            </p>

            <div className="relative mt-5">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 pr-20 text-white outline-none focus:border-amber-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-300 hover:text-amber-200"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

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
          <div className="grid gap-6">{children}</div>
        )}
      </PageWrap>
    </main>
  );
}
