import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../styles/auth.css';

const Registration: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayname, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const specialCharacters = '!@#$%^&*()_+=-{}[]:;"|/.,<>?`~';
  const numberChars = '0123456789';

  function validate() {
    if (!username.trim()) return 'Choose a username';
    if (!email.trim()) return 'Enter a valid email';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.toLowerCase().includes(username.toLowerCase()))
      return 'Password cannot contain username';
    if (!specialCharacters.split('').some((char) => password.includes(char)))
      return 'Password must include a special character';
    if (!numberChars.split('').some((char) => password.includes(char)))
      return 'Password must include a number';
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, displayname }),
      });

      if (res.ok) {
        navigate('/login');
        return;
      }

      const payload = await res.json().catch(() => null);
      setError(payload?.message || 'Registration failed');
    } catch (err) {
      console.error('Registration failed', err);
      setError('Network error — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const demoBoard = ['X', 'O', 'X', 'O', 'X', '', '', 'O', ''];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <div className="title">Transcendence</div>
          <div className="subtitle">Tic‑Tac‑Toe duels — play with friends, climb the ranks.</div>

          <div className="demo-board" aria-hidden>
            {demoBoard.map((cell, i) => (
              <div
                key={i}
                className={`cell ${cell === 'X' ? 'x' : cell === 'O' ? 'o' : ''}`}
                style={{ animationDelay: `${i * 90}ms` } as React.CSSProperties}
              >
                {cell === 'X' ? (
                  <span className="mark">✕</span>
                ) : cell === 'O' ? (
                  <span className="mark">◯</span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="desc">Fast matches • Casual ranking • Friendly rivalry</div>
        </div>

        <div className="auth-right">
          <h3 className="heading">Create account</h3>
          <p className="sub">Set up your profile to start playing</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className={`input-group ${username ? 'filled' : ''}`}>
              <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <label htmlFor="username">Username</label>
            </div>

            <div className={`input-group ${displayname ? 'filled' : ''}`}>
              <input
                id="displayname"
                value={displayname}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <label htmlFor="displayname">Display name</label>
            </div>

            <div className={`input-group ${email ? 'filled' : ''}`}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className={`input-group ${password ? 'filled' : ''}`}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password">Password</label>
            </div>

            {error && <div className="error">{error}</div>}

            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? <span className="spinner" /> : 'Create account'}
            </button>
          </form>

          <div className="alt">
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
