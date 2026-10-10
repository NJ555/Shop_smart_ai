'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = 'http://localhost:4000/api/v1';

test('Identity and Auth System', async (t) => {
  const uniqueEmail = `test_${Date.now()}@example.com`;

  await t.test('POST /auth/register - creates new user and returns JWT', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
        fullName: 'Test Automation User',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.accessToken);
    assert.equal(data.user.email, uniqueEmail);
    assert.equal(data.user.role, 'CUSTOMER');
  });

  await t.test('POST /auth/register - rejects duplicate email with 409', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
        fullName: 'Test Duplicate',
      }),
    });
    assert.equal(res.status, 409);
  });

  await t.test('POST /auth/login - validates password and returns token', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.accessToken);
  });

  await t.test('POST /auth/login - rejects invalid password with 401', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'WrongPassword!',
      }),
    });
    assert.equal(res.status, 401);
  });

  await t.test('GET /auth/me - requires valid Authorization header', async () => {
    const res = await fetch(`${BASE}/auth/me`);
    assert.equal(res.status, 401);
  });
});
