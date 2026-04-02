import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';
import { connectSocketWithToken } from '../socket';

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

  const handleLogin = async () => {
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
    } catch (err) {
      setError('Network error. Please try again.');
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <div className="title">Transcendence</div>
          <div className="subtitle">
            Tic-Tac-Toe duels, live chat, posts, comments and friendly rivalry.
          </div>

          <div className="feature-pills">
            <span>Play online</span>
            <span>Live chat</span>
            <span>Posts & likes</span>
          </div>

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

          <div className="desc">Welcome back — your next match is waiting</div>
        </div>

        <div className="auth-right">
          <h3 className="heading">Welcome back</h3>
          <p className="sub">Log in to continue your game</p>

          <div className="auth-form">
            <div className={`input-group ${username ? 'filled' : ''}`}>
              <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <label htmlFor="username">Username</label>
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

            {error && <div className="error-box">{error}</div>}

            <button
              type="button"
              className="btn-submit"
              disabled={submitting}
              aria-busy={submitting}
              onClick={handleLogin}
            >
              {submitting ? <span className="spinner" /> : 'Login'}
            </button>
          </div>

          <div className="alt">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="link">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
