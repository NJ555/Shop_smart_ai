'use strict';
require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const db = require('./db');
const { traceId } = require('./utils/ids');
const { rateLimit } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));
app.use((req, res, next) => { req.traceId = req.headers['x-trace-id'] || traceId(); res.setHeader('x-trace-id', req.traceId); next(); });

// ensure schema exists (safe: IF NOT EXISTS)
try {
  const schema = fs.readFileSync(require('path').join(__dirname, '..', '..', 'db', 'schema.sql'), 'utf8');
  db.exec(schema);
  const u = db.get('SELECT COUNT(*) c FROM users');
  if (u && u.c === 0) console.warn('[boot] DB empty — run: npm run seed');
} catch (e) {
  console.warn('[boot] schema check skipped:', e.message);
}

app.get('/', (req, res) => res.json({ service: 'shopsmart-ai-backend', version: '1.0.0', stack: 'Node.js + Express (SQLite local, TokenHarbor LLM)', docs: '/api/v1/health' }));
app.get('/api/v1/health', (req, res) => {
  const llm = config.llm.apiKey ? 'configured' : 'missing';
  res.json({ ok: true, db: 'sqlite', llm, model: config.llm.model, traceId: req.traceId });
});

const authRate = rateLimit({ group: 'auth', max: 60, windowMs: 60000 });
const aiRate = rateLimit({ group: 'ai', max: 40, windowMs: 60000 });

app.use('/api/v1/auth', authRate, require('./modules/identity/routes'));
app.use('/api/v1', require('./modules/catalog/routes'));
app.use('/api/v1/wishlist', require('./modules/wishlist/routes'));
app.use('/api/v1/cart', require('./modules/cart/routes'));
app.use('/api/v1/orders', require('./modules/order/routes'));
app.use('/api/v1/support', require('./modules/support/routes'));
app.use('/api/v1/assistant', aiRate, require('./modules/assistant/routes'));
app.use('/api/v1/agent', require('./modules/agent/routes'));
// knowledge: customer-safe list under /knowledge, admin write under /admin/knowledge
app.use('/api/v1/knowledge', require('./modules/knowledge/routes'));
app.use('/api/v1/admin/knowledge', require('./modules/knowledge/routes'));
app.use('/api/v1/admin', require('./modules/admin/routes'));
app.use('/api/v1/audit', require('./modules/audit/routes'));

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`ShopSmart AI backend (Node+Express) on http://localhost:${config.port}/api/v1`);
  console.log(`Health: http://localhost:${config.port}/api/v1/health`);
});
