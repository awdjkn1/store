import React, { useState } from 'react';
// Product images are uploaded together during product creation

const ProductFormModal = ({ token, show, onClose, onProductCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [legoPieces, setLegoPieces] = useState('');
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  // images will be uploaded after product creation if provided

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
      const created = data.product || null;
      // If images were selected, upload them to the product upload endpoint
      if (created && files && files.length) {
        try {
          setUploading(true);
          const form = new FormData();
          for (let i = 0; i < files.length; i++) form.append('images', files[i]);
          const uploadResp = await fetch(`/api/admin/products/${created.id}/upload-image`, {
            method: 'POST',
            body: form,
            credentials: 'include'
          });
          const uploadJson = await uploadResp.json().catch(() => ({}));
          if (!uploadResp.ok) {
            console.warn('Image upload returned error', uploadJson);
          } else if (uploadJson && uploadJson.images) {
            // Attach images array to created product for immediate UI update
            created.images = uploadJson.images;
          }
        } catch (imgErr) {
          console.error('Image upload failed', imgErr);
        } finally {
          setUploading(false);
        }
      }
      onProductCreated && onProductCreated(created);
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
              <label style={{ color: '#cbd5e1' }}>Images (optional)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                style={{ padding: 6, borderRadius: 8, border: '1px solid #222', background: '#0b1220', color: '#fff' }}
              />
              <small style={{ color: '#9ca3af' }}>{files.length ? `${files.length} file(s) selected` : 'You can upload up to 10 images.'}</small>
            </div>
            <button type="submit" disabled={uploading} style={{ width: '100%', marginTop: 8, fontSize: 18, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#ff6b35', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? 'Creating product & uploading images…' : 'Create Product'}
            </button>
            {error && <div style={{ color: '#fca5a5', marginTop: 10, textAlign: 'center' }}>{error}</div>}
          </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
