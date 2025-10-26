import React, { useState } from 'react';
import ProductImageManager from './ProductImageManager';
import axios from 'axios';

const ProductFormModal = ({ token, show, onClose, onProductCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [legoPieces, setLegoPieces] = useState('');
  const [productId, setProductId] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/admin/products', {
        name,
        description,
        price_shipping_included: price,
        lego_pieces: legoPieces
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductId(res.data.product?.id || res.data.id);
      setStep(2);
      onProductCreated && onProductCreated();
    } catch (err) {
      setError('Failed to create product');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        {step === 1 ? (
          <form onSubmit={handleSubmit} className="modal-form">
            <h3>Create Product</h3>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" min="0" required />
            <input value={legoPieces} onChange={e => setLegoPieces(e.target.value)} placeholder="Lego Pieces" type="number" min="0" required />
            <button type="submit" className="btn btn-primary">Next: Upload Image</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </form>
        ) : (
          <div>
            <h3>Upload Product Image</h3>
            <ProductImageManager token={token} productId={productId} productName={name} />
            <button className="btn" onClick={onClose} style={{ marginTop: 12 }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFormModal;
