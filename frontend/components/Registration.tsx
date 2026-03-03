import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Registration: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayname, setDisplayName] = useState('');
  const navigate = useNavigate();

  const specialCharacters = '!@#$%^&*()_+=-{}[]:;"|/.,<>?`~';
  const numberChars = '0123456789';
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    if (password.toLowerCase().includes(username.toLowerCase())) {
      alert('Password cannot contain username');
      return;
    }
    if (!specialCharacters.split('').some((char) => password.includes(char))) {
      alert(`Password must include at least one special character from: ${specialCharacters}`);
      return;
    }
    if (!numberChars.split('').some((char) => password.includes(char))) {
      alert('Password must include at least one number from 0-9');
      return;
    }
    try {
      const response = await axios.post('https://localhost/api/auth/register', {
        username,
        email,
        password,
        displayname,
      });
      console.log('Registration success:', response.data);
      navigate('/login');
    } catch (error) {
      console.log('Registration failed:', error);
      alert('Registration failed. Please try again');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="text"
        placeholder="Display Name"
        value={displayname}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <button type="submit">Register</button>
    </form>
  );
};

export default Registration;
