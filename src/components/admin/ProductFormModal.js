import React, { useState } from 'react';
// Product images are uploaded together during product creation
import axios from 'axios';

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

        await axios.post('/api/admin/products', formData, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'multipart/form-data' }
        });
  setFiles([]);
      onProductCreated && onProductCreated();
      onClose();
    } catch (err) {
      console.error('[Create Product Error]', err);
      let message = 'Failed to create product';
      if (err.response && err.response.data && err.response.data.error) message += `: ${err.response.data.error}`;
      setError(message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
          <form onSubmit={handleSubmit} className="modal-form product-form-attractive">
            <h2 style={{ textAlign: 'center', marginBottom: 20 }}>🧱 Create a New Product</h2>
            <div className="form-group">
              <label>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" required className="input-attractive" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short Description" rows={3} className="input-attractive" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price ($)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" min="0" required className="input-attractive" />
              </div>
              <div className="form-group">
                <label>Lego Pieces</label>
                <input value={legoPieces} onChange={e => setLegoPieces(e.target.value)} placeholder="Pieces" type="number" min="0" required className="input-attractive" />
              </div>
            </div>
            <div className="form-group">
              <label>Product Images</label>
              <input type="file" multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files))} className="input-attractive" />
              {files.length > 0 && <div style={{ marginTop: 8, fontSize: 13 }}>{files.length} file(s) selected</div>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20, fontSize: 18 }}>
              Create Product & Upload Images
            </button>
            {error && <div style={{ color: '#e74c3c', marginTop: 10, textAlign: 'center' }}>{error}</div>}
          </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
