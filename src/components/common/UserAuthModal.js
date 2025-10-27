import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(30,30,30,0.85)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const cardStyle = {
  background: '#232526',
  borderRadius: '16px',
  boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
  padding: '2.5rem 2rem',
  minWidth: 340,
  maxWidth: 400,
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  margin: '0.5rem 0',
  borderRadius: '8px',
  border: '1px solid #444',
  background: '#181818',
  color: '#fff',
  fontSize: '1rem',
};
const buttonStyle = {
  width: '100%',
  padding: '0.75rem',
  margin: '1rem 0 0.5rem 0',
  borderRadius: '8px',
  border: 'none',
  background: 'linear-gradient(90deg,#ff6b35,#e55a2b)',
  color: '#fff',
  fontWeight: 600,
  fontSize: '1.1rem',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
};
const linkStyle = {
  color: '#ff6b35',
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
        <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 32, background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>&times;</button>
        <h2 style={{ marginBottom: '1.5rem', color: '#ff6b35', fontWeight: 700 }}>{isRegister ? 'Create Account' : 'Login'}</h2>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {isRegister && (
            <input style={inputStyle} type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          )}
          <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" style={buttonStyle}>{isRegister ? 'Register' : 'Login'}</button>
        </form>
        {error && <div style={{ color: '#ff4444', marginTop: 8 }}>{error}</div>}
        <div style={linkStyle} onClick={() => setIsRegister(r => !r)}>
          {isRegister ? 'Already registered? Login' : 'New user? Register'}
        </div>
      </div>
    </div>
  );
}
