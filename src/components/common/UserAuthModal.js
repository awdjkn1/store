/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:08.326Z */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.85)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const cardStyle = {
  background: 'var(--sb-surface)',
  borderRadius: '1rem',
  boxShadow: '0 0.25rem 2rem rgba(0,0,0,0.45)',
  padding: '2.5rem 2rem',
  minWidth: 340,
  maxWidth: 400,
  color: 'var(--sb-text)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  margin: '0.5rem 0',
  borderRadius: '0.5rem',
  border: '0.0625rem solid var(--sb-border)',
  background: 'var(--sb-bg)',
  color: 'var(--sb-text)',
  fontSize: '1rem',
};
const buttonStyle = {
  width: '100%',
  padding: '0.75rem',
  margin: '1rem 0 0.5rem 0',
  borderRadius: '0.5rem',
  border: 'none',
  background: 'linear-gradient(90deg, var(--sb-accent), var(--sb-accent-400))',
  color: 'var(--sb-accent-on)',
  fontWeight: 600,
  fontSize: '1.1rem',
  cursor: 'pointer',
  boxShadow: '0 0.125rem 0.5rem rgba(0,0,0,0.15)',
};
const linkStyle = {
  color: 'var(--sb-accent)',
  textDecoration: 'underline',
  cursor: 'pointer',
  marginTop: 8,
};

export default function UserAuthModal({ show, onClose }) {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        // Registration logic: call backend API to create user
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        login(data.user, data.token);
        onClose();
      } else {
        // Login logic: call backend API to login user
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        login(data.user, data.token);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={modalStyle}>
      <div style={cardStyle}>
  <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 32, background: 'none', border: 'none', color: 'var(--sb-text)', fontSize: 24, cursor: 'pointer' }}>&times;</button>
  <h2 style={{ marginBottom: '1.5rem', color: 'var(--sb-accent)', fontWeight: 700 }}>{isRegister ? 'Create Account' : 'Login'}</h2>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {isRegister && (
            <input style={inputStyle} type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          )}
          <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" style={buttonStyle}>{isRegister ? 'Register' : 'Login'}</button>
        </form>
  {error && <div style={{ color: 'var(--sb-error)', marginTop: 8 }}>{error}</div>}
        <div style={linkStyle} onClick={() => setIsRegister(r => !r)}>
          {isRegister ? 'Already registered? Login' : 'New user? Register'}
        </div>
      </div>
    </div>
  );
}
