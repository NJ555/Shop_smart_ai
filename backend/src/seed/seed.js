'use strict';
// Seed: builds db/shopsmart.db from schema.sql + seed-data.json + knowledge_docs/*.md
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'db', 'shopsmart.db');
const SCHEMA = fs.readFileSync(path.join(ROOT, 'db', 'schema.sql'), 'utf8');
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, 'db', 'seed-data.json'), 'utf8'));

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
let unlinked = false;
try {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    unlinked = true;
  }
} catch {
  // Process is running, will drop tables
}
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode=WAL;');
if (!unlinked) {
  db.exec('PRAGMA foreign_keys=OFF;');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  for (const t of tables) {
    db.exec(`DROP TABLE IF EXISTS "${t.name}"`);
  }
}
db.exec('PRAGMA foreign_keys=ON;');
db.exec(SCHEMA);

const now = new Date().toISOString();
let n = 0;
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

// categories
const catBySlug = {};
for (const c of SEED.categories) {
  db.prepare('INSERT INTO categories (id, name, slug, parent_id, is_active, created_at) VALUES (?,?,?,?,?,?)').run(c.id, c.name, c.slug, null, 1, now);
  catBySlug[c.slug] = c.id;
}
// products
for (const p of SEED.products) {
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  db.prepare('INSERT INTO products (id, name, slug, category_id, brand, description, price, rating, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(p.id, p.name, slug, catBySlug[p.category], p.brand, p.description, p.price, p.rating, 1, now, now);
  let i = 0;
  for (const [k, v] of Object.entries(p.attributes || {})) {
    db.prepare('INSERT INTO product_attributes (id, product_id, attribute_key, attribute_value, display_order) VALUES (?,?,?,?,?)').run(uid('atr'), p.id, k, String(v), i++);
  }
  (p.images || []).forEach((url, j) => {
    db.prepare('INSERT INTO product_images (id, product_id, url, is_primary, display_order) VALUES (?,?,?,?,?)').run(uid('img'), p.id, url, j === 0 ? 1 : 0, j);
  });
  db.prepare('INSERT INTO inventory_levels (product_id, available_quantity, reserved_quantity, version, updated_at) VALUES (?,?,?,?,?)').run(p.id, p.inventory ?? 10, 0, 1, now);
  n++;
}
// users
const userIds = {};
for (const u of SEED.users) {
  const id = uid('usr');
  userIds[u.email] = id;
  db.prepare('INSERT INTO users (id, email, password_hash, full_name, role, membership_tier, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?, ?,?)')
    .run(id, u.email.toLowerCase(), bcrypt.hashSync(u.password, 10), u.fullName, u.role, u.membership, 'ACTIVE', now, now);
  db.prepare('INSERT INTO customer_preferences (user_id, preferred_categories, preferred_brands, updated_at) VALUES (?,?,?,?)').run(id, '[]', '[]', now);
  db.prepare('INSERT INTO wishlists (id, user_id, name, created_at) VALUES (?,?,?,?)').run(uid('wsh'), id, 'My Wishlist', now);
  db.prepare('INSERT INTO carts (id, user_id, status, created_at, updated_at) VALUES (?,?,?,?,?)').run(uid('cart'), id, 'ACTIVE', now, now);
}
// knowledge docs (ACTIVE) + chunks — local hashed embeddings, no network
const { embed } = require('../utils/embeddings');
const DOC_META = {
  return_policy: { title: 'Return Policy', category: 'RETURN_POLICY' },
  refund_policy: { title: 'Refund Policy', category: 'REFUND_POLICY' },
  shipping_policy: { title: 'Shipping Policy', category: 'SHIPPING_POLICY' },
  warranty_policy: { title: 'Warranty Policy', category: 'WARRANTY_POLICY' },
  membership_benefits: { title: 'Membership Benefits', category: 'MEMBERSHIP' },
};
const { chunkText } = require('../modules/knowledge/routes');
const crypto = require('crypto');
let chunksTotal = 0;
for (const [file, meta] of Object.entries(DOC_META)) {
  const fp = path.join(ROOT, 'db', 'knowledge_docs', `${file}.md`);
  if (!fs.existsSync(fp)) continue;
  const text = fs.readFileSync(fp, 'utf8');
  const id = uid('doc');
  db.prepare(`INSERT INTO knowledge_documents (id, title, category, version, effective_date, expiry_date, region, status, mime_type, checksum, file_text, uploaded_by, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, meta.title, meta.category, '2026.1', '2026-01-01', null, 'GLOBAL', 'ACTIVE', 'text/markdown', crypto.createHash('sha256').update(text).digest('hex'), text, userIds['knowledge@example.com'] || null, now);
  const chunks = chunkText(text);
  chunks.forEach((c, i) => {
    db.prepare('INSERT INTO knowledge_chunks (id, document_id, chunk_index, heading, content, embedding, metadata, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(uid('chk'), id, i, c.heading, c.content, JSON.stringify(embed(c.content)), JSON.stringify({ version: '2026.1', category: meta.category, region: 'GLOBAL' }), now);
    chunksTotal++;
  });
}
// 2 sample orders for customer@example.com
function makeOrder(num, email, items) {
  const userId = userIds[email];
  const oid = uid('ord');
  let subtotal = 0;
  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id=?').get(it.id);
    subtotal += p.price * it.qty;
  }
  const shipping = 0, tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);
  db.prepare(`INSERT INTO orders (id, order_number, user_id, status, currency, subtotal, shipping_fee, tax_simulated, total, membership_tier, shipping_address, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(oid, num, userId, 'CONFIRMED', 'USD', +subtotal.toFixed(2), shipping, tax, total, 'BASIC', JSON.stringify({ line1: '12 Main St', city: 'Seattle', state: 'WA', postalCode: '98101', country: 'US' }), now, now);
  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id=?').get(it.id);
    const attrs = db.prepare('SELECT attribute_key, attribute_value FROM product_attributes WHERE product_id=?').all(it.id);
    db.prepare('INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, attributes_snapshot) VALUES (?,?,?,?,?,?,?)')
      .run(uid('oit'), oid, it.id, p.name, p.price, it.qty, JSON.stringify(Object.fromEntries(attrs.map((a) => [a.attribute_key, a.attribute_value]))));
    db.prepare('UPDATE inventory_levels SET available_quantity=available_quantity-?, reserved_quantity=reserved_quantity+? WHERE product_id=?').run(it.qty, it.qty, it.id);
  }
  const sid = uid('shp');
  db.prepare('INSERT INTO shipments (id, order_id, status, carrier_simulated, tracking_number, eta, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(sid, oid, 'IN_TRANSIT', 'ShopSmart Logistics (SIM)', 'SIM-TRACK-' + num.replace('ORD-', ''), new Date(Date.now() + 4 * 864e5).toISOString(), now, now);
  return { oid, orderNumber: num };
}
const ord1001 = makeOrder('ORD-1001', 'customer@example.com', [{ id: 'LAP103', qty: 1 }]);
const ord1002 = makeOrder('ORD-1002', 'customer@example.com', [{ id: 'ACC401', qty: 2 }]);
const ord2001 = makeOrder('ORD-2001', 'prime@example.com', [{ id: 'PHN202', qty: 1 }]);

// Seed Sneha's wishlist (budget explorer)
const snehaId = userIds['sneha@example.com'];
if (snehaId) {
  const snehaWishlist = db.prepare('SELECT id FROM wishlists WHERE user_id=?').get(snehaId);
  if (snehaWishlist) {
    db.prepare('INSERT INTO wishlist_items (id, wishlist_id, product_id, added_at) VALUES (?,?,?,?)').run(uid('wsi'), snehaWishlist.id, 'LAP105', now);
    db.prepare('INSERT INTO wishlist_items (id, wishlist_id, product_id, added_at) VALUES (?,?,?,?)').run(uid('wsi'), snehaWishlist.id, 'PHN204', now);
    db.prepare('INSERT INTO wishlist_items (id, wishlist_id, product_id, added_at) VALUES (?,?,?,?)').run(uid('wsi'), snehaWishlist.id, 'ACC404', now);
  }
}

// Seed Meera's cart (appliance buyer)
const meeraId = userIds['meera@example.com'];
if (meeraId) {
  const meeraCart = db.prepare("SELECT id FROM carts WHERE user_id=? AND status='ACTIVE'").get(meeraId);
  if (meeraCart) {
    db.prepare('INSERT INTO cart_items (id, cart_id, product_id, quantity, added_at, updated_at) VALUES (?,?,?,?,?,?)').run(uid('cit'), meeraCart.id, 'HAP301', 1, now, now);
  }
}

// Seed a sample support ticket from Rahul (Prime)
const rahulId = userIds['prime@example.com'];
if (rahulId && ord2001) {
  const tktId = uid('tkt');
  db.prepare(`INSERT INTO support_tickets (id, user_id, order_id, category, status, priority, subject, created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(tktId, rahulId, ord2001.oid, 'SHIPPING', 'OPEN', 'HIGH', 'Delivery delay inquiry for ORD-2001', now);
  db.prepare(`INSERT INTO support_messages (id, ticket_id, sender_role, message, created_at) VALUES (?,?,?,?,?)`)
    .run(uid('msg'), tktId, 'CUSTOMER', 'Hi, can I check when ORD-2001 will arrive? Tracking says in transit.', now);
}

// Seed a sample pending approval for high-value refund ($1299 Asus ROG)
const aprId = uid('apr');
db.prepare(`INSERT INTO approvals (id, kind, reference_id, requested_by, reason, payload, status, created_at) VALUES (?,?,?,?,?,?,?,?)`)
  .run(aprId, 'refund', 'ORD-1004', userIds['customer@example.com'] || 'usr_customer', 'Customer requested return of high-value Asus ROG Strix', JSON.stringify({ orderId: 'ORD-1004', amount: 1299.0 }), 'PENDING', now);

console.log(`Seeded: ${n} products, ${SEED.users.length} users, 5 policy docs (${chunksTotal} chunks), 3 orders, 1 ticket, 1 approval -> ${DB_PATH}`);
db.close();
