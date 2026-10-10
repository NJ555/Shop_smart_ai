'use strict';
const express = require('express');
const { z } = require('zod');
const db = require('../../db');
const { uid, nowIso } = require('../../utils/ids');
const { authenticate, requireRole, problem } = require('../../middleware/auth');
const { audit } = require('../../middleware/idempotency');

const router = express.Router();

function availability(qty) {
  if (qty <= 0) return 'OUT_OF_STOCK';
  if (qty <= 5) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function enrich(p) {
  const attrs = db.all('SELECT attribute_key, attribute_value FROM product_attributes WHERE product_id=? ORDER BY display_order', [p.id]);
  const images = db.all('SELECT url, is_primary FROM product_images WHERE product_id=? ORDER BY display_order', [p.id]);
  const inv = db.get('SELECT available_quantity FROM inventory_levels WHERE product_id=?', [p.id]);
  const cat = p.category_id ? db.get('SELECT name, slug FROM categories WHERE id=?', [p.category_id]) : null;
  const qty = inv ? inv.available_quantity : 0;
  return {
    productId: p.id, name: p.name, slug: p.slug, brand: p.brand, description: p.description,
    price: p.price, rating: p.rating, isActive: !!p.is_active,
    category: cat ? cat.slug : null, categoryName: cat ? cat.name : null,
    attributes: Object.fromEntries(attrs.map((a) => [a.attribute_key, a.attribute_value])),
    attributeList: attrs, images: images.map((i) => i.url),
    thumbnail: images.length ? images[0].url : null,
    inventory: qty, availability: availability(qty),
  };
}

router.get('/categories', (req, res) => {
  res.json(db.all('SELECT id, name, slug, parent_id as parentId, is_active as isActive FROM categories WHERE is_active=1 ORDER BY name'));
});

// GET /products/search?query=&category=&minPrice&maxPrice&brand&rating&availability&sort&page&size
router.get('/products/search', (req, res) => {
  const q = (req.query.query || '').toString().toLowerCase();
  const category = (req.query.category || '').toString();
  const minPrice = req.query.minPrice != null && req.query.minPrice !== '' ? parseFloat(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice != null && req.query.maxPrice !== '' ? parseFloat(req.query.maxPrice) : null;
  const brand = (req.query.brand || '').toString().toLowerCase();
  const minRating = req.query.rating ? parseFloat(req.query.rating) : null;
  const avail = (req.query.availability || '').toString();
  const sort = (req.query.sort || 'relevance').toString();
  const page = Math.max(0, parseInt(req.query.page || '0', 10));
  const size = Math.min(50, Math.max(1, parseInt(req.query.size || '20', 10)));

  let rows = db.all(`SELECT p.*, c.slug as cat_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.is_active=1`);
  if (q) rows = rows.filter((p) => `${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(q));
  if (category) rows = rows.filter((p) => p.cat_slug === category);
  if (minPrice != null && !Number.isNaN(minPrice)) rows = rows.filter((p) => p.price >= minPrice);
  if (maxPrice != null && !Number.isNaN(maxPrice)) rows = rows.filter((p) => p.price <= maxPrice);
  if (brand) rows = rows.filter((p) => String(p.brand).toLowerCase() === brand);
  if (minRating != null && !Number.isNaN(minRating)) rows = rows.filter((p) => p.rating >= minRating);
  let enriched = rows.map(enrich);
  if (avail) enriched = enriched.filter((p) => p.availability === avail);
  const sorters = {
    price_asc: (a, b) => a.price - b.price, price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating, newest: (a, b) => String(b.productId).localeCompare(String(a.productId)),
    relevance: (a, b) => (relScore(b, q) - relScore(a, q)) || (b.rating - a.rating),
  };
  function relScore(p, qq) {
    if (!qq) return 0;
    const name = `${p.name}`.toLowerCase(), brand = `${p.brand}`.toLowerCase();
    return name.includes(qq) ? 2 : brand.includes(qq) ? 1 : 0;
  }
  enriched.sort(sorters[sort] || sorters.relevance);
  const total = enriched.length;
  res.json({ items: enriched.slice(page * size, page * size + size), total, page, size });
});

router.get('/products/compare', (req, res) => {
  const ids = (req.query.ids || '').toString().split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (ids.length < 2) return res.status(400).json(problem(req, 400, 'Invalid request', 'Provide 2-4 product ids'));
  const items = ids.map((id) => db.get('SELECT * FROM products WHERE id=?', [id])).filter(Boolean).map(enrich);
  res.json({ items });
});

router.get('/products/:id', (req, res) => {
  const p = db.get('SELECT * FROM products WHERE id=? OR slug=?', [req.params.id, req.params.id]);
  if (!p || !p.is_active) return res.status(404).json(problem(req, 404, 'Not Found', 'Product not found'));
  res.json(enrich(p));
});

// ---- Catalog admin (CATALOG_MANAGER+) ----
const productSchema = z.object({
  name: z.string().min(3).max(200), brand: z.string().min(1).max(100),
  category: z.string().min(1), price: z.number().positive(), rating: z.number().min(0).max(5).optional(),
  description: z.string().optional(), attributes: z.record(z.string()).optional(),
  inventory: z.number().int().min(0).optional(), isActive: z.boolean().optional(),
});

router.post('/products', authenticate(), requireRole('CATALOG_MANAGER'), (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(problem(req, 400, 'Invalid request', parsed.error.issues.map((i) => i.message).join('; ')));
  const d = parsed.data;
  const cat = db.get('SELECT * FROM categories WHERE slug=? OR id=?', [d.category, d.category]);
  if (!cat) return res.status(400).json(problem(req, 400, 'Invalid request', 'Unknown category'));
  const id = 'PRD' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '-' + id.toLowerCase();
  const now = nowIso();
  db.run('INSERT INTO products (id, name, slug, category_id, brand, description, price, rating, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id, d.name, slug, cat.id, d.brand, d.description || '', d.price, d.rating ?? 0, d.isActive === false ? 0 : 1, now, now]);
  let i = 0;
  for (const [k, v] of Object.entries(d.attributes || {})) {
    db.run('INSERT INTO product_attributes (id, product_id, attribute_key, attribute_value, display_order) VALUES (?,?,?,?,?)', [uid('atr'), id, k, String(v), i++]);
  }
  db.run('INSERT INTO inventory_levels (product_id, available_quantity, reserved_quantity, version, updated_at) VALUES (?,?,?,?,?)', [id, d.inventory ?? 10, 0, 1, now]);
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'product.created', entityType: 'product', entityId: id, after: d, traceId: req.traceId });
  res.status(201).json({ productId: id });
});

router.put('/products/:id', authenticate(), requireRole('CATALOG_MANAGER'), (req, res) => {
  const p = db.get('SELECT * FROM products WHERE id=?', [req.params.id]);
  if (!p) return res.status(404).json(problem(req, 404, 'Not Found', 'Product not found'));
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(problem(req, 400, 'Invalid request', 'Invalid fields'));
  const d = parsed.data;
  const before = { ...p };
  if (d.category) {
    const cat = db.get('SELECT * FROM categories WHERE slug=? OR id=?', [d.category, d.category]);
    if (!cat) return res.status(400).json(problem(req, 400, 'Invalid request', 'Unknown category'));
    p.category_id = cat.id;
  }
  db.run('UPDATE products SET name=?, brand=?, category_id=?, description=?, price=?, rating=?, is_active=?, updated_at=? WHERE id=?',
    [d.name ?? p.name, d.brand ?? p.brand, p.category_id, d.description ?? p.description, d.price ?? p.price, d.rating ?? p.rating, d.isActive === undefined ? p.is_active : (d.isActive ? 1 : 0), nowIso(), p.id]);
  if (d.attributes) {
    db.run('DELETE FROM product_attributes WHERE product_id=?', [p.id]);
    let i = 0;
    for (const [k, v] of Object.entries(d.attributes)) db.run('INSERT INTO product_attributes (id, product_id, attribute_key, attribute_value, display_order) VALUES (?,?,?,?,?)', [uid('atr'), p.id, k, String(v), i++]);
  }
  if (d.inventory != null) db.run('UPDATE inventory_levels SET available_quantity=?, version=version+1, updated_at=? WHERE product_id=?', [d.inventory, nowIso(), p.id]);
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'product.updated', entityType: 'product', entityId: p.id, before, after: d, traceId: req.traceId });
  res.json({ ok: true });
});

module.exports = router;
module.exports.enrichProduct = enrich;
