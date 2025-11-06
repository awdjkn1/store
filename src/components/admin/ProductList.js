
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

          // Cursor-based pagination: fetch small batches and allow "Load more".
          const [nextCursor, setNextCursor] = useState(null);
          const [limit, setLimit] = useState(50);
          const [loadingMore, setLoadingMore] = useState(false);
          const fetchPage = async (cursor = null) => {
            if (cursor) setLoadingMore(true); else setLoading(true);
            setError('');
            try {
              const url = `/api/admin/products?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
              const resp = await fetch(url, { credentials: 'include' });
              const json = await resp.json().catch(() => ({}));
              const rows = json.products || [];
              if (cursor) {
                setProducts(prev => [...prev, ...rows]);
              } else {
                setProducts(rows);
              }
              const thumbMap = {};
              rows.forEach((r) => { if (r.images && r.images.length) thumbMap[r.id] = r.images[0]; });
              // merge thumbnails with existing
              setThumbnails(prev => ({ ...prev, ...thumbMap }));
              setNextCursor(json.next_cursor || null);
              setLoading(false);
              setLoadingMore(false);
            } catch (e) {
              console.error('Failed to fetch admin products', e);
              if (!cursor) setProducts([]);
              setThumbnails({});
              setError('Failed to load products.');
              setLoading(false);
              setLoadingMore(false);
            }
          };

          useEffect(() => {
            let mounted = true;
            // If initial products provided, use them (server-injected). Otherwise
            // fetch the first page from admin products endpoint.
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
              return () => { mounted = false; };
            }

            fetchPage();

            return () => { mounted = false; };
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
                  <div key={p.id} style={{ background: 'var(--sb-surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)', padding: 20, display: 'flex', flexDirection: 'column', minHeight: 260, maxHeight: 260, height: 260, justifyContent: 'space-between', alignItems: 'center' }}>
                    {thumbnails[p.id] ? (
                      <img src={thumbnails[p.id]} alt={p.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12, background: 'var(--sb-surface)' }} />
                    ) : (
                      <div style={{ width: 120, height: 120, borderRadius: 8, background: 'var(--sb-surface)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sb-muted)', fontSize: 40 }}>?</div>
                    )}
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--sb-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{p.name}</div>
                      <div style={{ fontWeight: 700, color: 'var(--sb-accent)', fontSize: 20 }}>${p.price_shipping_included}</div>
                    </div>
                    <div style={{ color: 'var(--sb-muted)', fontSize: 15, marginBottom: 12 }}>Pieces: {p.lego_pieces}</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <button onClick={() => setSelectedProduct(p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-accent)', color: 'var(--sb-accent-on)', cursor: 'pointer' }}>Images</button>
                      <button onClick={() => handleEdit(p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-cta-surface)', color: 'var(--sb-cta-text)', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-border)', color: 'var(--sb-text)', cursor: 'pointer' }}>Delete</button>
                    </div>
                    {selectedProduct && selectedProduct.id === p.id && (
                      <div style={{ marginTop: 10, background: 'var(--sb-bg)', borderRadius: 8, padding: 12 }}>
                        <ProductImageManager token={token} productId={selectedProduct.id} />
                        <button style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-border)', color: 'var(--sb-text)', cursor: 'pointer' }} onClick={() => setSelectedProduct(null)}>Close</button>
                      </div>
                    )}
                    {editProduct && editProduct.id === p.id && (
                      <form onSubmit={handleEditSubmit} style={{ marginTop: 12, background: 'var(--sb-bg)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input value={editFields.name} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} placeholder="Name" required style={{ padding: 8, borderRadius: 6, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
                        <input value={editFields.price} onChange={e => setEditFields(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
                        <input value={editFields.legoPieces} onChange={e => setEditFields(f => ({ ...f, legoPieces: e.target.value }))} placeholder="Lego Pieces" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-accent)', color: 'var(--sb-accent-on)', cursor: 'pointer' }}>Save</button>
                          <button type="button" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-border)', color: 'var(--sb-text)', cursor: 'pointer' }} onClick={() => setEditProduct(null)}>Cancel</button>
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
              {error && <div style={{ color: 'var(--sb-error)', padding: 12, background: 'var(--sb-bg)', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
              {loading && <div style={{ padding: 12, color: 'var(--sb-muted)' }}>Loading products…</div>}
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--sb-surface)', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--sb-bg)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--sb-muted)' }}>#</th>
                    <th style={{ padding: '12px 16px', color: 'var(--sb-muted)' }}>Product</th>
                    <th style={{ padding: '12px 16px', color: 'var(--sb-muted)' }}>Price</th>
                    <th style={{ padding: '12px 16px', color: 'var(--sb-muted)' }}>Pieces</th>
                    <th style={{ padding: '12px 16px', color: 'var(--sb-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <React.Fragment key={p.id}>
                      <tr style={{ borderBottom: '1px solid var(--sb-border)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: 'var(--sb-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          {thumbnails[p.id] ? (
                            <img src={thumbnails[p.id]} alt={p.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, background: 'var(--sb-surface)' }} />
                          ) : (
                            <div style={{ width: 80, height: 80, borderRadius: 6, background: 'var(--sb-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sb-muted)' }}>?</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--sb-text)' }}>{p.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: 'var(--sb-muted)' }}>${p.price_shipping_included}</td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: 'var(--sb-muted)' }}>{p.lego_pieces}</td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setSelectedProduct(selectedProduct && selectedProduct.id === p.id ? null : p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-accent)', color: 'var(--sb-accent-on)', cursor: 'pointer' }}>Images</button>
                            <button onClick={() => handleEdit(p)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-cta-surface)', color: 'var(--sb-cta-text)', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => handleDelete(p.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-border)', color: 'var(--sb-text)', cursor: 'pointer' }}>Delete</button>
                          </div>
                        </td>
                      </tr>

                      {selectedProduct && selectedProduct.id === p.id && (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, background: 'var(--sb-bg)' }}>
                            <ProductImageManager token={token} productId={selectedProduct.id} />
                          </td>
                        </tr>
                      )}

                      {editProduct && editProduct.id === p.id && (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, background: 'var(--sb-bg)' }}>
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input value={editFields.name} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} placeholder="Name" required style={{ padding: 8, borderRadius: 6, border: '1px solid var(--sb-border)', minWidth: 200, background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
                              <input value={editFields.price} onChange={e => setEditFields(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid var(--sb-border)', width: 120, background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
                              <input value={editFields.legoPieces} onChange={e => setEditFields(f => ({ ...f, legoPieces: e.target.value }))} placeholder="Lego Pieces" type="number" min="0" required style={{ padding: 8, borderRadius: 6, border: '1px solid var(--sb-border)', width: 140, background: 'var(--sb-surface)', color: 'var(--sb-text)' }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-accent)', color: 'var(--sb-accent-on)', cursor: 'pointer' }}>Save</button>
                                <button type="button" onClick={() => setEditProduct(null)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--sb-border)', color: 'var(--sb-text)', cursor: 'pointer' }}>Cancel</button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {(!loading && products.length === 0 && !error) && <div style={{ padding: 18, color: 'var(--sb-muted)' }}>No products found.</div>}
              {/* Load more (cursor-based) */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                {nextCursor ? (
                  <button onClick={() => fetchPage(nextCursor)} disabled={loadingMore} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--sb-accent)', color: 'var(--sb-accent-on)', cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                ) : (
                  products.length > 0 && <div style={{ color: 'var(--sb-muted)' }}>End of list</div>
                )}
              </div>
            </div>
          );
        };

        export default ProductList;
