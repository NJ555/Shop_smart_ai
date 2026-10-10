'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function OrdersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const r: any = await api('/orders');
      setItems(r.items || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="badge b-green">Delivered</span>;
      case 'SHIPPED':
        return <span className="badge b-blue">In Transit (Shipped)</span>;
      case 'PROCESSING':
      case 'CONFIRMED':
        return <span className="badge b-amber">{status}</span>;
      case 'CANCELLED':
        return <span className="badge b-red">Cancelled</span>;
      default:
        return <span className="badge b-blue">{status}</span>;
    }
  };

  return (
    <div>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">ORDER LIFECYCLE & TRACKING</span>
        <h1 style={{ fontSize: '26px' }}>My Orders ({items.length})</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Real-time shipment telemetry, carrier timeline checkpoints, and verified return workflows.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="muted">Loading orders...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: 12 }}>📦</div>
          <h3>No Orders Placed Yet</h3>
          <p className="muted">
            Logged in as <b>{user?.email}</b>. Switch personas via the top-right button to view
            sample customer orders (e.g. Rahul Sharma or Ananya Rao) or browse the catalog!
          </p>
          <Link href="/">
            <button className="btn" style={{ marginTop: 12 }}>
              Explore Catalog
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((o) => (
            <div key={o.orderId} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <Link
                    href={`/orders/${o.orderId}`}
                    style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', textDecoration: 'none' }}
                  >
                    {o.orderNumber}
                  </Link>
                  <span className="muted" style={{ fontSize: '12px', marginLeft: 10 }}>
                    Placed on {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div>{getStatusBadge(o.status)}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Total Amount:{' '}
                    <b style={{ color: 'var(--primary-dark)', fontSize: '16px' }}>
                      ${Number(o.total).toFixed(2)}
                    </b>
                  </div>
                  <div className="muted" style={{ fontSize: '11px', marginTop: 2 }}>
                    Payment: SIMULATED · Currency: USD
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/orders/${o.orderId}`}>
                    <button className="btn ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      Track Shipment 📍
                    </button>
                  </Link>
                  <Link href={`/assistant?tab=ops&q=Where%20is%20my%20order%20${o.orderNumber}%3F%20Can%20I%20cancel%20it%3F`}>
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      Ask Ops Agent 🤖
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
