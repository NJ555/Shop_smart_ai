'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { DIM, embed, cosine, keywordOverlap, hybridScore } = require('../src/utils/embeddings');
const { retrieveChunks } = require('../src/utils/retrieval');

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

test('Vector Embeddings and Hybrid RAG Engine', async (t) => {
  await t.test('embed() generates 128-dimensional L2-normalized vector', () => {
    const v1 = embed('return policy 30 days unopened item');
    assert.equal(v1.length, DIM);
    assert.equal(DIM, 128);

    let sumSq = 0;
    for (const x of v1) sumSq += x * x;
    const norm = Math.sqrt(sumSq);
    assert.ok(Math.abs(norm - 1.0) < 0.05, `Vector should be normalized, norm=${norm}`);
  });

  await t.test('cosine() calculates semantic vector similarity', () => {
    const v1 = embed('laptop return refund policy');
    const v2 = embed('laptop refund policy terms');
    const v3 = embed('banana orange apple smoothie');

    const sim12 = cosine(v1, v2);
    const sim13 = cosine(v1, v3);
    assert.ok(sim12 > sim13, `Relevant similarity ${sim12} should be higher than irrelevant ${sim13}`);
  });

  await t.test('retrieveChunks() retrieves relevant chunks with confidence', () => {
    const res = retrieveChunks('Can I return an opened laptop?');
    assert.ok(res.chunks.length > 0);
    assert.ok(res.chunks[0].document);
    assert.ok(res.chunks[0].section);
    assert.ok(['HIGH', 'MEDIUM'].includes(res.confidence));
  });

  await t.test('POST /assistant/knowledge/query - cited answer on supported query', async () => {
    const token = await getAuthToken();
    const res = await fetch(`${BASE}/assistant/knowledge/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: 'Can I return an opened laptop?' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.answer);
    assert.ok(data.sources.length > 0);
    assert.ok(['HIGH', 'MEDIUM'].includes(data.confidence));
    assert.ok(data.sources[0].document);
  });

  await t.test('POST /assistant/knowledge/query - safe fallback on unsupported query (hallucination prevention)', async () => {
    const token = await getAuthToken();
    const res = await fetch(`${BASE}/assistant/knowledge/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: 'What is the corporate jet maintenance policy for executive travel?' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.confidence, 'NONE');
    assert.equal(data.sources.length, 0);
    assert.equal(data.answer, "I don't have enough approved information to answer that accurately.");
  });
});
