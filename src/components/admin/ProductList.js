
        import React, { useState, useEffect, useMemo } from 'react';
        import axios from 'axios';
        import ProductImageManager from './ProductImageManager';
        const ProductList = ({ initialProducts, token, cardView }) => {
          const [products, setProducts] = useState([]);
          const [thumbnails, setThumbnails] = useState({});
          const [loading, setLoading] = useState(false);
          const [error, setError] = useState('');
          const [selectedProduct, setSelectedProduct] = useState(null);
          const [editProduct, setEditProduct] = useState(null);
          const [editFields, setEditFields] = useState({ name: '', description: '', price: '', legoPieces: '' });



          const providedProducts = useMemo(() => (initialProducts || []), [initialProducts]);

          useEffect(() => {
            if (providedProducts && providedProducts.length > 0) {
              setProducts(providedProducts);
              const thumbMap = {};
              providedProducts.forEach((p) => {
                if (p.images && p.images.length > 0) {
                  thumbMap[p.id] = p.images[0];
                }
              });
              setThumbnails(thumbMap);
              setLoading(false);
              setError('');
              return;
            }
            setProducts([]);
            setThumbnails({});
            setLoading(false);
            setError('No products found.');
          }, [providedProducts]);

          const handleDelete = async (id) => {
            if (!window.confirm('Delete this product?')) return;
            try {
              // Log admin delete attempt (non-blocking)
              try { (await import('../../utils/adminLogger')).default.log('admin_product_delete_attempt', { productId: id }); } catch (e) {}

              const delUrl = `${window.location.origin}/api/admin/products/${id}`;
              await axios.delete(delUrl, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                withCredentials: true
              });
              setProducts(products.filter(p => p.id !== id));
              if (selectedProduct && selectedProduct.id === id) setSelectedProduct(null);
              try { (await import('../../utils/adminLogger')).default.log('admin_product_delete_success', { productId: id }); } catch (e) {}
            } catch (err) {
              console.error('Failed to delete product', err);
              try { (await import('../../utils/adminLogger')).default.log('admin_product_delete_failed', { productId: id, error: (err && err.message) || String(err) }); } catch (e) {}
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
              const putUrl = `${window.location.origin}/api/admin/products/${editProduct.id}`;
              await axios.put(putUrl, {
                name: editFields.name,
                description: editFields.description,
                price_shipping_included: Number(editFields.price),
                lego_pieces: Number(editFields.legoPieces)
              }, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                withCredentials: true
              });
              setProducts(products.map(p => p.id === editProduct.id ? { ...p, name: editFields.name, description: editFields.description, price_shipping_included: Number(editFields.price), lego_pieces: Number(editFields.legoPieces) } : p));
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
                      <img src={thumbnails[p.id]} alt={p.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12, background: '#2d2d2d' }} />
                    ) : (
                      <div style={{ width: 120, height: 120, borderRadius: 8, background: '#2d2d2d', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 40 }}>?</div>
                    )}
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 20, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{p.name}</div>
                      <div style={{ fontWeight: 700, color: '#ff6b35', fontSize: 20 }}>${p.price_shipping_included}</div>
                    </div>
                    <div style={{ color: '#bbb', fontSize: 15, marginBottom: 12 }}>Pieces: {p.lego_pieces}</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <button onClick={() => setSelectedProduct(p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ff6b35', color: '#fff', cursor: 'pointer' }}>Images</button>
                      <button onClick={() => handleEdit(p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>Delete</button>
                    </div>
                    {selectedProduct && selectedProduct.id === p.id && (
                      <div style={{ marginTop: 10, background: '#111', borderRadius: 8, padding: 12 }}>
                        <ProductImageManager token={token} productId={selectedProduct.id} />
                        <button style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }} onClick={() => setSelectedProduct(null)}>Close</button>
                      </div>
                    )}
                    {editProduct && editProduct.id === p.id && (
                      <form onSubmit={handleEditSubmit} style={{ marginTop: 12, background: '#111', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input value={editFields.name} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} placeholder="Name" required style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }} />
                        <input value={editFields.price} onChange={e => setEditFields(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }} />
                        <input value={editFields.legoPieces} onChange={e => setEditFields(f => ({ ...f, legoPieces: e.target.value }))} placeholder="Lego Pieces" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>Save</button>
                          <button type="button" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }} onClick={() => setEditProduct(null)}>Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            );
          }
          // List / table view with dark theme to match site
          return (
            <div style={{ overflowX: 'auto' }}>
              {error && <div style={{ color: '#fca5a5', padding: 12, background: '#2a1a1a', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
              {loading && <div style={{ padding: 12, color: '#ccc' }}>Loading products…</div>}
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#0f1724' }}>
                    <th style={{ padding: '12px 16px', color: '#9ca3af' }}>#</th>
                    <th style={{ padding: '12px 16px', color: '#9ca3af' }}>Product</th>
                    <th style={{ padding: '12px 16px', color: '#9ca3af' }}>Price</th>
                    <th style={{ padding: '12px 16px', color: '#9ca3af' }}>Pieces</th>
                    <th style={{ padding: '12px 16px', color: '#9ca3af' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <React.Fragment key={p.id}>
                      <tr style={{ borderBottom: '1px solid #111' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#cbd5e1' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          {thumbnails[p.id] ? (
                            <img src={thumbnails[p.id]} alt={p.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, background: '#222' }} />
                          ) : (
                            <div style={{ width: 80, height: 80, borderRadius: 6, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>?</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{p.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#cbd5e1' }}>${p.price_shipping_included}</td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#cbd5e1' }}>{p.lego_pieces}</td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setSelectedProduct(selectedProduct && selectedProduct.id === p.id ? null : p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ff6b35', color: '#fff', cursor: 'pointer' }}>Images</button>
                            <button onClick={() => handleEdit(p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => handleDelete(p.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>Delete</button>
                          </div>
                        </td>
                      </tr>

                      {selectedProduct && selectedProduct.id === p.id && (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, background: '#0b1220' }}>
                            <ProductImageManager token={token} productId={selectedProduct.id} />
                          </td>
                        </tr>
                      )}

                      {editProduct && editProduct.id === p.id && (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, background: '#0b1220' }}>
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input value={editFields.name} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} placeholder="Name" required style={{ padding: 8, borderRadius: 6, border: '1px solid #333', minWidth: 200, background: '#111', color: '#fff' }} />
                              <input value={editFields.price} onChange={e => setEditFields(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid #333', width: 120, background: '#111', color: '#fff' }} />
                              <input value={editFields.legoPieces} onChange={e => setEditFields(f => ({ ...f, legoPieces: e.target.value }))} placeholder="Lego Pieces" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid #333', width: 140, background: '#111', color: '#fff' }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>Save</button>
                                <button type="button" onClick={() => setEditProduct(null)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {(!loading && products.length === 0 && !error) && <div style={{ padding: 18, color: '#666' }}>No products found.</div>}
            </div>
          );
        };

        export default ProductList;
