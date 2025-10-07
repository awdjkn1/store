import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { FcGoogle } from 'react-icons/fc';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);
    if (res.token) {
      localStorage.setItem('token', res.token);
      navigate('/');
    } else {
      setError(res.message || 'Login failed');
    }
  };

  // Placeholder for Google login
  const handleGoogleLogin = () => {
    alert('Google login not implemented yet.');
  };

  const handleAdminLogin = () => {
    navigate('/admin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--primary-bg)',
      color: 'var(--text-primary)'
    }}>
      <div style={{
        background: 'var(--secondary-bg)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        padding: '2.5rem 2rem 2rem 2rem',
        width: '100%',
        maxWidth: 400,
        animation: 'fadeIn 0.7s',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-color)' }}>Sign In</span>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ fontSize: 16 }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ fontSize: 16 }}
          />
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <button
          className="btn btn-outline"
          onClick={handleGoogleLogin}
          style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <FcGoogle size={22} /> Login with Google
        </button>
        {error && <div className="error-message" style={{ marginTop: 12 }}>{error}</div>}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            New user?{' '}
            <Link to="/register" style={{ color: 'var(--accent-color)', textDecoration: 'underline', fontWeight: 500 }}>
              Register now
            </Link>
          </span>
          <button
            style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
            onClick={handleAdminLogin}
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
