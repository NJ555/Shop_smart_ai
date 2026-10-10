'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, newIdemKey } from '../../../lib/api';

export default function OrderDetail({ params }: { params: { id: string } }) {
  const [o, setO] = useState<any>(null);
  const [ship, setShip] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadData = () => {
    api(`/orders/${params.id}`)
      .then(setO)
      .catch((e) => setMsg(e.message));
    api(`/orders/${params.id}/shipment`)
      .then(setShip)
      .catch(() => {});
  };

  useEffect(loadData, [params.id]);

  if (!o) return <div className="card">{msg || 'Loading order details...'}</div>;

  const cancellable = ['CREATED', 'CONFIRMED', 'PROCESSING'].includes(o.status);

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel ${o.orderNumber}?`)) return;
    setCancelling(true);
    try {
      await api(`/orders/${o.orderId}/cancel`, {
        method: 'POST',
        body: { reason: 'CUSTOMER_REQUEST' },
        idempotencyKey: newIdemKey(),
      });
      setMsg('Order successfully cancelled.');
      loadData();
    } catch (e: any) {
      setMsg(e.message || 'Failed to cancel order.');
    }
    setCancelling(false);
  };

  const steps = ['CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStepIdx = steps.indexOf(o.status);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/orders" className="link" style={{ padding: 0 }}>
          ← Back to Orders
        </Link>
      </div>

      {/* HEADER & SUMMARY CARD */}
      <div className="card glow" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '22px' }}>
              Order {o.orderNumber}
            </h2>
            <div className="muted" style={{ fontSize: '12px' }}>
              Placed: {new Date(o.createdAt).toLocaleString()} · ID: {o.orderId}
            </div>
          </div>
          <div>
            <span
              className={`badge ${
                o.status === 'DELIVERED'
                  ? 'b-green'
                  : o.status === 'CANCELLED'
                  ? 'b-red'
                  : 'b-blue'
              }`}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              {o.status}
            </span>
          </div>
        </div>

        {/* ORDER PROGRESS TIMELINE */}
        {o.status !== 'CANCELLED' && (
          <div style={{ marginTop: 24, padding: '16px', background: 'var(--surface-sunken)', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {steps.map((st, i) => {
                const isPassed = currentStepIdx >= i;
                const isCurrent = currentStepIdx === i;
                return (
                  <div key={st} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        background: isPassed ? 'var(--primary)' : '#DECED2',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '12px',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(225, 29, 72, 0.2)' : 'none',
                        zIndex: 2,
                      }}
                    >
                      {isPassed ? '✓' : i + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: isCurrent ? 800 : 600,
                        color: isPassed ? 'var(--ink)' : 'var(--muted)',
                        marginTop: 6,
                        textAlign: 'center',
                      }}
                    >
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ITEMS LIST */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '15px' }}>Ordered Items</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {o.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>
                    <b>{item.name}</b>
                  </td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unitPrice).toFixed(2)}</td>
                  <td>
                    <b>${(Number(item.unitPrice) * item.quantity).toFixed(2)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 20,
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px solid var(--line)',
            }}
          >
            <div style={{ fontSize: '16px' }}>
              Total Paid: <b style={{ color: 'var(--primary-dark)', fontSize: '20px' }}>${Number(o.total).toFixed(2)}</b>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
          {cancellable && (
            <button
              className="btn danger"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}

          <Link href={`/assistant?tab=ops&q=Where%20is%20my%20order%20${o.orderNumber}%3F%20Can%20I%20cancel%20it%3F`}>
            <button className="btn ghost">
              🤖 Inquire with Ops Agent
            </button>
          </Link>

          {msg && (
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
              {msg}
            </span>
          )}
        </div>
      </div>

      {/* SHIPMENT TELEMETRY CARD */}
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>
          Live Carrier Tracking{' '}
          {ship ? (
            <span className="badge b-green" style={{ marginLeft: 6 }}>
              {ship.status}
            </span>
          ) : (
            <span className="badge b-amber" style={{ marginLeft: 6 }}>
              Pending Dispatch
            </span>
          )}
        </h3>

        {ship ? (
          <div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <span className="muted" style={{ fontSize: '11px', display: 'block' }}>CARRIER</span>
                <b>{ship.carrier}</b>
              </div>
              <div>
                <span className="muted" style={{ fontSize: '11px', display: 'block' }}>TRACKING NUMBER</span>
                <b>{ship.trackingNumber}</b>
              </div>
              <div>
                <span className="muted" style={{ fontSize: '11px', display: 'block' }}>ESTIMATED DELIVERY</span>
                <b>{ship.eta ? new Date(ship.eta).toLocaleDateString() : 'N/A'}</b>
              </div>
            </div>

            <h4 style={{ margin: '14px 0 8px', fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase' }}>
              Tracking Checkpoints
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ship.events?.map((ev: any, k: number) => (
                <div
                  key={k}
                  className="card sunken"
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <b style={{ color: 'var(--primary)' }}>● {ev.status}</b> — {ev.description}
                  </div>
                  <span className="muted" style={{ fontSize: '11px' }}>
                    {ev.occurredAt ? new Date(ev.occurredAt).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: '13px' }}>
            Shipment tracking details will populate once carrier manifests the dispatch label.
          </p>
        )}
      </div>
    </div>
  );
}
