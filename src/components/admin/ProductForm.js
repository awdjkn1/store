import React, { useState } from 'react';
import axios from 'axios';

const ProductForm = ({ token, onProductCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [legoPieces, setLegoPieces] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/admin/products', {
        name,
        description,
        price_shipping_included: price,
        lego_pieces: legoPieces
      }, {
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      setName(''); setDescription(''); setPrice(''); setLegoPieces('');
      onProductCreated && onProductCreated();
    } catch (err) {
      setError('Failed to create product');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" min="0" required />
      <input value={legoPieces} onChange={e => setLegoPieces(e.target.value)} placeholder="Lego Pieces" type="number" min="0" required />
      <button type="submit">Create Product</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
};

export default ProductForm;
