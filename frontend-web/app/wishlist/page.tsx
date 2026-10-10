'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { availBadge } from '../../components/ProductCard';

export default function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const loadWishlist = () => {
    setLoading(true);
    api('/wishlist')
      .then((r: any) => setItems(r.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const moveToCart = async (productId: string, name: string) => {
    try {
      await api('/cart/items', { method: 'POST', body: { productId, quantity: 1 } });
      setMsg(`Moved "${name}" to Cart! 🛒`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.message || 'Error moving to cart');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await api(`/wishlist/items/${productId}`, { method: 'DELETE' });
      loadWishlist();
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">FAVORITES & SAVED HARDWARE</span>
        <h1 style={{ fontSize: '26px' }}>My Wishlist ({items.length})</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Items you've bookmarked for later consideration or price alerts.
        </p>
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 16px',
            background: 'var(--accent-blush)',
            color: 'var(--primary)',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="muted">Loading saved items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: 12 }}>❤️</div>
          <h3>Your Wishlist is Empty</h3>
          <p className="muted">Tap the heart icon on any product card in the catalog to save it here.</p>
          <Link href="/">
            <button className="btn" style={{ marginTop: 12 }}>
              Explore Catalog
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((i: any) => {
            const b = availBadge(i.availability || 'IN_STOCK');
            return (
              <div key={i.productId} className="card pcard">
                <Link
                  href={`/product/${i.productId}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="pcard-img-wrap">
                    <img
                      src={i.thumbnail || `https://picsum.photos/seed/${i.productId}/600/400`}
                      alt={i.name}
                    />
                    <span
                      className="pcard-stock-tag"
                      style={{ background: b.bg, color: b.color }}
                    >
                      {b.text}
                    </span>
                  </div>
                  <h4 style={{ margin: '10px 0 4px' }}>{i.name}</h4>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {i.brand} · ★ {i.rating || 4.5}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary-dark)', margin: '8px 0' }}>
                    ${Number(i.price).toFixed(2)}
                  </div>
                </Link>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
                  <button
                    className="btn"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                    onClick={() => moveToCart(i.productId, i.name)}
                    disabled={i.availability === 'OUT_OF_STOCK'}
                  >
                    Move to Cart 🛒
                  </button>
                  <button
                    className="btn plain"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                    onClick={() => removeItem(i.productId)}
                    title="Remove from wishlist"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
