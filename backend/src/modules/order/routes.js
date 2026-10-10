'use strict';
const express = require('express');
const db = require('../../db');
const config = require('../../config');
const { uid, nowIso, orderNumber, trackingNumber, sha256 } = require('../../utils/ids');
const { authenticate, problem } = require('../../middleware/auth');
const { checkReplay, storeKey, audit, outbox } = require('../../middleware/idempotency');
const { enrichProduct } = require('../catalog/routes');

const router = express.Router();
router.use(authenticate());

const timers = new Map();
function schedule(id, ms, fn) {
  if (timers.has(id)) clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => { timers.delete(id); try { fn(); } catch (e) { console.error(e); } }, ms));
  if (timers.get(id).unref) timers.get(id).unref();
}

function totalsFor(items, membership) {
  const subtotal = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  let shipping = 0;
  if (membership === 'BASIC') shipping = subtotal >= 50 ? 0 : 9.99;
  else shipping = subtotal >= 35 ? 0 : 4.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  return { subtotal, shippingFee: shipping, taxSimulated: tax, total: +(subtotal + shipping + tax).toFixed(2) };
}

function orderView(o) {
  const items = db.all('SELECT * FROM order_items WHERE order_id=?', [o.id]);
  return {
    orderId: o.id, orderNumber: o.order_number, status: o.status, currency: o.currency,
    subtotal: o.subtotal, shippingFee: o.shipping_fee, taxSimulated: o.tax_simulated, total: o.total,
    membershipTier: o.membership_tier, shippingAddress: JSON.parse(o.shipping_address || '{}'),
    paymentStatus: 'PAID_SIMULATED', createdAt: o.created_at, updatedAt: o.updated_at,
    items: items.map((i) => ({ productId: i.product_id, name: i.product_name_snapshot, unitPrice: i.unit_price_snapshot, quantity: i.quantity, attributes: JSON.parse(i.attributes_snapshot || '{}') })),
  };
}

