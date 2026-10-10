'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import ProductCard, { Product } from '../components/ProductCard';

export default function Home() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [sort, setSort] = useState<string>('rating');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (cat = activeCat, q = query, s = sort) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('size', '60');
      if (cat) params.set('category', cat);
      if (q) params.set('query', q);
      params.set('sort', s);

      const r: any = await api(`/products/search?${params.toString()}`);
      setItems(r.items || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Load categories once
    api('/categories').then((data) => setCats(data || [])).catch(() => {});
    loadData('', '', 'rating');
  }, []);

  const handleCatChange = (slug: string) => {
    const next = activeCat === slug ? '' : slug;
    setActiveCat(next);
    loadData(next, query, sort);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(activeCat, query, sort);
  };

  const categoryIcons: Record<string, string> = {
    laptops: '💻',
    smartphones: '📱',
    appliances: '🍳',
    accessories: '🎧',
  };

  return (
    <div>
      {/* HERO SECTION */}
      <div className="hero">
        <span className="hero-tag">GROUNDED AI-POWERED COMMERCE</span>
        <h1>ShopSmart AI Storefront</h1>
        <p>
          Experience intelligent shopping grounded in real catalog inventory, cited policy retrieval
          augmented generation (RAG), and audited autonomous operations agents.
        </p>

        {/* 1-Tap Golden Journeys Examples */}
        <div style={{ marginTop: '16px' }}>
          <div className="prompt-pill-label" style={{ marginBottom: 8 }}>
            ⚡ Try AI Golden Journeys (1-Tap):
          </div>
          <div className="prompt-pills-row">
            <Link
              href="/assistant?tab=shopping&q=Suggest%20a%20laptop%20under%20%241000%20for%20Java%20development%20and%20AI%20projects."
              className="prompt-pill"
            >
              <span>💻</span>
              <span>Suggest laptop under $1000 for Java+AI</span>
            </Link>
            <Link
              href="/assistant?tab=knowledge&q=Can%20I%20return%20an%20opened%20laptop%3F"
              className="prompt-pill"
            >
              <span>📜</span>
              <span>Can I return opened laptop?</span>
            </Link>
            <Link
              href="/assistant?tab=ops&q=Where%20is%20my%20order%20ORD-1001%3F%20Can%20I%20cancel%20it%3F"
              className="prompt-pill"
            >
              <span>📦</span>
              <span>Where is ORD-1001? Can I cancel it?</span>
            </Link>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <input
              className="input"
              type="text"
              placeholder="Search 52 products (e.g. MacBook, ThinkPad, Pixel, Air Fryer)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="select"
            style={{ width: '180px' }}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              loadData(activeCat, query, e.target.value);
            }}
          >
            <option value="rating">Top Rated (★)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="relevance">Relevance</option>
          </select>
          <button type="submit" className="btn" style={{ padding: '11px 24px' }}>
            Search
          </button>
        </form>

        {/* Category Filter Chips */}
        <div className="chips" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip ${activeCat === '' ? 'active' : ''}`}
            onClick={() => handleCatChange('')}
          >
            <span>🏷️</span> All Products (52)
          </button>
          {cats.map((c) => (
            <button
              type="button"
              key={c.slug}
              className={`chip ${activeCat === c.slug ? 'active' : ''}`}
              onClick={() => handleCatChange(c.slug)}
            >
              <span>{categoryIcons[c.slug] || '✨'}</span> {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
          {activeCat ? `${cats.find((c) => c.slug === activeCat)?.name || activeCat}` : 'Catalog Products'}
          <span className="muted" style={{ fontSize: '13px', fontWeight: 500, marginLeft: 8 }}>
            ({items.length} {items.length === 1 ? 'item' : 'items'} available)
          </span>
        </h3>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: 8 }}>🛍️</div>
          <p className="muted">Loading catalog from backend...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No products match your criteria</h3>
          <p className="muted">Try adjusting your search terms or clearing the category filter.</p>
          <button className="btn ghost" onClick={() => { setQuery(''); setActiveCat(''); loadData('', '', 'rating'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid">
          {items.map((p) => (
            <ProductCard key={p.productId} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
