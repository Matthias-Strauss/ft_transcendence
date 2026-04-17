import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthShowcase } from './auth/AuthShowcase';
import { apiFetch } from '../utils/api';
import { validatePassword } from '../utils/password';
import showToast from '../utils/toast';

const Registration: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayname, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function validate() {
    if (!username.trim()) return 'Choose a username';
    if (!email.trim()) return 'Enter a valid email';
    const pwdErr = validatePassword(password);
    if (pwdErr) return pwdErr;
    if (password.toLowerCase().includes(username.toLowerCase())) {
      return 'Password cannot contain username';
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!acceptedPrivacy || !acceptedTerms) {
      setError('You must accept the Privacy Policy and Terms of Service to continue');
      return;
    }
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          displayname,
          acceptedPrivacy,
          acceptedTerms,
        }),
      });

      if (res.ok) {
        navigate('/login');
        return;
      }

      const payload = await res.json().catch(() => null);
      setError(payload?.message || 'Registration failed');
    } catch {
      showToast('Registration failed', 'error');
      setError('Network error — try again');
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
            description="Pong matches, player profiles and social features in one multiplayer space."
            footer="Fast matches • Casual ranking • Friendly rivalry"
            badges={['Create profile', 'Join matches', 'Find friends']}
          />

          <div className="auth-enter auth-enter-delay-2 relative bg-slate-950/70 p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_22%)]" />
            <div className="relative inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/85">
              <span className="auth-signal-dot size-2 rounded-full bg-sky-300" />
              New player setup
            </div>
            <h3 className="text-2xl font-bold tracking-[-0.02em] text-white">Create account</h3>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Set up your profile to start playing
            </p>

            <form onSubmit={handleSubmit} className="relative mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-300">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Choose a username"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_18px_45px_rgba(14,165,233,0.12)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="displayname" className="text-sm font-medium text-slate-300">
                  Display name
                </label>
                <input
                  id="displayname"
                  value={displayname}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="nickname"
                  placeholder="How your profile should appear"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_18px_45px_rgba(14,165,233,0.12)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_18px_45px_rgba(14,165,233,0.12)]"
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
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-sky-400 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_18px_45px_rgba(14,165,233,0.12)]"
                />
              </div>

              <div className="space-y-2 mt-1">
                <label className="flex items-start gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    aria-required
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-sky-400"
                  />
                  <span>
                    I have read and agree to the{' '}
                    <Link to="/privacy" className="font-semibold text-sky-300 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    aria-required
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-sky-400"
                  />
                  <span>
                    I have read and agree to the{' '}
                    <Link to="/terms" className="font-semibold text-sky-300 hover:underline">
                      Terms of Service
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-sky-400 to-pink-500 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting || !acceptedPrivacy || !acceptedTerms}
                aria-busy={submitting}
              >
                <span className="auth-button-sheen pointer-events-none absolute inset-y-0 left-[-30%] w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                {submitting ? (
                  <span className="relative inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <span className="relative">Create account</span>
                )}
              </button>
            </form>

            <div className="relative mt-5 text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-sky-300 transition hover:text-sky-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
