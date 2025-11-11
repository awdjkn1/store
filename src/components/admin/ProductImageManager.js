/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.897Z */
import React, { useState } from 'react';

const ProductImageManager = ({ token, productId, productName }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setError('');
    let uploadErrors = [];
    for (const file of files) {
  const formData = new FormData();
  // Use 'images' field name to match the centralized admin upload handler (supports multiple files)
  formData.append('images', file);
      try {
        // Use fetch to let the browser/node set the multipart boundary for Content-Type
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(`/api/admin/products/${productId}/upload-image`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include'
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          throw new Error((errBody && errBody.error) || `${resp.status} ${resp.statusText}`);
        }
      } catch (err) {
        let errorMsg = `Failed to upload ${file.name}`;
        if (err.response) {
          errorMsg += `: ${err.response.data.error || err.response.statusText}`;
          if (err.response.data.details) {
            errorMsg += ` (${err.response.data.details})`;
          }
        } else if (err.message) {
          errorMsg += `: ${err.message}`;
        }
        uploadErrors.push(errorMsg);
        console.error('[Image Upload Error]', err);
      }
    }
    setFiles([]);
    setError(uploadErrors.join('\n'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', borderRadius: 12, padding: 18, boxShadow: '0 0.125rem 0.5rem #e0e7ef' }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: '#2563eb', marginBottom: 8 }}>Manage Product Images</div>
      <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ padding: 8, borderRadius: 6, border: '0.0625rem solid #2563eb', background: '#fff' }} />
      {files.length > 0 && (
        <div style={{ margin: '0.5rem 0', fontSize: 14, color: '#333' }}>
          <strong>Selected:</strong> {files.map(f => f.name).join(', ')}
        </div>
      )}
      <button onClick={handleUpload} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>Upload All</button>
      {error && <div style={{ color: 'red', whiteSpace: 'pre-line', marginTop: 8 }}>{error}</div>}
    </div>
  );
};

export default ProductImageManager;
