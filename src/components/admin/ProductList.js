
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductImageManager from './ProductImageManager';

const ProductList = ({ token, cardView }) => {
  const [products, setProducts] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editFields, setEditFields] = useState({ name: '', description: '', price: '', legoPieces: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/admin/products', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        setProducts(res.data.products || []);
        // Fetch thumbnails for each product
        const thumbMap = {};
        await Promise.all((res.data.products || []).map(async (p) => {
          try {
            const imgRes = await axios.get(`/api/admin/products/${p.id}/images`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            if (imgRes.data.images && imgRes.data.images.length > 0) {
              thumbMap[p.id] = imgRes.data.images[0];
            }
          } catch {}
        }));
        setThumbnails(thumbMap);
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
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
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
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      setProducts(products.map(p => p.id === editProduct.id ? { ...p, ...editFields, price_shipping_included: editFields.price, lego_pieces: editFields.legoPieces } : p));
      setEditProduct(null);
    } catch {
      console.error('Failed to update product');
    }
  };

  if (cardView) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)', padding: 20, display: 'flex', flexDirection: 'column', minHeight: 260, maxHeight: 260, height: 260, justifyContent: 'space-between', alignItems: 'center' }}>
            {thumbnails[p.id] ? (
              <img src={thumbnails[p.id]} alt={p.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8, background: '#f0f0f0' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 8, background: '#f0f0f0', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 32 }}>?</div>
            )}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.name}</div>
              <div style={{ fontWeight: 600, color: '#2563eb', fontSize: 18 }}>${p.price_shipping_included}</div>
            </div>
            <div style={{ color: '#666', fontSize: 15, marginBottom: 12 }}>Pieces: {p.lego_pieces}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button onClick={() => setSelectedProduct(p)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ff9800', background: '#ff9800', color: 'white', cursor: 'pointer' }}>Images</button>
              <button onClick={() => handleEdit(p)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: 'white', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => handleDelete(p.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #888', background: '#eee', color: '#333', cursor: 'pointer' }}>Delete</button>
            </div>
            {selectedProduct && selectedProduct.id === p.id && (
              <div style={{ marginTop: 10, background: '#f5f7fa', borderRadius: 8, padding: 10 }}>
                <ProductImageManager token={token} productId={selectedProduct.id} />
                <button style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #888', background: '#eee', color: '#333', cursor: 'pointer' }} onClick={() => setSelectedProduct(null)}>Close</button>
              </div>
            )}
            {editProduct && editProduct.id === p.id && (
              <form onSubmit={handleEditSubmit} style={{ marginTop: 12, background: '#f9fafb', padding: 8, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={editFields.name} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} placeholder="Name" required style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                <input value={editFields.price} onChange={e => setEditFields(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" min="0" required style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                <input value={editFields.legoPieces} onChange={e => setEditFields(f => ({ ...f, legoPieces: e.target.value }))} placeholder="Lego Pieces" type="number" min="0" required style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: 'white', cursor: 'pointer' }}>Save</button>
                  <button type="button" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #888', background: '#eee', color: '#333', cursor: 'pointer' }} onClick={() => setEditProduct(null)}>Cancel</button>
                </div>
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
