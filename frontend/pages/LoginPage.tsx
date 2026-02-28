import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
  accessToken: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const res = await fetch('http://localhost:8080/api/auth/login', {
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

    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Login to your account</p>

        {error && <p className="error">{error}</p>}

        <input
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn" onClick={handleLogin}>
          Login
        </button>

        <button className="secondary-btn" onClick={() => navigate('/register')}>
          Don&apos;t have an account? Register
        </button>
      </div>
    </div>
  );
}
