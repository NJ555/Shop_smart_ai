'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { availBadge, toggleCompare } from '../../../components/ProductCard';

export default function PDP({ params }: { params: { id: string } }) {
  const [p, setP] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(`/products/${params.id}`, { auth: false })
      .then(setP)
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="card" style={{ padding: 40, textAlign: 'center' }}>Loading product details...</div>;
  if (!p) return <div className="card" style={{ padding: 40, textAlign: 'center' }}>{msg || 'Product not found'}</div>;

  const badge = availBadge(p.availability);

  const addCart = async () => {
    try {
      await api('/cart/items', { method: 'POST', body: { productId: p.productId, quantity: qty } });
      setMsg(`Added ${qty} item(s) to Cart! 🛒`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.message || 'Error adding to cart');
    }
  };

  const addWish = async () => {
    try {
      await api('/wishlist/items', { method: 'POST', body: { productId: p.productId } });
      setMsg('Saved to Wishlist! ❤️');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.message || 'Error saving to wishlist');
    }
  };

  const handleCompare = () => {
    toggleCompare(p.productId);
    setMsg('Added to Compare matrix (max 4) ⇄');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" className="link" style={{ padding: 0 }}>
          ← Back to Catalog
        </Link>
      </div>

      <div className="card glow" style={{ padding: '28px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {/* IMAGE */}
          <div style={{ borderRadius: 20, overflow: 'hidden', background: '#F0E8EA', height: '360px', boxShadow: 'inset 2px 2px 6px #DECED2' }}>
            <img
              src={p.thumbnail || `https://picsum.photos/seed/${p.productId}/600/400`}
              alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* DETAILS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="pcard-brand">{p.brand}</span>
              <span className="badge" style={{ background: badge.bg, color: badge.color }}>
                {badge.text}
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px', color: 'var(--ink)' }}>
              {p.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <span style={{ color: '#F59E0B', fontSize: '16px' }}>★</span>
              <span style={{ fontWeight: 800 }}>{p.rating.toFixed(1)}</span>
              <span className="muted" style={{ fontSize: '12px' }}>
                · Category: {p.categoryName || p.category}
              </span>
            </div>

            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: 16 }}>
              ${Number(p.price).toFixed(2)}
            </div>

            <p style={{ fontSize: '14px', lineHeight: '22px', color: 'var(--muted)', marginBottom: 20 }}>
              {p.description}
            </p>

            {/* ACTION CONTROLS */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Qty:</label>
                <input
                  className="input"
                  style={{ width: '70px', textAlign: 'center', padding: '8px' }}
                  type="number"
                  min={1}
                  max={20}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                />
              </div>

              <button
                className="btn"
                style={{ padding: '12px 28px', fontSize: '14px' }}
                disabled={p.availability === 'OUT_OF_STOCK'}
                onClick={addCart}
              >
                {p.availability === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Add to Cart 🛒'}
              </button>

              <button className="btn ghost" onClick={addWish} title="Save to Wishlist">
                ❤️ Wishlist
              </button>

              <button className="btn plain" onClick={handleCompare} title="Compare">
                ⇄ Compare
              </button>
            </div>

            {msg && (
              <div
                style={{
                  marginTop: 14,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--accent-blush)',
                  padding: '8px 14px',
                  borderRadius: 10,
                  display: 'inline-block',
                }}
              >
                {msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SPECIFICATIONS TABLE */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Hardware & Technical Specifications</h3>
        <table className="table">
          <tbody>
            {Object.entries(p.attributes || {}).map(([k, v]: any) => (
              <tr key={k}>
                <td style={{ width: '220px', fontWeight: 800, color: 'var(--muted)' }}>{k}</td>
                <td style={{ fontWeight: 600 }}>{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