// POST /orders — idempotent simulated checkout
router.post('/', (req, res) => {
  const idemKey = req.headers['idempotency-key'];
  if (idemKey) {
    const replay = checkReplay(idemKey);
    if (replay) return res.status(replay.httpStatus || 201).json(replay);
  }
  const { cartId, shippingAddress, paymentMode = 'SIMULATED' } = req.body || {};
  if (!cartId || !shippingAddress || !shippingAddress.line1) {
    return res.status(400).json(problem(req, 400, 'Invalid request', 'cartId and shippingAddress.line1 required'));
  }
  if (paymentMode !== 'SIMULATED') return res.status(400).json(problem(req, 400, 'Invalid request', 'Only SIMULATED payment in MVP'));
  const cart = db.get('SELECT * FROM carts WHERE id=? AND user_id=?', [cartId, req.user.id]);
  if (!cart || cart.status !== 'ACTIVE') return res.status(400).json(problem(req, 400, 'Invalid request', 'Cart not active'));
  const lines = db.all('SELECT ci.*, p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?', [cartId]);
  if (!lines.length) return res.status(400).json(problem(req, 400, 'Invalid request', 'Cart is empty'));

  // revalidate price + stock server-side
  const invalid = [];
  const items = [];
  for (const l of lines) {
    const inv = db.get('SELECT available_quantity FROM inventory_levels WHERE product_id=?', [l.product_id]);
    const stock = inv ? inv.available_quantity : 0;
    if (!l.is_active || stock < l.quantity) { invalid.push({ productId: l.product_id, available: stock }); continue; }
    items.push({ productId: l.product_id, name: l.name, price: l.price, quantity: l.quantity, attrs: db.all('SELECT attribute_key, attribute_value FROM product_attributes WHERE product_id=?', [l.product_id]) });
  }
  if (invalid.length) return res.status(409).json({ ...problem(req, 409, 'Conflict', 'Some items unavailable'), invalid });
  const user = db.get('SELECT * FROM users WHERE id=?', [req.user.id]);
  const t = totalsFor(items, user.membership_tier);
  const now = nowIso();
  const oid = uid('ord');
  const onum = orderNumber();
  db.run(`INSERT INTO orders (id, order_number, user_id, status, currency, subtotal, shipping_fee, tax_simulated, total, membership_tier, shipping_address, idempotency_key, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [oid, onum, req.user.id, 'CONFIRMED', 'USD', t.subtotal, t.shippingFee, t.taxSimulated, t.total, user.membership_tier, JSON.stringify(shippingAddress), idemKey || null, now, now]);
  for (const it of items) {
    db.run('INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, attributes_snapshot) VALUES (?,?,?,?,?,?,?)',
      [uid('oit'), oid, it.productId, it.name, it.price, it.quantity, JSON.stringify(Object.fromEntries(it.attrs.map((a) => [a.attribute_key, a.attribute_value])))]);
    db.run('UPDATE inventory_levels SET available_quantity=available_quantity-?, reserved_quantity=reserved_quantity+?, version=version+1, updated_at=? WHERE product_id=?',
      [it.quantity, it.quantity, now, it.productId]);
  }
  db.run(`UPDATE carts SET status='CHECKED_OUT', updated_at=? WHERE id=?`, [now, cartId]);
  // shipment
  const sid = uid('shp');
  const eta = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
  db.run('INSERT INTO shipments (id, order_id, status, carrier_simulated, tracking_number, eta, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
    [sid, oid, 'IN_TRANSIT', 'ShopSmart Logistics (SIM)', trackingNumber(), eta, now, now]);
  const ev = (status, desc) => db.run('INSERT INTO shipment_events (id, shipment_id, status, description, occurred_at, source) VALUES (?,?,?,?,?,?)', [uid('sev'), sid, status, desc, nowIso(), 'SIMULATION']);
  ev('LABEL_CREATED', 'Shipment registered'); ev('IN_TRANSIT', 'Package in transit');
  outbox({ aggregateType: 'order', aggregateId: oid, eventType: 'order.created', payload: { orderId: oid, orderNumber: onum, total: t.total } });
  audit({ actorId: req.user.id, actorType: 'USER', action: 'order.created', entityType: 'order', entityId: oid, after: { orderNumber: onum, total: t.total }, traceId: req.traceId });
  // simulated progression
  schedule(`proc-${oid}`, 45000, () => {
    const o = db.get('SELECT * FROM orders WHERE id=?', [oid]);
    if (o && o.status === 'CONFIRMED') db.run(`UPDATE orders SET status='PROCESSING', updated_at=? WHERE id=?`, [nowIso(), oid]);
  });
  schedule(`ofd-${oid}`, 90000, () => {
    const s = db.get('SELECT * FROM shipments WHERE order_id=?', [oid]);
    if (s && (s.status === 'IN_TRANSIT' || s.status === 'DELAYED')) {
      db.run(`UPDATE shipments SET status='OUT_FOR_DELIVERY', updated_at=? WHERE id=?`, [nowIso(), s.id]);
      db.run('INSERT INTO shipment_events (id, shipment_id, status, description, occurred_at, source) VALUES (?,?,?,?,?,?)', [uid('sev'), s.id, 'OUT_FOR_DELIVERY', 'Out for delivery', nowIso(), 'SIMULATION']);
      db.run(`UPDATE orders SET status='SHIPPED', updated_at=? WHERE id=?`, [nowIso(), oid]);
    }
  });
  schedule(`dlv-${oid}`, 240000, () => {
    const s = db.get('SELECT * FROM shipments WHERE order_id=?', [oid]);
    if (s && s.status === 'OUT_FOR_DELIVERY') {
      db.run(`UPDATE shipments SET status='DELIVERED', updated_at=? WHERE id=?`, [nowIso(), s.id]);
      db.run('INSERT INTO shipment_events (id, shipment_id, status, description, occurred_at, source) VALUES (?,?,?,?,?,?)', [uid('sev'), s.id, 'DELIVERED', 'Delivered', nowIso(), 'SIMULATION']);
      db.run(`UPDATE orders SET status='DELIVERED', updated_at=? WHERE id=?`, [nowIso(), oid]);
    }
  });
  const body = { orderId: oid, orderNumber: onum, status: 'CONFIRMED', total: t.total, paymentStatus: 'PAID_SIMULATED', createdAt: now };
  if (idemKey) storeKey(idemKey, 'POST /orders', sha256(JSON.stringify(req.body || {})), { ...body, httpStatus: 201 });
  res.status(201).json(body);
});

router.get('/', (req, res) => {
  const rows = db.all('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  res.json({ items: rows.map(orderView) });
});

router.get('/:id', (req, res) => {
  const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [req.params.id, req.params.id]);
  if (!o) return res.status(404).json(problem(req, 404, 'Not Found', 'Order not found'));
  if (o.user_id !== req.user.id && !['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json(problem(req, 403, 'Forbidden', 'Not your order'));
  }
  res.json(orderView(o));
});

router.get('/:id/shipment', (req, res) => {
  const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [req.params.id, req.params.id]);
  if (!o) return res.status(404).json(problem(req, 404, 'Not Found', 'Order not found'));
  if (o.user_id !== req.user.id && !['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json(problem(req, 403, 'Forbidden', 'Not your order'));
  }
  const s = db.get('SELECT * FROM shipments WHERE order_id=?', [o.id]);
  if (!s) return res.status(404).json(problem(req, 404, 'Not Found', 'No shipment yet'));
  const events = db.all('SELECT status, description, occurred_at as occurredAt FROM shipment_events WHERE shipment_id=? ORDER BY occurred_at', [s.id]);
  res.json({ shipmentId: s.id, status: s.status, trackingNumber: s.tracking_number, carrier: s.carrier_simulated, eta: s.eta, events });
});

// POST /orders/:id/cancel — idempotent
router.post('/:id/cancel', (req, res) => {
  const idemKey = req.headers['idempotency-key'];
  if (idemKey) {
    const replay = checkReplay(idemKey);
    if (replay) return res.status(replay.httpStatus || 200).json(replay);
  }
  const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [req.params.id, req.params.id]);
  if (!o) return res.status(404).json(problem(req, 404, 'Not Found', 'Order not found'));
  const isOwner = o.user_id === req.user.id;
  if (!isOwner && !['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json(problem(req, 403, 'Forbidden', 'Not your order'));
  }
  if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(o.status)) {
    const err = { error: o.status === 'CANCELLED' ? 'ORDER_ALREADY_CANCELLED' : 'ORDER_NOT_ELIGIBLE_FOR_CANCELLATION', message: o.status === 'CANCELLED' ? 'Order already cancelled.' : 'Order has already been shipped and cannot be cancelled.' };
    return res.status(422).json({ ...problem(req, 422, 'Unprocessable', err.message), ...err });
  }
  const before = { status: o.status };
  const now = nowIso();
  db.run(`UPDATE orders SET status='CANCELLED', updated_at=? WHERE id=?`, [now, o.id]);
  const items = db.all('SELECT * FROM order_items WHERE order_id=?', [o.id]);
  for (const it of items) {
    db.run('UPDATE inventory_levels SET available_quantity=available_quantity+?, reserved_quantity=max(0,reserved_quantity-?), version=version+1, updated_at=? WHERE product_id=?', [it.quantity, it.quantity, now, it.product_id]);
  }
  // simulated refund
  const needsApproval = o.total > config.refundApprovalThreshold && req.user.role === 'CUSTOMER';
  const rid = uid('ref');
  db.run('INSERT INTO refunds (id, order_id, amount, reason, status, idempotency_key, created_at) VALUES (?,?,?,?,?,?,?)',
    [rid, o.id, o.total, (req.body || {}).reason || 'CUSTOMER_REQUEST', needsApproval ? 'SIMULATED_REFUND_REQUESTED' : 'SIMULATED_REFUND_COMPLETED', idemKey || null, now]);
  let approvalId = null;
  if (needsApproval) {
    approvalId = uid('apr');
    db.run('INSERT INTO approvals (id, kind, reference_id, requested_by, reason, payload, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [approvalId, 'refund', rid, req.user.id, 'Refund above auto-approve threshold', JSON.stringify({ orderId: o.id, amount: o.total }), 'PENDING', now]);
  }
  outbox({ aggregateType: 'order', aggregateId: o.id, eventType: 'order.cancelled', payload: { orderId: o.id } });
  audit({ actorId: req.user.id, actorType: req.user.role === 'CUSTOMER' ? 'USER' : 'ADMIN', action: 'order.cancelled', entityType: 'order', entityId: o.id, before, after: { status: 'CANCELLED' }, traceId: req.traceId });
  const body = { orderId: o.id, orderNumber: o.order_number, status: 'CANCELLED', refundStatus: needsApproval ? 'SIMULATED_REFUND_REQUESTED' : 'SIMULATED_REFUND_COMPLETED', approvalId, httpStatus: 200 };
  if (idemKey) storeKey(idemKey, 'POST /orders/cancel', sha256(o.id + JSON.stringify(req.body || {})), body);
  const { httpStatus, ...out } = body;
  res.json(out);
});

module.exports = router;
