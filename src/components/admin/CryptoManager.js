import React, { useEffect, useState } from 'react';

// Simple Crypto Management admin component
// Usage: include <CryptoManager /> inside your admin dashboard page (protected by admin role)

export default function CryptoManager() {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [selection, setSelection] = useState(new Set());
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetch('/api/payments/crypto/available', { credentials: 'include' });
        if (!resp.ok) throw new Error('Failed to fetch crypto list');
        const json = await resp.json();
        if (!mounted) return;
        setCryptos(Array.isArray(json.cryptos) ? json.cryptos : []);
      } catch (e) {
        console.error('CryptoManager fetch error', e);
        setMessage({ type: 'error', text: e.message || 'Failed to load cryptos' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSelect = (sym) => {
    setSelection(prev => {
      const s = new Set(prev);
      if (s.has(sym)) s.delete(sym); else s.add(sym);
      return s;
    });
  };

  const activateSelected = async () => {
    if (selection.size === 0) {
      setMessage({ type: 'error', text: 'Select one or more assets to activate' });
      return;
    }
    setActivating(true);
    setMessage(null);
    try {
      const assets = Array.from(selection);
      const resp = await fetch('/api/payments/crypto/activate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets })
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json.error || 'Activation failed');
      setMessage({ type: 'success', text: 'Activation completed, check results below.' });
      // update UI with results if provided
      if (json.results && Array.isArray(json.results)) {
        const map = {};
        json.results.forEach(r => { if (r && r.asset) map[r.asset] = !!r.ok; });
        setCryptos(prev => prev.map(c => ({ ...c, active: map[c.symbol] !== undefined ? map[c.symbol] : c.active })));
      } else {
        // just optimistically mark selected as active
        setCryptos(prev => prev.map(c => (selection.has(c.symbol) ? { ...c, active: true } : c)));
      }
      setSelection(new Set());
    } catch (e) {
      console.error('Activation error', e);
      setMessage({ type: 'error', text: e.message || 'Activation failed' });
    } finally {
      setActivating(false);
    }
  };

  return (
    <div style={{ padding: 16, background: '#111', borderRadius: 8, color: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Cryptocurrency Management</h3>
      <p style={{ color: '#aaa' }}>Enable or view which crypto assets are active for your HoodPay business. Activation calls the provider and requires an admin session.</p>

      {message && (
        <div style={{ padding: 8, marginBottom: 12, borderRadius: 6, background: message.type === 'error' ? '#2b0f0f' : '#0f2b12', color: message.type === 'error' ? '#ff6b35' : '#8ee5a1' }}>{message.text}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {loading && <div style={{ color: '#888' }}>Loading...</div>}
        {!loading && cryptos.length === 0 && <div style={{ color: '#888' }}>No cryptos available</div>}
        {cryptos.map(c => (
          <div key={c.symbol} style={{ padding: 12, borderRadius: 8, background: '#222', border: c.active ? '1px solid #1f6' : '1px solid #444' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.symbol}</div>
                <div style={{ fontSize: 12, color: '#bbb' }}>{c.name || ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontSize: 12, color: c.active ? '#8ee5a1' : '#ccc' }}>{c.active ? 'Active' : 'Inactive'}</div>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                  <input type="checkbox" checked={selection.has(c.symbol)} onChange={() => toggleSelect(c.symbol)} />
                  Select
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={activateSelected} disabled={activating} style={{ padding: '8px 12px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{activating ? 'Activating...' : 'Activate Selected'}</button>
        <button onClick={() => { setSelection(new Set()); setMessage(null); }} style={{ padding: '8px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Clear</button>
      </div>

    </div>
  );
}
