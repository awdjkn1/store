import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductImageManager from './ProductImageManager';

const ProductList = ({ token, cardView }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editFields, setEditFields] = useState({ name: '', description: '', price: '', legoPieces: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/admin/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to fetch products');
      }
    };
    fetchProducts();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p.id !== id));
      if (selectedProduct && selectedProduct.id === id) setSelectedProduct(null);
    } catch {
      console.error('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setEditFields({
      name: product.name,
      description: product.description,
      price: product.price_shipping_included,
      legoPieces: product.lego_pieces
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/products/${editProduct.id}`, {
        name: editFields.name,
        description: editFields.description,
        price_shipping_included: editFields.price,
        lego_pieces: editFields.legoPieces
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.map(p => p.id === editProduct.id ? { ...p, ...editFields, price_shipping_included: editFields.price, lego_pieces: editFields.legoPieces } : p));
      setEditProduct(null);
    } catch {
      console.error('Failed to update product');
    }
  };

  if (cardView) {
    return (
      <div className="product-card-grid">
        {products.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-card-header">
              <div className="product-card-title">{p.name}</div>
              <div className="product-card-price">${p.price_shipping_included}</div>
            </div>
            <div className="product-card-body">
              <div className="product-card-desc">{p.description}</div>
              <div className="product-card-pieces">Pieces: {p.lego_pieces}</div>
            </div>
            <div className="product-card-actions">
              <button onClick={() => setSelectedProduct(p)} className="btn btn-orange">Images</button>
              <button onClick={() => handleEdit(p)} className="btn">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="btn btn-grey">Delete</button>
            </div>
            {selectedProduct && selectedProduct.id === p.id && (
              <div className="product-card-image-manager">
                <ProductImageManager token={token} productId={selectedProduct.id} />
                <button className="btn" onClick={() => setSelectedProduct(null)}>Close</button>
              </div>
            )}
            {editProduct && editProduct.id === p.id && (
              <form className="edit-form" onSubmit={handleEditSubmit} style={{ marginTop: 12, background: '#f9fafb', padding: 8, borderRadius: 8 }}>
                <input value={editFields.name} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} placeholder="Name" required />
                <input value={editFields.description} onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                <input value={editFields.price} onChange={e => setEditFields(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" min="0" required />
                <input value={editFields.legoPieces} onChange={e => setEditFields(f => ({ ...f, legoPieces: e.target.value }))} placeholder="Lego Pieces" type="number" min="0" required />
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn" onClick={() => setEditProduct(null)} style={{ marginLeft: 8 }}>Cancel</button>
              </form>
            )}
          </div>
        ))}
      </div>
    );
  }
  // ...existing code...
};

export default ProductList;
