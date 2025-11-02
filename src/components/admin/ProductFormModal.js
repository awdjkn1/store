import React, { useState, useEffect } from 'react';

// Two-step flow:
// 1) Create product (JSON POST to /api/admin/products)
// 2) Upload images (multipart POST to /api/admin/products/:id/upload-image)

const ProductFormModal = ({ token, show, onClose, onProductCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [legoPieces, setLegoPieces] = useState('');
  const [error, setError] = useState('');

  // After creation
  const [createdProduct, setCreatedProduct] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState([]);

  useEffect(() => {
    if (!show) {
      // reset state when modal is closed
      setName(''); setDescription(''); setPrice(''); setLegoPieces(''); setError('');
      setCreatedProduct(null); setFiles([]); setUploading(false); setUploadProgress(0); setUploadError(''); setUploadedUrls([]);
    }
  }, [show]);

  if (!show) return null;

  const handleCreate = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setError('');

    // Auto-detect: if files are selected, submit multipart in a single step
    if (files && files.length) {
      setUploading(true); setUploadProgress(0); setUploadError(''); setUploadedUrls([]);
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', description || '');
      fd.append('price_shipping_included', String(Number(price)));
      fd.append('lego_pieces', String(Number(legoPieces)));
      files.forEach(f => fd.append('images', f));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/products', true);
      xhr.withCredentials = true;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
      };

      xhr.onload = () => {
        setUploading(false);
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText || '{}');
            const product = json.product || null;
            const imgs = json.images || [];
            setCreatedProduct(product);
            setUploadedUrls(imgs);
            setFiles([]);
            // Inform parent and keep modal open so admin can review uploaded URLs
            onProductCreated && onProductCreated(product);
          } else {
            let msg = `Create+upload failed: ${xhr.status}`;
            try { const j = JSON.parse(xhr.responseText || '{}'); msg = j.error || j.message || msg; } catch (e) {}
            setError(msg);
          }
        } catch (err) {
          setError('Failed to parse server response');
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setError('Network error during create+upload');
      };

      xhr.send(fd);
      return;
    }

    // No files: regular JSON creation
    try {
      const payload = { name, description, price_shipping_included: Number(price), lego_pieces: Number(legoPieces) };
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const resp = await fetch('/api/admin/products', { method: 'POST', headers, body: JSON.stringify(payload), credentials: 'include' });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = (data && (data.error || data.message)) || `${resp.status} ${resp.statusText}`;
        throw new Error(msg);
      }
      const product = data.product || null;
      setCreatedProduct(product);
      // Let parent refresh lists if needed
      onProductCreated && onProductCreated(product);
    } catch (err) {
      console.error('[Create Product Error]', err);
      const message = err && err.message ? `Failed to create product: ${err.message}` : 'Failed to create product';
      setError(message);
    }
  };

  const handleFiles = (e) => {
    setUploadError('');
    const f = Array.from(e.target.files || []);
    setFiles(f.slice(0, 10));
  };

  // Use XMLHttpRequest to track upload progress
  const handleUploadImages = () => {
    if (!createdProduct || !createdProduct.id) return setUploadError('No product to upload images for');
    if (!files.length) return setUploadError('No images selected');
    setUploading(true); setUploadProgress(0); setUploadError(''); setUploadedUrls([]);

    const fd = new FormData();
    files.forEach(f => fd.append('images', f));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/products/${createdProduct.id}/upload-image`, true);
    xhr.withCredentials = true;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setUploadProgress(pct);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          const imgs = json.images || [];
          setUploadedUrls(imgs);
          // Inform parent that product (with images) is ready
          onProductCreated && onProductCreated(createdProduct);
        } catch (e) {
          setUploadError('Upload succeeded but response could not be parsed');
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try {
          const j = JSON.parse(xhr.responseText || '{}');
          msg = j.error || j.message || msg;
        } catch (e) {}
        setUploadError(msg);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setUploadError('Network error during upload');
    };

    xhr.send(fd);
  };

  const handleClose = () => {
    onClose && onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2000 }}>
      <div style={{ width: 'min(900px, 96%)', background: '#0f1724', borderRadius: 12, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', color: '#fff', position: 'relative' }}>
        <button onClick={handleClose} style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 28, cursor: 'pointer' }} aria-label="Close">×</button>

        {!createdProduct ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <button type="submit" style={{ width: '100%', marginTop: 8, fontSize: 18, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#ff6b35', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create Product</button>
            {error && <div style={{ color: '#fca5a5', marginTop: 10, textAlign: 'center' }}>{error}</div>}
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 6, color: '#ff6b35' }}>✅ Product created — upload images</h2>
            <div style={{ color: '#cbd5e1' }}><strong>{createdProduct.name}</strong></div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="file" accept="image/*" multiple onChange={handleFiles} />
              <button onClick={handleUploadImages} disabled={uploading || !files.length} style={{ padding: '8px 12px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: uploading || !files.length ? 'not-allowed' : 'pointer' }}>Upload Images</button>
              <button onClick={() => { onProductCreated && onProductCreated(createdProduct); handleClose(); }} style={{ padding: '8px 12px', borderRadius: 8, background: '#374151', color: '#fff', border: 'none' }}>Skip & Close</button>
            </div>

            {files.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ width: 96, height: 96, borderRadius: 6, overflow: 'hidden', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                    <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}

            {uploading && <div style={{ marginTop: 8 }}>Uploading… {uploadProgress}%</div>}
            {uploadError && <div style={{ color: '#fca5a5' }}>{uploadError}</div>}
            {uploadedUrls.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#cbd5e1', marginBottom: 6 }}>Uploaded URLs</div>
                <ul style={{ maxHeight: 160, overflow: 'auto', padding: 8, background: '#071022', borderRadius: 8 }}>
                  {uploadedUrls.map((u, i) => <li key={i}><a href={u} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>{u}</a></li>)}
                </ul>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => { onProductCreated && onProductCreated(createdProduct); handleClose(); }} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none' }}>Done</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductFormModal;
