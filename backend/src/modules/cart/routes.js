'use strict';
const express = require('express');
const db = require('../../db');
const { uid, nowIso } = require('../../utils/ids');
const { authenticate, problem } = require('../../middleware/auth');
const { enrichProduct } = require('../catalog/routes');

const router = express.Router();
router.use(authenticate());

function activeCart(userId) {
  let c = db.get(`SELECT * FROM carts WHERE user_id=? AND status='ACTIVE' ORDER BY created_at DESC`, [userId]);
  if (!c) {
    c = { id: uid('cart'), user_id: userId, status: 'ACTIVE', created_at: nowIso(), updated_at: nowIso() };
    db.run('INSERT INTO carts (id, user_id, status, created_at, updated_at) VALUES (?,?,?,?,?)', [c.id, userId, 'ACTIVE', c.created_at, c.updated_at]);
  }
  return c;
}

function cartView(cartId) {
  const rows = db.all(`SELECT ci.*, p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?`, [cartId]);
  let subtotal = 0;
  const items = rows.map((r) => {
    const prod = enrichProduct({ id: r.product_id, name: r.name, slug: r.slug, category_id: r.category_id, brand: r.brand, description: r.description, price: r.price, rating: r.rating, is_active: r.is_active });
    const warnings = [];
    if (!r.is_active) warnings.push('Product disabled');
    if (prod.inventory < r.quantity) warnings.push(`Only ${prod.inventory} in stock`);
    subtotal += prod.price * r.quantity;
    return { itemId: r.id, quantity: r.quantity, product: prod, warnings, lineTotal: +(prod.price * r.quantity).toFixed(2) };
  });
  return { cartId, items, subtotal: +subtotal.toFixed(2), count: items.reduce((n, i) => n + i.quantity, 0) };
}

router.get('/', (req, res) => {
  res.json(cartView(activeCart(req.user.id).id));
});

router.post('/items', (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  const qty = parseInt(quantity, 10);
  if (!productId || !Number.isInteger(qty) || qty < 1) return res.status(400).json(problem(req, 400, 'Invalid request', 'productId and quantity>=1 required'));
  const p = db.get('SELECT * FROM products WHERE id=? AND is_active=1', [productId]);
  if (!p) return res.status(404).json(problem(req, 404, 'Not Found', 'Product not available'));
  const inv = db.get('SELECT available_quantity FROM inventory_levels WHERE product_id=?', [productId]);
  if ((inv ? inv.available_quantity : 0) < qty) return res.status(409).json(problem(req, 409, 'Conflict', `Only ${inv ? inv.available_quantity : 0} in stock`));
  const cart = activeCart(req.user.id);
  const now = nowIso();
  db.run(`INSERT INTO cart_items (id, cart_id, product_id, quantity, added_at, updated_at) VALUES (?,?,?,?,?,?)
    ON CONFLICT(cart_id, product_id) DO UPDATE SET quantity=quantity+excluded.quantity, updated_at=excluded.updated_at`,
    [uid('cit'), cart.id, productId, qty, now, now]);
  // cap at stock
  const item = db.get('SELECT * FROM cart_items WHERE cart_id=? AND product_id=?', [cart.id, productId]);
  const stock = db.get('SELECT available_quantity FROM inventory_levels WHERE product_id=?', [productId]).available_quantity;
  if (item.quantity > stock) db.run('UPDATE cart_items SET quantity=? WHERE id=?', [stock, item.id]);
  res.status(201).json(cartView(cart.id));
});

router.put('/items/:itemId', (req, res) => {
  const qty = parseInt((req.body || {}).quantity, 10);
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json(problem(req, 400, 'Invalid request', 'quantity>=1 required'));
  const cart = activeCart(req.user.id);
  const item = db.get('SELECT * FROM cart_items WHERE id=? AND cart_id=?', [req.params.itemId, cart.id]);
  if (!item) return res.status(404).json(problem(req, 404, 'Not Found', 'Cart item not found'));
  const stock = db.get('SELECT available_quantity FROM inventory_levels WHERE product_id=?', [item.product_id]).available_quantity;
  if (qty > stock) return res.status(409).json(problem(req, 409, 'Conflict', `Only ${stock} in stock`));
  db.run('UPDATE cart_items SET quantity=?, updated_at=? WHERE id=?', [qty, nowIso(), item.id]);
  res.json(cartView(cart.id));
});

router.delete('/items/:itemId', (req, res) => {
  const cart = activeCart(req.user.id);
  db.run('DELETE FROM cart_items WHERE id=? AND cart_id=?', [req.params.itemId, cart.id]);
  res.json(cartView(cart.id));
});

router.delete('/', (req, res) => {
  const cart = activeCart(req.user.id);
  db.run('DELETE FROM cart_items WHERE cart_id=?', [cart.id]);
  res.json(cartView(cart.id));
});

module.exports = router;
module.exports.activeCart = activeCart;
module.exports.cartView = cartView;
