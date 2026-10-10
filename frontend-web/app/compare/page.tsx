'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { availBadge } from '../../components/ProductCard';

export default function ComparePage() {
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('ss_compare') || '[]');
      setIds(stored);
    }
  }, []);

  const loadCompare = async () => {
    if (ids.length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const r: any = await api(`/products/compare?ids=${ids.join(',')}`, { auth: false });
      setItems(r.items || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCompare();
  }, [ids]);

  const removeItem = (id: string) => {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ss_compare', JSON.stringify(next));
    }
  };

  const clearAll = () => {
    setIds([]);
    setItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ss_compare');
    }
  };

  const allSpecKeys = Array.from(new Set(items.flatMap((i) => Object.keys(i.attributes || {}))));

  return (
    <div>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">SPECIFICATION BENCHMARK</span>
        <h1 style={{ fontSize: '26px' }}>Compare Products ({ids.length}/4)</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Side-by-side technical specification alignment, hardware benchmarks, and verified customer
          ratings.
        </p>
      </div>

      {ids.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: 12 }}>⚖️</div>
          <h3>Select 2 to 4 Products to Compare</h3>
          <p className="muted" style={{ maxWidth: '440px', margin: '0 auto' }}>
            Click the <b>⇄</b> button on any product card in the catalog to add items to your side-by-side
            comparison matrix.
          </p>
          <Link href="/">
            <button className="btn" style={{ marginTop: 14 }}>
              Explore Catalog
            </button>
          </Link>
        </div>
      ) : loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="muted">Comparing product attributes...</p>
        </div>
      ) : (
        <div className="card glow" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Product</th>
                {items.map((i) => (
                  <th key={i.productId} style={{ minWidth: '200px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Link
                        href={`/product/${i.productId}`}
                        style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', textDecoration: 'none' }}
                      >
                        {i.name}
                      </Link>
                      <div className="muted" style={{ fontSize: '11px' }}>
                        {i.brand} · ★ {i.rating}
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--primary-dark)', margin: '4px 0' }}>
                        ${i.price}
                      </div>
                      <button
                        className="btn plain"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => removeItem(i.productId)}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Availability</b></td>
                {items.map((i) => {
                  const b = availBadge(i.availability);
                  return (
                    <td key={i.productId}>
                      <span className="badge" style={{ background: b.bg, color: b.color }}>
                        {b.text}
                      </span>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><b>Rating</b></td>
                {items.map((i) => (
                  <td key={i.productId}>
                    ★ {i.rating} <span className="muted">/ 5.0</span>
                  </td>
                ))}
              </tr>
              {allSpecKeys.map((key) => (
                <tr key={key}>
                  <td><b>{key}</b></td>
                  {items.map((i) => (
                    <td key={i.productId}>
                      {i.attributes?.[key] ? String(i.attributes[key]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <button className="btn plain" onClick={clearAll}>
              Clear Comparison Matrix
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
