'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = 'http://localhost:4000/api/v1';

async function getAuthToken(email, password = 'Password123') {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.accessToken;
}

test('Agentic Operations, RBAC, and Audit Logging', async (t) => {
  const customerToken = await getAuthToken('customer@example.com');
  const adminToken = await getAuthToken('admin@example.com');
  const opsToken = await getAuthToken('ops@example.com');

  await t.test('POST /assistant/ops/query - answers customer order status query', async () => {
    const res = await fetch(`${BASE}/assistant/ops/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ query: 'Where is my order ORD-1001?' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.answer);
    assert.ok(data.agentRunId);
    assert.equal(data.intent, 'TRACK_ORDER');
  });

  await t.test('POST /agent/actions/execute - role boundary blocks CUSTOMER from refund tool', async () => {
    const res = await fetch(`${BASE}/agent/actions/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        tool: 'refund.create_simulated',
        input: { orderId: 'ORD-1001', amount: 50 },
      }),
    });
    // Customer should be forbidden from directly issuing refunds
    assert.equal(res.status, 403);
  });

  await t.test('POST /agent/actions/execute - allowed for ADMIN', async () => {
    const res = await fetch(`${BASE}/agent/actions/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        tool: 'inventory.check',
        input: { productId: 'LAP101' },
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.ok);
    assert.equal(data.data.productId, 'LAP101');
  });

  await t.test('GET /admin/overview - accessible to staff, returns catalog & system metrics', async () => {
    const res = await fetch(`${BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${opsToken}` },
    });
    assert.equal(res.status, 200);
    const overview = await res.json();
    assert.ok(overview.products >= 50);
    assert.ok(overview.users >= 10);
  });
});
