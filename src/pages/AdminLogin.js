import React, { useState } from 'react';
import axios from 'axios';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/admin/auth/login', { username, password });
      onLogin(res.data.token, res.data.admin);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        padding: '2.5rem 2rem',
        minWidth: '320px',
        maxWidth: '90vw',
        textAlign: 'center',
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#232526', fontWeight: 700 }}>Admin Login</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #232526 0%, #414345 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              marginTop: '0.5rem',
              transition: 'background 0.2s',
            }}
          >
            Login
          </button>
        </form>
        {error && <div style={{ color: '#ff4444', marginTop: '1rem', fontWeight: 500 }}>{error}</div>}
      </div>
    </div>
  );
};

export default AdminLogin;
