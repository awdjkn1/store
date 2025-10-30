import React, { useState } from 'react';
// Product images are uploaded together during product creation

const ProductFormModal = ({ token, show, onClose, onProductCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [legoPieces, setLegoPieces] = useState('');
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Always send as multipart/form-data so images (if any) are uploaded together
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price_shipping_included', price);
      formData.append('lego_pieces', legoPieces);
      files.forEach((f) => formData.append('images', f));

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await fetch('/api/admin/products', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = (data && data.error) || `${resp.status} ${resp.statusText}`;
        throw new Error(msg);
      }

      setFiles([]);
      onProductCreated && onProductCreated();
      onClose();
    } catch (err) {
      console.error('[Create Product Error]', err);
      const message = err && err.message ? `Failed to create product: ${err.message}` : 'Failed to create product';
      setError(message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2000 }}>
      <div style={{ width: 'min(900px, 96%)', background: '#0f1724', borderRadius: 12, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', color: '#fff', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 28, cursor: 'pointer' }} aria-label="Close">×</button>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 6, color: '#ff6b35' }}>🧱 Create a New Product</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ color: '#cbd5e1' }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" required style={{ padding: 10, borderRadius: 8, border: '1px solid #222', background: '#0b1220', color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ color: '#cbd5e1' }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short Description" rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #222', background: '#0b1220', color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: '#cbd5e1' }}>Price ($)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" min="0" step="0.01" inputMode="decimal" required style={{ padding: 10, borderRadius: 8, border: '1px solid #222', background: '#0b1220', color: '#fff' }} />
              </div>
              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: '#cbd5e1' }}>Lego Pieces</label>
                <input value={legoPieces} onChange={e => setLegoPieces(e.target.value)} placeholder="Pieces" type="number" min="0" step="1" required style={{ padding: 10, borderRadius: 8, border: '1px solid #222', background: '#0b1220', color: '#fff' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ color: '#cbd5e1' }}>Product Images</label>
              <input type="file" multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files))} style={{ padding: 8, borderRadius: 8, border: '1px solid #222', background: '#0b1220', color: '#fff' }} />
              {files.length > 0 && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{files.length} file(s) selected</div>}
            </div>
            <button type="submit" style={{ width: '100%', marginTop: 8, fontSize: 18, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#ff6b35', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              Create Product & Upload Images
            </button>
            {error && <div style={{ color: '#fca5a5', marginTop: 10, textAlign: 'center' }}>{error}</div>}
          </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
