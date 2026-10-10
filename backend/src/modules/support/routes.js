'use strict';
const express = require('express');
const db = require('../../db');
const { uid, nowIso } = require('../../utils/ids');
const { authenticate, problem } = require('../../middleware/auth');
const { audit } = require('../../middleware/idempotency');

const router = express.Router();
router.use(authenticate());

function ticketView(t) {
  const messages = db.all('SELECT * FROM support_messages WHERE ticket_id=? ORDER BY created_at', [t.id]);
  return { ...t, orderId: t.order_id, messages: messages.map((m) => ({ id: m.id, sender: m.sender_role, message: m.message, createdAt: m.created_at })) };
}

router.get('/tickets', (req, res) => {
  const staff = ['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN'].includes(req.user.role);
  const rows = staff
    ? db.all('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 100')
    : db.all('SELECT * FROM support_tickets WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  res.json({ items: rows.map(ticketView) });
});

router.post('/tickets', (req, res) => {
  const { orderId = null, category = 'GENERAL', subject = '', message = '', priority = 'MEDIUM' } = req.body || {};
  if (!subject && !message) return res.status(400).json(problem(req, 400, 'Invalid request', 'subject or message required'));
  const id = uid('tkt');
  const now = nowIso();
  db.run('INSERT INTO support_tickets (id, user_id, order_id, category, status, priority, subject, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [id, req.user.id, orderId, category, 'OPEN', priority, subject || message.slice(0, 80), now]);
  if (message) db.run('INSERT INTO support_messages (id, ticket_id, sender_role, message, created_at) VALUES (?,?,?,?,?)', [uid('msg'), id, req.user.role, message, now]);
  audit({ actorId: req.user.id, actorType: 'USER', action: 'ticket.created', entityType: 'ticket', entityId: id, after: { subject }, traceId: req.traceId });
  res.status(201).json(ticketView(db.get('SELECT * FROM support_tickets WHERE id=?', [id])));
});

router.get('/tickets/:id', (req, res) => {
  const t = db.get('SELECT * FROM support_tickets WHERE id=?', [req.params.id]);
  if (!t) return res.status(404).json(problem(req, 404, 'Not Found', 'Ticket not found'));
  if (t.user_id !== req.user.id && !['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json(problem(req, 403, 'Forbidden', 'Not your ticket'));
  }
  res.json(ticketView(t));
});

router.post('/tickets/:id/messages', (req, res) => {
  const t = db.get('SELECT * FROM support_tickets WHERE id=?', [req.params.id]);
  if (!t) return res.status(404).json(problem(req, 404, 'Not Found', 'Ticket not found'));
  const { message } = req.body || {};
  if (!message) return res.status(400).json(problem(req, 400, 'Invalid request', 'message required'));
  db.run('INSERT INTO support_messages (id, ticket_id, sender_role, message, created_at) VALUES (?,?,?,?,?)', [uid('msg'), t.id, req.user.role, message, nowIso()]);
  res.status(201).json({ ok: true });
});

router.post('/tickets/:id/escalate', (req, res) => {
  const t = db.get('SELECT * FROM support_tickets WHERE id=?', [req.params.id]);
  if (!t) return res.status(404).json(problem(req, 404, 'Not Found', 'Ticket not found'));
  db.run(`UPDATE support_tickets SET status='PENDING', priority='HIGH' WHERE id=?`, [t.id]);
  db.run('INSERT INTO support_messages (id, ticket_id, sender_role, message, created_at) VALUES (?,?,?,?,?)', [uid('msg'), t.id, 'SYSTEM', `Escalated by ${req.user.role}. Reason: ${(req.body || {}).reason || 'customer request'}`, nowIso()]);
  audit({ actorId: req.user.id, actorType: 'USER', action: 'ticket.escalated', entityType: 'ticket', entityId: t.id, traceId: req.traceId });
  res.json(ticketView(db.get('SELECT * FROM support_tickets WHERE id=?', [t.id])));
});

module.exports = router;
