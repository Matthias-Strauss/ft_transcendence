import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { connectSocketWithToken } from '../socket';
import showToast from '../utils/toast';

interface LoginResponse {
  accessToken: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const demoBoard = ['X', 'O', 'X', 'O', 'X', '', '', 'O', ''];

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Enter username and password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError('Invalid credentials');
        return;
      }

      const data: LoginResponse = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      connectSocketWithToken(data.accessToken);
      navigate('/');
      showToast('Login successful! Welcome back.', 'success');
    } catch (err) {
      setError('Network error. Please try again.');
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-[#f7f9f9]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.14),transparent_30%),linear-gradient(180deg,#040812_0%,#071028_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(2,6,23,0.7)] backdrop-blur-xl lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-5 bg-slate-900/60 p-8 text-center sm:p-10 lg:p-12">
            <div>
              <div className="text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
                Transcendence
              </div>
              <div className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                Tic-Tac-Toe duels, live chat, posts, comments and friendly rivalry.
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                Play online
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                Live chat
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                Posts & likes
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3" aria-hidden>
              {demoBoard.map((cell, i) => (
                <div
                  key={i}
                  className={`flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-extrabold shadow-lg backdrop-blur-sm sm:size-16 sm:text-2xl ${
                    cell === 'X' ? 'text-pink-400' : cell === 'O' ? 'text-sky-400' : 'text-white'
                  }`}
                  style={{ animationDelay: `${i * 90}ms` } as React.CSSProperties}
                >
                  {cell === 'X' ? <span>✕</span> : cell === 'O' ? <span>◯</span> : null}
                </div>
              ))}
            </div>

            <div className="text-sm font-medium text-slate-400 sm:text-[15px]">
              Welcome back - your next match is waiting
            </div>
          </div>

          <div className="bg-slate-950/70 p-8 sm:p-10 lg:p-12">
            <h3 className="text-2xl font-bold tracking-[-0.02em] text-white">Welcome back</h3>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">Log in to continue your game</p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-300">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:bg-white/8"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:bg-white/8"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-pink-500 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="mt-5 text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-sky-300 transition hover:text-sky-200"
              >
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
