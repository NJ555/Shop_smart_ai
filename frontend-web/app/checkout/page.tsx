'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, newIdemKey } from '../../lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [addr, setAddr] = useState({
    line1: '12 Main St, Suite 400',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'US',
  });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);

  useEffect(() => {
    api('/cart')
      .then(setCart)
      .catch((e) => setMsg(e.message));
  }, []);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.items?.length) return;
    setBusy(true);
    setMsg('');
    try {
      const res: any = await api('/orders', {
        method: 'POST',
        body: {
          cartId: cart.cartId,
          shippingAddress: addr,
          paymentMode: 'SIMULATED',
        },
        idempotencyKey: newIdemKey(),
      });
      setDone(res);
    } catch (e: any) {
      setMsg(e.message || 'Error processing order');
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="card glow" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '36px' }}>
        <div style={{ fontSize: '48px', marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: '24px', margin: '0 0 8px' }}>Order Placed Successfully!</h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: 20 }}>
          Your simulated payment has been authorized and inventory reserved.
        </p>

        <div className="card sunken" style={{ padding: '16px', textAlign: 'left', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="muted">Order Number:</span>
            <b>{done.orderNumber}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="muted">Order ID:</span>
            <span style={{ fontSize: '12px' }}>{done.orderId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="muted">Status:</span>
            <span className="badge b-blue">{done.status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--line)' }}>
            <span className="muted">Total Billed:</span>
            <b style={{ color: 'var(--primary-dark)', fontSize: '18px' }}>
              ${Number(done.total).toFixed(2)}
            </b>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn" onClick={() => router.push(`/orders/${done.orderId}`)}>
            Track Order Status 📍
          </button>
          <Link href="/">
            <button className="btn ghost">Continue Shopping</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">SIMULATED CHECKOUT & IDEMPOTENT ORDERING</span>
        <h1 style={{ fontSize: '26px' }}>Checkout</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Server calculates all totals and tax rules. Client idempotency keys ensure exactly-once
          execution.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* ADDRESS FORM */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Shipping Address</h3>
          <form onSubmit={placeOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                Street Address
              </label>
              <input
                className="input"
                value={addr.line1}
                onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  City
                </label>
                <input
                  className="input"
                  value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  State / Province
                </label>
                <input
                  className="input"
                  value={addr.state}
                  onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  Postal Code
                </label>
                <input
                  className="input"
                  value={addr.postalCode}
                  onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  Country
                </label>
                <input
                  className="input"
                  value={addr.country}
                  onChange={(e) => setAddr({ ...addr, country: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="card sunken" style={{ padding: '12px 16px', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💳</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Payment Method: Simulated Instant Authorize</span>
              </div>
            </div>

            {msg && (
              <div
                style={{
                  color: 'var(--bad)',
                  background: 'var(--bad-bg)',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: '13px',
                }}
              >
                {msg}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={busy || !cart?.items?.length}
              style={{ marginTop: 8, padding: '14px' }}
            >
              {busy ? 'Authorizing & Placing Order...' : `Authorize & Place Order ($${cart?.subtotal?.toFixed(2) || '0.00'})`}
            </button>
          </form>
        </div>

        {/* ORDER SUMMARY */}
        <div className="card sunken">
          <h4 style={{ margin: '0 0 12px', fontSize: '15px' }}>Order Summary</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {cart?.items?.map((item: any) => (
              <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.quantity}× {item.product.name}
                </span>
                <b>${Number(item.lineTotal).toFixed(2)}</b>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
              <span className="muted">Subtotal:</span>
              <span>${cart?.subtotal ? Number(cart.subtotal).toFixed(2) : '0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
              <span className="muted">Shipping:</span>
              <span style={{ color: 'var(--ok)', fontWeight: 700 }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--primary-dark)' }}>
                ${cart?.subtotal ? Number(cart.subtotal).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
