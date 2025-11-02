import React, { useState, useEffect } from 'react';

const ProductImageManager = ({ token, productId, productName, onUploaded }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  useEffect(() => {
    // generate object URLs for previews
    if (files && files.length) {
      const urls = files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
      setPreviews(urls);
      return () => {
        urls.forEach(u => URL.revokeObjectURL(u.url));
      };
    }
    setPreviews([]);
    return undefined;
  }, [files]);

  const handleFileChange = (e) => {
    setError('');
    const chosen = Array.from(e.target.files || []).slice(0, 20);
    setFiles(chosen);
  };

  const handleUpload = () => {
    if (!files.length) return setError('No files selected');
    setError('');
    setUploading(true);
    setProgress(0);
    setUploadedUrls([]);

    const fd = new FormData();
    files.forEach(f => fd.append('images', f));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/products/${productId}/upload-image`, true);
    xhr.withCredentials = true;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = async () => {
      setUploading(false);
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const json = JSON.parse(xhr.responseText || '{}');
          const imgs = json.images || [];
          setUploadedUrls(imgs);
          setFiles([]);
          setPreviews([]);
          onUploaded && onUploaded(imgs);
        } else {
          let msg = `Upload failed: ${xhr.status}`;
          try { const j = JSON.parse(xhr.responseText || '{}'); msg = j.error || j.message || msg; } catch (e) {}
          setError(msg);
        }
      } catch (err) {
        setError('Failed to parse upload response');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Network error during upload');
    };

    xhr.send(fd);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px #e0e7ef' }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: '#2563eb', marginBottom: 8 }}>Manage Product Images</div>
      {productName && <div style={{ color: '#374151', fontSize: 14 }}><strong>{productName}</strong></div>}

      <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #2563eb', background: '#fff' }} />

      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {previews.map((p, i) => (
            <div key={i} style={{ width: 96, height: 96, position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
              <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleUpload} disabled={uploading || !files.length} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: uploading || !files.length ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 16 }}>{uploading ? `Uploading (${progress}%)` : 'Upload All'}</button>
        <button onClick={() => { setFiles([]); setPreviews([]); setError(''); }} disabled={uploading} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}>Clear</button>
      </div>

      {progress > 0 && uploading && <div style={{ height: 8, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: '#2563eb' }} /></div>}

      {error && <div style={{ color: 'red', whiteSpace: 'pre-line', marginTop: 8 }}>{error}</div>}

      {uploadedUrls.length > 0 && (
        <div>
          <div style={{ marginBottom: 6, color: '#374151' }}>Uploaded</div>
          <ul style={{ maxHeight: 160, overflow: 'auto', padding: 8, background: '#fff', borderRadius: 8 }}>
            {uploadedUrls.map((u, i) => <li key={i}><a href={u} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{u}</a></li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProductImageManager;
