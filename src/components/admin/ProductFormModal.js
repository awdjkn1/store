import React, { useState } from 'react';
// Product images are uploaded together during product creation

const ProductFormModal = ({ token, show, onClose, onProductCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [legoPieces, setLegoPieces] = useState('');
  const [error, setError] = useState('');
  // images are uploaded separately after product creation

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      try { (await import('../../utils/adminLogger')).default.log('admin_product_create_attempt', { name }); } catch (e) {}
      const payload = { name, description, price_shipping_included: Number(price), lego_pieces: Number(legoPieces) };
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const resp = await fetch('/api/admin/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = (data && data.error) || `${resp.status} ${resp.statusText}`;
        throw new Error(msg);
      }
      // Notify parent with created product
      onProductCreated && onProductCreated(data.product || null);
      try { (await import('../../utils/adminLogger')).default.log('admin_product_create_success', { name, productId: data && data.product && data.product.id }); } catch (e) {}
      onClose();
    } catch (err) {
      console.error('[Create Product Error]', err);
      try { (await import('../../utils/adminLogger')).default.log('admin_product_create_failed', { name, error: (err && err.message) || String(err) }); } catch (e) {}
      const message = err && err.message ? `Failed to create product: ${err.message}` : 'Failed to create product';
      setError(message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2000 }}>
      <div style={{ width: 'min(900px, 96%)', background: 'var(--sb-bg)', borderRadius: 12, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', color: 'var(--sb-text)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', color: 'var(--sb-muted)', fontSize: 28, cursor: 'pointer' }} aria-label="Close">×</button>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 6, color: 'var(--sb-accent)' }}>🧱 Create a New Product</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ color: 'var(--sb-muted)' }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" required style={{ padding: 10, borderRadius: 8, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ color: 'var(--sb-muted)' }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short Description" rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: 'var(--sb-muted)' }}>Price ($)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" min="0" step="0.01" inputMode="decimal" required style={{ padding: 10, borderRadius: 8, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
              </div>
              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: 'var(--sb-muted)' }}>Lego Pieces</label>
                <input value={legoPieces} onChange={e => setLegoPieces(e.target.value)} placeholder="Pieces" type="number" min="0" step="1" required style={{ padding: 10, borderRadius: 8, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
              </div>
            </div>
            <button type="submit" style={{ width: '100%', marginTop: 8, fontSize: 18, padding: '12px 16px', borderRadius: 10, border: 'none', background: 'var(--sb-accent)', color: 'var(--sb-accent-on)', fontWeight: 700, cursor: 'pointer' }}>
              Create Product
            </button>
            {error && <div style={{ color: 'var(--sb-error)', marginTop: 10, textAlign: 'center' }}>{error}</div>}
          </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
