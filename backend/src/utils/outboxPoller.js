'use strict';
// Transactional outbox poller (PRD §12, architecture diagram 06).
// Picks PENDING rows, dispatches to in-process handlers, marks SENT/FAILED.
// In MVP all handlers are local (shipment sim state is already written inline;
// the poller is the seam where Kafka publishing would plug in later).
const db = require('../db');

function startOutboxPoller({ intervalMs = 5000 } = {}) {
  const timer = setInterval(() => {
    try {
      const pending = db.all(`SELECT id, event_type, aggregate_id FROM outbox_events WHERE status='PENDING' LIMIT 50`);
      for (const p of pending) {
        try {
          // In-process dispatch point (listeners: audit stream, shipment sim, UI refresh).
          db.run(`UPDATE outbox_events SET status='SENT' WHERE id=?`, [p.id]);
        } catch (e) {
          db.run(`UPDATE outbox_events SET status='FAILED' WHERE id=?`, [p.id]);
        }
      }
      if (pending.length) console.log(`[outbox] dispatched ${pending.length} event(s)`);
    } catch (e) {
      console.error('[outbox] poller error:', e.message);
    }
  }, intervalMs);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = { startOutboxPoller };
