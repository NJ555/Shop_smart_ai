'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    setLoading(true);
    api('/cart')
      .then(setCart)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p className="muted">Loading cart items...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">SHOPPING CART & RESERVATIONS</span>
        <h1 style={{ fontSize: '26px' }}>My Cart ({cart?.count || 0})</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Real-time inventory validation, quantity controls, and price calculation.
        </p>
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: 12 }}>🛒</div>
          <h3>Your Cart is Currently Empty</h3>
          <p className="muted">Add laptops, smartphones, or accessories to experience the checkout flow.</p>
          <Link href="/">
            <button className="btn" style={{ marginTop: 12 }}>
              Explore Catalog (52 items)
            </button>
          </Link>
        </div>
      ) : (
        <div className="card glow">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'center' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((i: any) => (
                <tr key={i.itemId}>
                  <td>
                    <Link
                      href={`/product/${i.product.productId}`}
                      style={{ fontWeight: 800, color: 'var(--ink)', textDecoration: 'none' }}
                    >
                      {i.product.name}
                    </Link>
                    <div className="muted" style={{ fontSize: '12px', marginTop: 2 }}>
                      ${i.product.price} · {i.product.brand} ·{' '}
                      <span
                        className={`badge ${
                          i.product.availability === 'IN_STOCK' ? 'b-green' : 'b-amber'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {i.product.availability}
                      </span>
                    </div>
                    {i.warnings?.map((w: string) => (
                      <div
                        key={w}
                        style={{
                          fontSize: '11px',
                          color: 'var(--bad)',
                          background: 'var(--bad-bg)',
                          padding: '3px 6px',
                          borderRadius: 4,
                          marginTop: 4,
                          display: 'inline-block',
                        }}
                      >
                        ⚠️ {w}
                      </div>
                    ))}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      className="input"
                      style={{ width: '70px', textAlign: 'center', padding: '6px' }}
                      type="number"
                      min={1}
                      max={99}
                      value={i.quantity}
                      onChange={async (e) => {
                        const val = parseInt(e.target.value) || 1;
                        await api(`/cart/items/${i.itemId}`, {
                          method: 'PUT',
                          body: { quantity: val },
                        });
                        loadCart();
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '15px' }}>
                    ${Number(i.lineTotal).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn plain"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      onClick={async () => {
                        await api(`/cart/items/${i.itemId}`, { method: 'DELETE' });
                        loadCart();
                      }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--line)',
            }}
          >
            <div>
              <button
                className="btn plain"
                style={{ fontSize: '12px' }}
                onClick={async () => {
                  if (confirm('Clear all items from your cart?')) {
                    await api('/cart', { method: 'DELETE' });
                    loadCart();
                  }
                }}
              >
                Clear Cart
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <span className="muted" style={{ fontSize: '12px' }}>Subtotal:</span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary-dark)' }}>
                  ${Number(cart.subtotal).toFixed(2)}
                </div>
              </div>

              <Link href="/checkout">
                <button className="btn" style={{ padding: '12px 28px', fontSize: '15px' }}>
                  Proceed to Checkout →
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
