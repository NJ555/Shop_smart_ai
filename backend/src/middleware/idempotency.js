'use strict';
const db = require('../db');
const { uid, nowIso } = require('../utils/ids');

// Idempotency store: Idempotency-Key header -> cached JSON response (24h).
function checkReplay(key) {
  if (!key) return null;
  const row = db.get('SELECT response_json FROM idempotency_keys WHERE key=?', [key]);
  if (!row) return null;
  try { return { ...JSON.parse(row.response_json), replayed: true }; } catch { return null; }
}
function storeKey(key, endpoint, requestHash, responseObj) {
  if (!key) return;
  const now = nowIso();
  const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  db.run(`INSERT OR REPLACE INTO idempotency_keys (key, endpoint, request_hash, response_json, created_at, expires_at)
    VALUES (?,?,?,?,?,?)`, [key, endpoint, requestHash, JSON.stringify(responseObj), now, exp]);
}

function audit({ actorId = null, actorType = 'SYSTEM', action, entityType, entityId, before = null, after = null, traceId = '' }) {
  db.run(`INSERT INTO audit_logs (id, actor_id, actor_type, action, entity_type, entity_id, before_json, after_json, trace_id, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [uid('aud'), actorId, actorType, action, entityType, String(entityId), before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, traceId, nowIso()]);
}

function outbox({ aggregateType, aggregateId, eventType, payload }) {
  // Transactional outbox: writers insert PENDING in the same logical step as the
  // domain change; a background poller (utils/outboxPoller.js) dispatches to
  // in-process listeners and marks SENT. Kafka-ready: swap poller target later.
  db.run(`INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload, status, created_at)
    VALUES (?,?,?,?,?,?,?)`, [uid('evt'), aggregateType, String(aggregateId), eventType, JSON.stringify(payload), 'PENDING', nowIso()]);
}

module.exports = { checkReplay, storeKey, audit, outbox };
