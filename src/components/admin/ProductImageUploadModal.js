import React, { useState, useEffect } from 'react';

// Lightweight modal component to upload images for an existing product
const ProductImageUploadModal = ({ show, product, onClose, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) {
      setFiles([]); setUploading(false); setProgress(0); setError('');
    }
  }, [show]);

  if (!show || !product) return null;

  const handleFiles = (e) => {
    setError('');
    const arr = Array.from(e.target.files || []).slice(0, 20);
    setFiles(arr);
  };

  const handleUpload = () => {
    if (!files.length) return setError('No files selected');
    setUploading(true); setProgress(0); setError('');

    const fd = new FormData();
    files.forEach(f => fd.append('images', f));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/products/${product.id}/upload-image`, true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100));
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          const imgs = json.images || [];
          onUploadSuccess && onUploadSuccess(imgs);
        } catch (e) {
          setError('Upload succeeded but response parsing failed');
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try { const j = JSON.parse(xhr.responseText || '{}'); msg = j.error || j.message || msg; } catch (e) {}
        setError(msg);
      }
    };

    xhr.onerror = () => { setUploading(false); setError('Network error during upload'); };
    xhr.send(fd);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2000 }}>
      <div style={{ width: 'min(720px, 96%)', background: '#0f1724', borderRadius: 12, padding: 20, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{`Upload images for: ${product.name || product.id}`}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#999', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </div>
        {files.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {files.map((f, i) => (
              <div key={i} style={{ width: 84, height: 84, borderRadius: 8, overflow: 'hidden', background: '#071022', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={handleUpload} disabled={uploading || !files.length} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>{uploading ? `Uploading (${progress}%)` : 'Upload'}</button>
          <button onClick={() => { setFiles([]); setError(''); }} disabled={uploading} style={{ padding: '8px 12px', borderRadius: 8 }}>Clear</button>
          <button onClick={() => { onClose && onClose(); }} style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 8 }}>Close</button>
        </div>
        {error && <div style={{ color: '#fca5a5', marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
};

export default ProductImageUploadModal;
