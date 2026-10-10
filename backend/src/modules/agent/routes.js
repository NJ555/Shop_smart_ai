'use strict';
const express = require('express');
const db = require('../../db');
const { uid, nowIso, sha256 } = require('../../utils/ids');
const { authenticate, requireRole, problem } = require('../../middleware/auth');
const { checkReplay, storeKey, audit } = require('../../middleware/idempotency');
const { tools, logToolCall } = require('./service');

const router = express.Router();
router.use(authenticate());

// POST /agent/actions/execute — audited, idempotent mutation entry-point
router.post('/actions/execute', (req, res) => {
  const idemKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
  if (idemKey) {
    const replay = checkReplay(idemKey);
    if (replay) return res.json(replay);
  }
  const { agentRunId = null, tool, input = {} } = req.body || {};
  const def = tools[tool];
  if (!def) return res.status(400).json(problem(req, 400, 'Invalid request', `Unknown tool ${tool}`));
  if (!def.roles.includes(req.user.role) && req.user.role !== 'ADMIN') {
    audit({ actorId: req.user.id, actorType: 'AGENT', action: 'tool.blocked', entityType: 'tool', entityId: tool, after: { input }, traceId: req.traceId });
    return res.status(403).json(problem(req, 403, 'Forbidden', `Role ${req.user.role} cannot call ${tool}`));
  }
  const runId = agentRunId || (() => {
    const id = uid('run');
    db.run('INSERT INTO agent_runs (id, user_id, intent, selected_agent, status, input_query, result, approval_status, trace_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, req.user.id, 'MANUAL_TOOL_CALL', 'Manual', 'RUNNING', tool, '{}', 'NOT_REQUIRED', req.traceId, nowIso()]);
    return id;
  })();
  let result;
  try {
    result = def.run(input, req.user);
  } catch (e) {
    result = { ok: false, error: 'TOOL_EXCEPTION', message: e.message };
  }
  logToolCall(runId, tool, input, result);
  db.run(`UPDATE agent_runs SET status=?, result=?, completed_at=? WHERE id=?`, [result.ok ? 'COMPLETED' : 'FAILED', JSON.stringify(result).slice(0, 4000), nowIso(), runId]);
  audit({ actorId: req.user.id, actorType: 'AGENT', action: `tool.${tool}`, entityType: 'agent_run', entityId: runId, after: { tool, ok: result.ok }, traceId: req.traceId });
  if (idemKey) storeKey(idemKey, `tool:${tool}`, sha256(JSON.stringify(input)), result);
  if (!result.ok) return res.status(422).json(result);
  res.json({ agentRunId: runId, ...result });
});

router.get('/runs', requireRole('SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN'), (req, res) => {
  const rows = db.all('SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 100');
  const out = rows.map((r) => ({ ...r, result: safeJson(r.result) }));
  res.json({ items: out });
});

router.get('/runs/:id', requireRole('SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN'), (req, res) => {
  const r = db.get('SELECT * FROM agent_runs WHERE id=?', [req.params.id]);
  if (!r) return res.status(404).json(problem(req, 404, 'Not Found', 'Run not found'));
  const calls = db.all('SELECT * FROM agent_tool_calls WHERE agent_run_id=? ORDER BY started_at', [r.id]);
  res.json({ ...r, result: safeJson(r.result), toolCalls: calls.map((c) => ({ ...c, input: safeJson(c.input_json), output: safeJson(c.output_json) })) });
});

// approvals
router.get('/approvals', requireRole('OPS_MANAGER', 'ADMIN'), (req, res) => {
  res.json({ items: db.all('SELECT * FROM approvals ORDER BY created_at DESC LIMIT 100') });
});

router.post('/approvals/:id/decide', requireRole('OPS_MANAGER', 'ADMIN'), (req, res) => {
  const a = db.get('SELECT * FROM approvals WHERE id=?', [req.params.id]);
  if (!a) return res.status(404).json(problem(req, 404, 'Not Found', 'Approval not found'));
  if (a.status !== 'PENDING') return res.status(400).json(problem(req, 400, 'Invalid request', `Already ${a.status}`));
  const { approve } = req.body || {};
  const now = nowIso();
  db.run(`UPDATE approvals SET status=?, decided_by=?, decided_at=? WHERE id=?`, [approve ? 'APPROVED' : 'REJECTED', req.user.id, now, a.id]);
  if (approve && a.kind === 'refund') {
    const p = JSON.parse(a.payload || '{}');
    const rid = uid('ref');
    db.run('INSERT INTO refunds (id, order_id, amount, reason, status, created_at) VALUES (?,?,?,?,?,?)', [rid, p.orderId || a.reference_id, p.amount || 0, 'APPROVED_BY_ADMIN', 'SIMULATED_REFUND_COMPLETED', now]);
  }
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'approval.decided', entityType: 'approval', entityId: a.id, after: { approve: !!approve }, traceId: req.traceId });
  res.json({ ok: true, status: approve ? 'APPROVED' : 'REJECTED' });
});

function safeJson(s) { try { return JSON.parse(s || '{}'); } catch { return {}; } }

module.exports = router;
