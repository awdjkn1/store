import React, { useState } from 'react';
// Use fetch instead of axios for login

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.admin) {
        // Keep token in memory only (no localStorage). Server also set httpOnly cookie.
        onLogin(data.token, data.admin);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--sb-bg) 0%, var(--sb-surface) 100%)',
    }}>
      <div style={{
        background: 'var(--sb-surface)',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        padding: '2.5rem 2rem',
        minWidth: '320px',
        maxWidth: '90vw',
        textAlign: 'center',
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--sb-text)', fontWeight: 700 }}>Admin Login</h2>
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
              border: '1px solid var(--sb-border)',
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
              border: '1px solid var(--sb-border)',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: 'var(--sb-accent)',
              color: 'var(--sb-accent-on)',
              fontWeight: 600,
              fontSize: '1rem',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              transition: 'background 0.2s',
            }}
          >
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
        {error && <div style={{ color: 'var(--sb-error)', marginTop: '1rem', fontWeight: 500 }}>{error}</div>}
      </div>
    </div>
  );
};

export default AdminLogin;
