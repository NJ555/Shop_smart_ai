'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = 'http://localhost:4000/api/v1';

test('Catalog and Product Discovery', async (t) => {
  await t.test('GET /categories - returns all active categories', async () => {
    const res = await fetch(`${BASE}/categories`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 4);
    const slugs = data.map((c) => c.slug);
    assert.ok(slugs.includes('laptops'));
    assert.ok(slugs.includes('smartphones'));
    assert.ok(slugs.includes('appliances'));
    assert.ok(slugs.includes('accessories'));
  });

  await t.test('GET /products/search - filters by category and price range', async () => {
    const res = await fetch(`${BASE}/products/search?category=laptops&maxPrice=1000`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.items));
    assert.ok(data.items.length >= 5);
    for (const item of data.items) {
      assert.equal(item.category, 'laptops');
      assert.ok(item.price <= 1000, `Expected price <= 1000, got ${item.price}`);
    }
  });

  await t.test('GET /products/:id - returns product details with attributes', async () => {
    const res = await fetch(`${BASE}/products/LAP101`);
    assert.equal(res.status, 200);
    const prod = await res.json();
    assert.equal(prod.productId, 'LAP101');
    assert.equal(prod.name, 'Dell Inspiron 15');
    assert.equal(prod.brand, 'Dell');
    assert.ok(prod.attributes.ram);
    assert.ok(prod.attributes.storage);
  });

  await t.test('GET /products/compare - compares 2-4 products', async () => {
    const res = await fetch(`${BASE}/products/compare?ids=LAP101,LAP102`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.items.length, 2);
    assert.equal(data.items[0].productId, 'LAP101');
    assert.equal(data.items[1].productId, 'LAP102');
  });
});
