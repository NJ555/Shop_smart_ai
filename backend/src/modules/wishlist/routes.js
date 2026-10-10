'use strict';
const express = require('express');
const db = require('../../db');
const { uid, nowIso } = require('../../utils/ids');
const { authenticate, problem } = require('../../middleware/auth');
const { enrichProduct } = require('../catalog/routes');

const router = express.Router();
router.use(authenticate());

function wishlistOf(userId) {
  let w = db.get('SELECT * FROM wishlists WHERE user_id=?', [userId]);
  if (!w) {
    w = { id: uid('wsh'), user_id: userId, name: 'My Wishlist', created_at: nowIso() };
    db.run('INSERT INTO wishlists (id, user_id, name, created_at) VALUES (?,?,?,?)', [w.id, userId, w.name, w.created_at]);
  }
  return w;
}

router.get('/', (req, res) => {
  const w = wishlistOf(req.user.id);
  const items = db.all(`SELECT wi.*, p.* FROM wishlist_items wi JOIN products p ON p.id=wi.product_id WHERE wi.wishlist_id=?`, [w.id]);
  res.json({ items: items.map((r) => ({ ...enrichProduct({ id: r.product_id, name: r.name, slug: r.slug, category_id: r.category_id, brand: r.brand, description: r.description, price: r.price, rating: r.rating, is_active: r.is_active }), addedAt: r.added_at })) });
});

router.post('/items', (req, res) => {
  const { productId } = req.body || {};
  const p = db.get('SELECT * FROM products WHERE id=? AND is_active=1', [productId]);
  if (!p) return res.status(404).json(problem(req, 404, 'Not Found', 'Product not found'));
  const w = wishlistOf(req.user.id);
  db.run('INSERT OR IGNORE INTO wishlist_items (id, wishlist_id, product_id, added_at) VALUES (?,?,?,?)', [uid('wsi'), w.id, productId, nowIso()]);
  res.status(201).json({ ok: true });
});

router.delete('/items/:productId', (req, res) => {
  const w = wishlistOf(req.user.id);
  db.run('DELETE FROM wishlist_items WHERE wishlist_id=? AND product_id=?', [w.id, req.params.productId]);
  res.json({ ok: true });
});

module.exports = router;
