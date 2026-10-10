'use strict';
const express = require('express');
const db = require('../../db');
const { nowIso } = require('../../utils/ids');
const { authenticate, requireRole, problem } = require('../../middleware/auth');
const { audit } = require('../../middleware/idempotency');

const router = express.Router();
router.use(authenticate());

router.get('/overview', requireRole('OPS_MANAGER', 'CATALOG_MANAGER', 'KNOWLEDGE_ADMIN', 'SUPPORT_AGENT'), (req, res) => {
  const q = (sql, p = []) => db.get(sql, p);
  res.json({
    users: q('SELECT COUNT(*) c FROM users').c,
    products: q('SELECT COUNT(*) c FROM products WHERE is_active=1').c,
    orders: q('SELECT COUNT(*) c FROM orders').c,
    revenue: q(`SELECT COALESCE(SUM(total),0) t FROM orders WHERE status!='CANCELLED'`).t,
    lowStock: db.all('SELECT product_id, available_quantity FROM inventory_levels WHERE available_quantity<=5 ORDER BY available_quantity LIMIT 20'),
    openTickets: q(`SELECT COUNT(*) c FROM support_tickets WHERE status='OPEN'`).c,
    pendingApprovals: q(`SELECT COUNT(*) c FROM approvals WHERE status='PENDING'`).c,
    activeDocs: q(`SELECT COUNT(*) c FROM knowledge_documents WHERE status='ACTIVE'`).c,
  });
});

router.get('/orders', requireRole('SUPPORT_AGENT', 'OPS_MANAGER'), (req, res) => {
  const s = (req.query.search || '').toString();
  let rows = db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
  if (s) rows = rows.filter((o) => o.order_number.includes(s.toUpperCase()) || o.id.includes(s));
  res.json({ items: rows });
});

router.get('/inventory', requireRole('OPS_MANAGER', 'CATALOG_MANAGER'), (req, res) => {
  res.json({ items: db.all(`SELECT p.id as productId, p.name, p.price, i.available_quantity as stock, i.reserved_quantity as reserved
    FROM products p JOIN inventory_levels i ON i.product_id=p.id ORDER BY p.name`) });
});

router.post('/inventory/:productId/adjust', requireRole('OPS_MANAGER'), (req, res) => {
  const { delta, reason = 'MANUAL_ADJUST' } = req.body || {};
  if (!Number.isInteger(delta)) return res.status(400).json(problem(req, 400, 'Invalid request', 'delta integer required'));
  const inv = db.get('SELECT * FROM inventory_levels WHERE product_id=?', [req.params.productId]);
  if (!inv) return res.status(404).json(problem(req, 404, 'Not Found', 'Product not found'));
  if (inv.available_quantity + delta < 0) return res.status(422).json(problem(req, 422, 'Unprocessable', 'Adjustment would make stock negative'));
  const before = { ...inv };
  db.run('UPDATE inventory_levels SET available_quantity=available_quantity+?, version=version+1, updated_at=? WHERE product_id=?', [delta, nowIso(), req.params.productId]);
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'inventory.adjusted', entityType: 'product', entityId: req.params.productId, before, after: { delta, reason }, traceId: req.traceId });
  res.json({ ok: true, stock: inv.available_quantity + delta });
});

router.post('/shipments/:orderId/status', requireRole('OPS_MANAGER'), (req, res) => {
  const { status } = req.body || {};
  const allowed = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED'];
  if (!allowed.includes(status)) return res.status(400).json(problem(req, 400, 'Invalid request', `status must be ${allowed.join(',')}`));
  const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [req.params.orderId, req.params.orderId]);
  if (!o) return res.status(404).json(problem(req, 404, 'Not Found', 'Order not found'));
  const s = db.get('SELECT * FROM shipments WHERE order_id=?', [o.id]);
  if (!s) return res.status(404).json(problem(req, 404, 'Not Found', 'No shipment'));
  db.run('UPDATE shipments SET status=?, updated_at=? WHERE id=?', [status, nowIso(), s.id]);
  const { uid } = require('../../utils/ids');
  db.run('INSERT INTO shipment_events (id, shipment_id, status, description, occurred_at, source) VALUES (?,?,?,?,?,?)', [uid('sev'), s.id, status, `Manually set by ${req.user.role}`, nowIso(), 'SYSTEM']);
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'shipment.status_changed', entityType: 'shipment', entityId: s.id, after: { status }, traceId: req.traceId });
  res.json({ ok: true, status });
});

router.get('/audit', requireRole('OPS_MANAGER'), (req, res) => {
  res.json({ items: db.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200') });
});

router.get('/approvals', requireRole('OPS_MANAGER'), (req, res) => {
  res.json({ items: db.all('SELECT * FROM approvals ORDER BY created_at DESC LIMIT 100') });
});

router.post('/approvals/:id/decide', requireRole('OPS_MANAGER'), (req, res) => {
  const a = db.get('SELECT * FROM approvals WHERE id=?', [req.params.id]);
  if (!a) return res.status(404).json(problem(req, 404, 'Not Found', 'Approval not found'));
  if (a.status !== 'PENDING') return res.status(400).json(problem(req, 400, 'Invalid request', `Already ${a.status}`));
  const { approve } = req.body || {};
  const now = nowIso();
  db.run(`UPDATE approvals SET status=?, decided_by=?, decided_at=? WHERE id=?`, [approve ? 'APPROVED' : 'REJECTED', req.user.id, now, a.id]);
  if (approve && a.kind === 'refund') {
    const p = JSON.parse(a.payload || '{}');
    const { uid } = require('../../utils/ids');
    const rid = uid('ref');
    db.run('INSERT INTO refunds (id, order_id, amount, reason, status, created_at) VALUES (?,?,?,?,?,?)', [rid, p.orderId || a.reference_id, p.amount || 0, 'APPROVED_BY_ADMIN', 'SIMULATED_REFUND_COMPLETED', now]);
  }
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'approval.decided', entityType: 'approval', entityId: a.id, after: { approve: !!approve }, traceId: req.traceId });
  res.json({ ok: true, status: approve ? 'APPROVED' : 'REJECTED' });
});

module.exports = router;
