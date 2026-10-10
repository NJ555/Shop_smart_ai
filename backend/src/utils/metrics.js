'use strict';
// Minimal observability counters (PRD §19.2): request counts, error counts,
// per-route latency averages, AI call latency + outcome distribution.
const counters = {
  startedAt: new Date().toISOString(),
  requests: 0,
  errors: 0,
  byRoute: {},
  ai: {
    shopping: { calls: 0, llmOk: 0, fallback: 0, latMs: [] },
    knowledge: { calls: 0, llmOk: 0, fallback: 0, byConfidence: {} },
    ops: { calls: 0, toolCalls: 0 },
  },
};

function keyFor(req) {
  const p = (req.path || '').replace(/\/[a-f0-9_]{6,}/gi, '/:id').replace(/ORD-[A-Z0-9]+/gi, 'ORD-:id');
  return `${req.method} ${req.baseUrl}${p}`;
}

function recorder(req, res, next) {
  const start = Date.now();
  counters.requests++;
  res.on('finish', () => {
    const k = keyFor(req);
    const e = counters.byRoute[k] || (counters.byRoute[k] = { calls: 0, errors: 0, avgMs: 0 });
    e.calls++;
    if (res.statusCode >= 400) { e.errors++; counters.errors++; }
    const ms = Date.now() - start;
    e.avgMs = Math.round((e.avgMs * (e.calls - 1) + ms) / e.calls);
  });
  next();
}

function recordAi(kind, info = {}) {
  const slot = counters.ai[kind];
  if (!slot) return;
  slot.calls++;
  if (info.llmOk) slot.llmOk++;
  if (info.fallback) slot.fallback++;
  if (info.latMs != null) {
    slot.latMs.push(info.latMs);
    if (slot.latMs.length > 100) slot.latMs.shift();
  }
  if (kind === 'knowledge' && info.confidence) {
    slot.byConfidence[info.confidence] = (slot.byConfidence[info.confidence] || 0) + 1;
  }
  if (kind === 'ops' && info.toolCalls != null) slot.toolCalls += info.toolCalls;
}

function snapshot() {
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  return {
    ...counters,
    ai: {
      shopping: { ...counters.ai.shopping, avgMs: avg(counters.ai.shopping.latMs), latMs: undefined },
      knowledge: { ...counters.ai.knowledge, avgMs: avg(counters.ai.knowledge.latMs), latMs: undefined },
      ops: counters.ai.ops,
    },
  };
}

module.exports = { recorder, recordAi, snapshot };
