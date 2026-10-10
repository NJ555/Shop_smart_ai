'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../../db');
const config = require('../../config');
const { uid, nowIso } = require('../../utils/ids');
const { authenticate, problem } = require('../../middleware/auth');
const { audit } = require('../../middleware/idempotency');

const router = express.Router();
const registerSchema = z.object({
  email: z.string().email(), password: z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/),
  fullName: z.string().min(2).max(100),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function signToken(u) {
  return jwt.sign(
    { sub: u.id, email: u.email, role: u.role, membership: u.membership_tier, iss: 'shopsmart-ai' },
    config.jwtSecret, { expiresIn: config.jwtExpiresIn }
  );
}
function publicUser(u) {
  return { id: u.id, email: u.email, fullName: u.full_name, role: u.role, membershipTier: u.membership_tier };
}

router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(problem(req, 400, 'Invalid request', parsed.error.issues.map((i) => i.message).join('; ')));
  const { email, password, fullName } = parsed.data;
  if (db.get('SELECT id FROM users WHERE email=?', [email.toLowerCase()])) {
    return res.status(409).json(problem(req, 409, 'Conflict', 'Email already registered'));
  }
  const id = uid('usr');
  const now = nowIso();
  db.run('INSERT INTO users (id, email, password_hash, full_name, role, membership_tier, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?, ?,?)',
    [id, email.toLowerCase(), bcrypt.hashSync(password, 10), fullName, 'CUSTOMER', 'BASIC', 'ACTIVE', now, now]);
  db.run('INSERT INTO customer_preferences (user_id, preferred_categories, preferred_brands, updated_at) VALUES (?,?,?,?)', [id, '[]', '[]', now]);
  const wid = uid('wsh');
  db.run('INSERT INTO wishlists (id, user_id, name, created_at) VALUES (?,?,?,?)', [wid, id, 'My Wishlist', now]);
  const cid = uid('cart');
  db.run('INSERT INTO carts (id, user_id, status, created_at, updated_at) VALUES (?,?,?,?,?)', [cid, id, 'ACTIVE', now, now]);
  const user = db.get('SELECT * FROM users WHERE id=?', [id]);
  audit({ actorId: id, actorType: 'USER', action: 'user.registered', entityType: 'user', entityId: id, after: publicUser(user), traceId: req.traceId });
  res.status(201).json({ accessToken: signToken(user), tokenType: 'Bearer', expiresIn: config.jwtExpiresIn, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(problem(req, 400, 'Invalid request', 'email and password required'));
  const user = db.get('SELECT * FROM users WHERE email=?', [parsed.data.email.toLowerCase()]);
  if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    return res.status(401).json(problem(req, 401, 'Unauthorized', 'Invalid email or password'));
  }
  if (user.status !== 'ACTIVE') return res.status(403).json(problem(req, 403, 'Forbidden', 'Account suspended'));
  res.json({ accessToken: signToken(user), tokenType: 'Bearer', expiresIn: config.jwtExpiresIn, user: publicUser(user) });
});

router.get('/me', authenticate(), (req, res) => {
  const user = db.get('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json(problem(req, 404, 'Not Found', 'User not found'));
  const prefs = db.get('SELECT * FROM customer_preferences WHERE user_id=?', [req.user.id]);
  res.json({ ...publicUser(user), preferences: prefs ? {
    preferredCategories: JSON.parse(prefs.preferred_categories || '[]'),
    preferredBrands: JSON.parse(prefs.preferred_brands || '[]'),
    budgetMin: prefs.budget_min, budgetMax: prefs.budget_max,
  } : null });
});

const prefsSchema = z.object({
  preferredCategories: z.array(z.string()).optional(),
  preferredBrands: z.array(z.string()).optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  fullName: z.string().min(2).max(100).optional(),
});
router.put('/preferences', authenticate(), (req, res) => {
  const parsed = prefsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(problem(req, 400, 'Invalid request', 'Invalid preferences'));
  const p = parsed.data;
  if (p.fullName) db.run('UPDATE users SET full_name=?, updated_at=? WHERE id=?', [p.fullName, nowIso(), req.user.id]);
  const existing = db.get('SELECT * FROM customer_preferences WHERE user_id=?', [req.user.id]);
  const next = {
    cats: p.preferredCategories ?? (existing ? JSON.parse(existing.preferred_categories || '[]') : []),
    brands: p.preferredBrands ?? (existing ? JSON.parse(existing.preferred_brands || '[]') : []),
    bmin: p.budgetMin !== undefined ? p.budgetMin : (existing ? existing.budget_min : null),
    bmax: p.budgetMax !== undefined ? p.budgetMax : (existing ? existing.budget_max : null),
  };
  db.run(`INSERT INTO customer_preferences (user_id, preferred_categories, preferred_brands, budget_min, budget_max, updated_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET preferred_categories=excluded.preferred_categories,
    preferred_brands=excluded.preferred_brands, budget_min=excluded.budget_min, budget_max=excluded.budget_max, updated_at=excluded.updated_at`,
    [req.user.id, JSON.stringify(next.cats), JSON.stringify(next.brands), next.bmin, next.bmax, nowIso()]);
  res.json({ ok: true });
});

module.exports = router;
