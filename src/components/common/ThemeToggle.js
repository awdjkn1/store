import React, { useEffect, useState } from 'react';

// A small theme toggle that sets data-theme on <html> and persists selection
export default function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    } catch (e) { return 'dark'; }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const btnStyle = {
    background: 'transparent',
    border: '1px solid var(--sb-border)',
    color: 'var(--sb-text)',
    padding: '6px 8px',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8
  };

  return (
    <button aria-label="Toggle theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={toggle} className={className} style={btnStyle}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
