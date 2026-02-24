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
    <div>
      <h1>Login</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
