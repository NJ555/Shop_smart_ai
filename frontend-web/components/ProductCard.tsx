'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

export type Product = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  thumbnail: string | null;
  category?: string | null;
  categoryName?: string;
};

export function availBadge(a: string) {
  if (a === 'IN_STOCK') {
    return { text: 'In Stock', bg: '#D1FAE5', color: '#065F46' };
  }
  if (a === 'LOW_STOCK') {
    return { text: 'Low Stock', bg: '#FEF3C7', color: '#92400E' };
  }
  return { text: 'Out of Stock', bg: '#FEE2E2', color: '#991B1B' };
}

export function toggleCompare(id: string): string[] {
  if (typeof window === 'undefined') return [];
  const cur: string[] = JSON.parse(localStorage.getItem('ss_compare') || '[]');
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-4);
  localStorage.setItem('ss_compare', JSON.stringify(next));
  return next;
}

export function isCompared(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const cur: string[] = JSON.parse(localStorage.getItem('ss_compare') || '[]');
  return cur.includes(id);
}

export default function ProductCard({ p }: { p: Product }) {
  const [msg, setMsg] = useState('');
  const [inCompare, setInCompare] = useState(() => isCompared(p.productId));
  const [isAdding, setIsAdding] = useState(false);
  const badge = availBadge(p.availability);

  const addCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await api('/cart/items', { method: 'POST', body: { productId: p.productId, quantity: 1 } });
      setMsg('Added to Cart! 🛒');
      setTimeout(() => setMsg(''), 2500);
    } catch (e: any) {
      setMsg(e.message || 'Error adding to cart');
      setTimeout(() => setMsg(''), 3000);
    }
    setIsAdding(false);
  };

  const addWish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api('/wishlist/items', { method: 'POST', body: { productId: p.productId } });
      setMsg('Saved to Wishlist! ❤️');
      setTimeout(() => setMsg(''), 2500);
    } catch (e: any) {
      setMsg(e.message || 'Error saving');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleCompare(p.productId);
    const added = next.includes(p.productId);
    setInCompare(added);
    setMsg(added ? 'Added to Compare (max 4)' : 'Removed from Compare');
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="card pcard">
      <Link href={`/product/${p.productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="pcard-img-wrap">
          <img
            src={p.thumbnail || `https://picsum.photos/seed/${p.productId}/600/400`}
            alt={p.name}
            loading="lazy"
          />
          {/* Stock Tag */}
          <span
            className="pcard-stock-tag"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.text}
          </span>

          {/* Floating Actions */}
          <div className="pcard-floating-actions">
            <button
              className="pcard-action-btn"
              onClick={addWish}
              title="Add to Wishlist"
            >
              ❤️
            </button>
            <button
              className={`pcard-action-btn ${inCompare ? 'active' : ''}`}
              onClick={handleCompare}
              title="Compare Specifications"
            >
              ⇄
            </button>
          </div>
        </div>

        <div className="pcard-brand">{p.brand}</div>
        <h4>{p.name}</h4>

        <div className="pcard-rating">
          <span style={{ color: '#F59E0B' }}>★</span>
          <span>{p.rating.toFixed(1)}</span>
          <span className="muted" style={{ fontSize: '11px', marginLeft: 4 }}>
            verified
          </span>
        </div>
      </Link>

      <div className="pcard-bottom">
        <span className="price">${p.price.toFixed(2)}</span>
        <button
          className="btn"
          style={{ padding: '8px 16px', fontSize: '13px' }}
          onClick={addCart}
          disabled={p.availability === 'OUT_OF_STOCK' || isAdding}
        >
          {isAdding ? 'Adding...' : p.availability === 'OUT_OF_STOCK' ? 'Sold Out' : 'Add to Cart'}
        </button>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 8,
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--primary)',
            background: 'var(--accent-blush)',
            padding: '4px 8px',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
