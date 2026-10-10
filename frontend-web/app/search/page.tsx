'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import ProductCard, { Product } from '../../components/ProductCard';

function SearchInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    query: sp.get('query') || '',
    category: sp.get('category') || '',
    minPrice: sp.get('minPrice') || '',
    maxPrice: sp.get('maxPrice') || '',
    brand: sp.get('brand') || '',
    rating: sp.get('rating') || '',
    sort: sp.get('sort') || 'relevance',
    page: 0,
  });

  const loadData = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (f.query) qs.set('query', f.query);
    if (f.category) qs.set('category', f.category);
    if (f.minPrice) qs.set('minPrice', f.minPrice);
    if (f.maxPrice) qs.set('maxPrice', f.maxPrice);
    if (f.brand) qs.set('brand', f.brand);
    if (f.rating) qs.set('rating', f.rating);
    qs.set('sort', f.sort);
    qs.set('page', String(f.page));
    qs.set('size', '20');

    try {
      const r: any = await api(`/products/search?${qs.toString()}`, { auth: false });
      setItems(r.items || []);
      setTotal(r.total || 0);
      router.replace(`/search?${qs.toString()}`);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [f.page, f.sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setF({ ...f, page: 0 });
    setTimeout(loadData, 0);
  };

  return (
    <div>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">CATALOG INVENTORY SEARCH</span>
        <h1 style={{ fontSize: '26px' }}>Filter & Search Catalog</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Explore all 52 seeded products across laptops, smartphones, appliances, and accessories with
          real-time price and stock telemetry.
        </p>
      </div>

      <div className="card glow">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '2', minWidth: '220px' }}>
              <input
                className="input"
                placeholder="Search keywords (e.g. ThinkPad, OLED, 16GB, Sony)..."
                value={f.query}
                onChange={(e) => setF({ ...f, query: e.target.value })}
              />
            </div>
            <div style={{ flex: '1', minWidth: '160px' }}>
              <select
                className="select"
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="laptops">💻 Laptops</option>
                <option value="smartphones">📱 Smartphones</option>
                <option value="appliances">🍳 Appliances</option>
                <option value="accessories">🎧 Accessories</option>
              </select>
            </div>
            <div style={{ flex: '1', minWidth: '140px' }}>
              <select
                className="select"
                value={f.sort}
                onChange={(e) => setF({ ...f, sort: e.target.value })}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated (★)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ width: '120px' }}>
              <input
                className="input"
                type="number"
                placeholder="Min $ USD"
                value={f.minPrice}
                onChange={(e) => setF({ ...f, minPrice: e.target.value })}
              />
            </div>
            <div style={{ width: '120px' }}>
              <input
                className="input"
                type="number"
                placeholder="Max $ USD"
                value={f.maxPrice}
                onChange={(e) => setF({ ...f, maxPrice: e.target.value })}
              />
            </div>
            <div style={{ width: '160px' }}>
              <input
                className="input"
                placeholder="Brand name"
                value={f.brand}
                onChange={(e) => setF({ ...f, brand: e.target.value })}
              />
            </div>

            <button type="submit" className="btn" style={{ padding: '11px 24px', marginLeft: 'auto' }}>
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* RESULTS */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            Results ({total})
          </h3>
        </div>

        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p className="muted">Searching catalog...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <h3>No Products Found</h3>
            <p className="muted">Try relaxing price caps or search for broader keywords.</p>
          </div>
        ) : (
          <div className="grid">
            {items.map((p) => (
              <ProductCard key={p.productId} p={p} />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 28 }}>
          <button
            className="btn plain"
            disabled={f.page === 0}
            onClick={() => setF({ ...f, page: f.page - 1 })}
          >
            ← Previous
          </button>
          <span className="muted" style={{ fontWeight: 700, fontSize: '13px' }}>
            Page {f.page + 1} of {Math.max(1, Math.ceil(total / 20))}
          </span>
          <button
            className="btn plain"
            disabled={(f.page + 1) * 20 >= total}
            onClick={() => setF({ ...f, page: f.page + 1 })}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="card">Loading search interface...</div>}>
      <SearchInner />
    </Suspense>
  );
}
