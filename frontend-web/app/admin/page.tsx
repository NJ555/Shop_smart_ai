'use client';
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth, isStaff, SAMPLE_PERSONAS } from '../../lib/auth';

export default function AdminPage() {
  const { user, quickSwitch } = useAuth();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    name: '',
    brand: '',
    category: 'laptops',
    price: '',
    description: '',
    attributes: '{"ram":"16GB","storage":"512GB SSD"}',
    inventory: '10',
  });

  const loadTabData = async (t: string = tab) => {
    setLoading(true);
    setMsg('');
    try {
      if (t === 'overview') setData(await api('/admin/overview'));
      if (t === 'inventory') setData(await api('/admin/inventory'));
      if (t === 'orders') setData(await api('/admin/orders'));
      if (t === 'docs') setData(await api('/admin/knowledge/documents'));
      if (t === 'agents') {
        const [runs, approvals] = await Promise.all([
          api('/agent/runs').catch(() => ({ items: [] })),
          api('/agent/approvals').catch(() => api('/admin/approvals')).catch(() => ({ items: [] })),
        ]);
        setData({ runs: runs.items || [], approvals: approvals.items || [] });
      }
      if (t === 'audit') setData(await api('/admin/audit'));
    } catch (e: any) {
      setMsg(e.message || 'Error loading admin data');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && isStaff(user)) loadTabData(tab);
  }, [user, tab]);

  if (!user) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <h3>Staff Access Required</h3>
        <p className="muted">Please log in with an administrator or staff persona to access this console.</p>
        <button
          className="btn"
          style={{ marginTop: 12 }}
          onClick={() => quickSwitch('admin@example.com')}
        >
          👑 1-Tap Login as Super Admin
        </button>
      </div>
    );
  }

  if (!isStaff(user)) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: 12 }}>🛡️</div>
        <h3>Restricted: Staff Only</h3>
        <p className="muted">
          Current user <b>{user.email}</b> has role <b>{user.role}</b>. Switch to an operations,
          catalog, support, or admin persona to access staff endpoints.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn" onClick={() => quickSwitch('admin@example.com')}>
            👑 Switch to Super Admin
          </button>
          <button className="btn ghost" onClick={() => quickSwitch('ops@example.com')}>
            ⚙️ Switch to Ops Manager
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className="hero-tag">OPERATIONS & CONTROL PLANE</span>
            <h1 style={{ fontSize: '26px' }}>ShopSmart Admin Console</h1>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Logged in as <b>{user.fullName || user.email}</b> ({user.role}) · Real-time SQLite state
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn plain" style={{ fontSize: '12px' }} onClick={() => quickSwitch('ops@example.com')}>
              ⚙️ Ops Persona
            </button>
            <button className="btn plain" style={{ fontSize: '12px' }} onClick={() => quickSwitch('admin@example.com')}>
              👑 Admin Persona
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs" style={{ margin: '18px 0 0', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'catalog', label: '🛍️ Add Product' },
            { id: 'inventory', label: '📦 Inventory Control' },
            { id: 'orders', label: '📑 All Orders' },
            { id: 'docs', label: '📚 Policy Docs' },
            { id: 'agents', label: '🤖 Agent Runs & Approvals' },
            { id: 'audit', label: '🛡️ Audit Trail' },
          ].map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => {
                setTab(t.id);
                setData(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
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

      {loading && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="muted">Fetching real-time backend telemetry...</p>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && data && (
        <div className="grid">
          {Object.entries(data)
            .filter(([k]) => !Array.isArray((data as any)[k]))
            .map(([k, v]: any) => (
              <div key={k} className="card glow">
                <div className="muted" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 800 }}>
                  {k.replace(/([A-Z])/g, ' $1')}
                </div>
                <h2 style={{ margin: '8px 0 0', fontSize: '28px', color: 'var(--primary-dark)' }}>
                  {String(v)}
                </h2>
              </div>
            ))}
        </div>
      )}

      {/* CATALOG ADD PRODUCT TAB */}
      {tab === 'catalog' && (
        <div className="card glow" style={{ maxWidth: '700px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Create Catalog Product</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api('/products', {
                  method: 'POST',
                  body: {
                    name: form.name,
                    brand: form.brand,
                    category: form.category,
                    price: parseFloat(form.price),
                    description: form.description,
                    attributes: JSON.parse(form.attributes),
                    inventory: parseInt(form.inventory) || 10,
                  },
                });
                setMsg(`Product "${form.name}" created successfully!`);
                setForm({ ...form, name: '', brand: '', price: '', description: '' });
              } catch (e: any) {
                setMsg(e.message || 'Failed to create product');
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Product Title</label>
              <input
                className="input"
                placeholder="e.g. Dell XPS 15 9530"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Brand</label>
                <input
                  className="input"
                  placeholder="e.g. Dell"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Category</label>
                <select
                  className="select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="laptops">laptops</option>
                  <option value="smartphones">smartphones</option>
                  <option value="appliances">appliances</option>
                  <option value="accessories">accessories</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Price ($ USD)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1299.99"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Initial Inventory</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 25"
                  value={form.inventory}
                  onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Description</label>
              <input
                className="input"
                placeholder="Product description for search and RAG embedding"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Attributes JSON</label>
              <input
                className="input"
                value={form.attributes}
                onChange={(e) => setForm({ ...form, attributes: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn" style={{ padding: '12px', marginTop: 8 }}>
              Publish Product to Catalog
            </button>
          </form>
        </div>
      )}

      {/* INVENTORY TAB */}
      {tab === 'inventory' && data && (
        <div className="card glow">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Inventory Stock & Reservation Controls</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>Quick Restock</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item: any) => (
                <tr key={item.productId}>
                  <td><b>{item.name}</b></td>
                  <td>${item.price}</td>
                  <td>
                    <span className={`badge ${item.stock > 5 ? 'b-green' : item.stock > 0 ? 'b-amber' : 'b-red'}`}>
                      {item.stock} in stock
                    </span>
                  </td>
                  <td>{item.reserved}</td>
                  <td>
                    <button
                      className="btn plain"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={async () => {
                        await api(`/admin/inventory/${item.productId}/adjust`, {
                          method: 'POST',
                          body: { delta: 10, reason: 'RESTOCK' },
                        });
                        loadTabData('inventory');
                      }}
                    >
                      +10 Units
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && data && (
        <div className="card glow">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>All Platform Orders</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Status</th>
                <th>Total</th>
                <th>Customer ID</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((o: any) => (
                <tr key={o.id}>
                  <td><b>{o.order_number}</b></td>
                  <td><span className="badge b-blue">{o.status}</span></td>
                  <td>${Number(o.total).toFixed(2)}</td>
                  <td className="muted" style={{ fontSize: '11px' }}>{o.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* KNOWLEDGE DOCS TAB */}
      {tab === 'docs' && data && (
        <div className="card glow">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>RAG Policy Knowledge Documents</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Version</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((d: any) => (
                <tr key={d.documentId}>
                  <td><b>{d.title}</b></td>
                  <td>{d.category}</td>
                  <td>v{d.version}</td>
                  <td>
                    <span className={`badge ${d.status === 'ACTIVE' ? 'b-green' : 'b-amber'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    {d.status !== 'ACTIVE' && (
                      <button
                        className="btn plain"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={async () => {
                          await api(`/admin/knowledge/documents/${d.documentId}/activate`, { method: 'POST' });
                          loadTabData('docs');
                        }}
                      >
                        Activate Document
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AGENTS TAB */}
      {tab === 'agents' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* PENDING APPROVALS */}
          <div className="card glow">
            <h3 style={{ margin: '0 0 14px', fontSize: '18px' }}>
              Pending Human Approvals ({data.approvals?.filter((a: any) => a.status === 'PENDING').length || 0})
            </h3>
            {data.approvals?.filter((a: any) => a.status === 'PENDING').length === 0 ? (
              <p className="muted" style={{ fontSize: '13px' }}>No human approvals currently pending in queue.</p>
            ) : (
              data.approvals
                .filter((a: any) => a.status === 'PENDING')
                .map((a: any) => (
                  <div
                    key={a.id}
                    className="card sunken"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 14,
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <b>{a.kind}</b> · Target: {a.reference_id}
                      <div className="muted" style={{ fontSize: '12px', marginTop: 2 }}>
                        Reason: {a.reason}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={async () => {
                          await api(`/agent/approvals/${a.id}/decide`, {
                            method: 'POST',
                            body: { approve: true },
                          });
                          loadTabData('agents');
                        }}
                      >
                        Approve ✓
                      </button>
                      <button
                        className="btn plain"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={async () => {
                          await api(`/agent/approvals/${a.id}/decide`, {
                            method: 'POST',
                            body: { approve: false },
                          });
                          loadTabData('agents');
                        }}
                      >
                        Reject ✕
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* AGENT RUNS */}
          <div className="card">
            <h3 style={{ margin: '0 0 14px', fontSize: '18px' }}>Agent Run Traces</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Intent</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Query</th>
                </tr>
              </thead>
              <tbody>
                {data.runs?.slice(0, 20).map((r: any) => (
                  <tr key={r.id}>
                    <td><b>{r.intent}</b></td>
                    <td>{r.selected_agent}</td>
                    <td><span className="badge b-green">{r.status}</span></td>
                    <td className="muted" style={{ fontSize: '12px' }}>{r.input_query?.slice(0, 50)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT TAB */}
      {tab === 'audit' && data && (
        <div className="card glow">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>System Audit Log</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor Type</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.slice(0, 50).map((a: any) => (
                <tr key={a.id}>
                  <td><b>{a.action}</b></td>
                  <td>{a.entity_type} / {a.entity_id}</td>
                  <td><span className="badge b-blue">{a.actor_type}</span></td>
                  <td className="muted" style={{ fontSize: '12px' }}>
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
