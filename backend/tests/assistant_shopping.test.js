'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = 'http://localhost:4000/api/v1';

async function getAuthToken(email = 'customer@example.com', password = 'Password123') {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.accessToken;
}

test('AI Shopping Assistant Queries & Grounding', async (t) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  await t.test('POST /assistant/shopping/query - grounded laptop recommendation under $1000', async () => {
    const res = await fetch(`${BASE}/assistant/shopping/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'Suggest a laptop under 1000 dollars for Java development and AI projects' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.conversationId);
    assert.ok(data.recommendations.length > 0);
    assert.equal(data.clarifyingQuestion, null);

    // Verify all returned products are real catalog products within budget
    for (const rec of data.recommendations) {
      assert.ok(rec.productId);
      assert.ok(rec.price <= 1000, `Expected price <= 1000, got ${rec.price}`);
      assert.ok(rec.reason);
      assert.ok(rec.score > 0);
    }
  });

  await t.test('POST /assistant/shopping/query - clarifies vague query', async () => {
    const res = await fetch(`${BASE}/assistant/shopping/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'something nice' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.clarifyingQuestion);
    assert.equal(data.recommendations.length, 0);
  });

  await t.test('POST /assistant/shopping/query - handles tight budget without matching products', async () => {
    const res = await fetch(`${BASE}/assistant/shopping/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'laptop under 100 dollars' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.recommendations.length, 0);
    assert.ok(data.message.includes('No laptops under $100') || data.message.includes('No matching products'));
  });
});
