import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthShowcase } from '../components/auth/AuthShowcase';
import useAuthStore from '../utils/authStore';
import { markSessionAuthenticated } from '../utils/api';
import showToast from '../utils/toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const authStatus = useAuthStore((state) => state.status);
  const navigate = useNavigate();

  useEffect(() => {
    if (authStatus === 'authenticated') {
      navigate('/', { replace: true });
    }
  }, [authStatus, navigate]);

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

      markSessionAuthenticated();
      navigate('/', { replace: true });
      showToast('Login successful! Welcome back.', 'success');
    } catch {
      setError('Network error. Please try again.');
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-[#f7f9f9]">
      <div className="auth-page-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.14),transparent_30%),linear-gradient(180deg,#040812_0%,#071028_100%)]" />
      <div className="auth-ambient pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="auth-ambient auth-ambient-delayed pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="auth-ambient pointer-events-none absolute bottom-[-7rem] left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(2,6,23,0.7)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <AuthShowcase
            description="Pong matches, live chat, posts, comments and friendly rivalry."
            footer="Welcome back - your next match is waiting"
          />

          <div className="auth-enter auth-enter-delay-2 relative bg-slate-950/70 p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_22%)]" />
            <div className="relative inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/85">
              <span className="auth-signal-dot size-2 rounded-full bg-emerald-300" />
              Secure session
            </div>
            <h3 className="text-2xl font-bold tracking-[-0.02em] text-white">Welcome back</h3>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">Log in to continue your game</p>

            <form onSubmit={handleLogin} className="relative mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-300">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Enter your username"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_18px_45px_rgba(14,165,233,0.12)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_18px_45px_rgba(14,165,233,0.12)]"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-sky-400 to-pink-500 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                aria-busy={submitting}
              >
                <span className="auth-button-sheen pointer-events-none absolute inset-y-0 left-[-30%] w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                {submitting ? (
                  <span className="relative inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <span className="relative">Login</span>
                )}
              </button>
            </form>

            <div className="relative mt-5 text-sm text-slate-400">
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
