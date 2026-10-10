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

test('Cart and Order Lifecycle', async (t) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  await t.test('DELETE /cart - clears active cart for clean state', async () => {
    const res = await fetch(`${BASE}/cart`, { method: 'DELETE', headers });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.items.length, 0);
  });

  await t.test('POST /cart/items - adds item to cart and validates stock', async () => {
    const res = await fetch(`${BASE}/cart/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ productId: 'ACC401', quantity: 2 }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.count, 2);
    assert.ok(data.subtotal > 0);
  });

  let createdOrderId = null;
  const idemKey = `idem_${Date.now()}_${Math.random()}`;

  await t.test('POST /orders - executes simulated checkout with idempotency', async () => {
    const cartRes = await fetch(`${BASE}/cart`, { headers });
    const cart = await cartRes.json();

    const checkoutPayload = {
      cartId: cart.cartId,
      shippingAddress: {
        line1: '123 Innovation Way',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
      },
      paymentMode: 'SIMULATED',
    };

    // First checkout call
    const res1 = await fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idemKey },
      body: JSON.stringify(checkoutPayload),
    });
    assert.equal(res1.status, 201);
    const order1 = await res1.json();
    assert.ok(order1.orderId);
    assert.equal(order1.status, 'CONFIRMED');
    createdOrderId = order1.orderId;

    // Second checkout call with EXACT same idempotency key -> MUST return exact same order without charging again
    const res2 = await fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idemKey },
      body: JSON.stringify(checkoutPayload),
    });
    const order2 = await res2.json();
    assert.equal(order2.orderId, order1.orderId);
    assert.equal(order2.orderNumber, order1.orderNumber);
  });

  await t.test('GET /orders/:id/shipment - returns shipment tracking events', async () => {
    assert.ok(createdOrderId);
    const res = await fetch(`${BASE}/orders/${createdOrderId}/shipment`, { headers });
    assert.equal(res.status, 200);
    const shipment = await res.json();
    assert.ok(shipment.trackingNumber);
    assert.ok(Array.isArray(shipment.events));
    assert.ok(shipment.events.length >= 1);
  });

  await t.test('POST /orders/:id/cancel - cancels unfulfilled order and initiates refund', async () => {
    assert.ok(createdOrderId);
    const cancelRes = await fetch(`${BASE}/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: 'Found alternative' }),
    });
    assert.equal(cancelRes.status, 200);
    const canceled = await cancelRes.json();
    assert.equal(canceled.status, 'CANCELLED');
    assert.ok(canceled.refundStatus.startsWith('SIMULATED_REFUND'));
  });
});
