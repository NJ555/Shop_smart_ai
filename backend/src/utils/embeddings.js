'use strict';
// Local hashed TF embeddings (128-dim, L2-normalized) + cosine + keyword overlap.
// Stored as JSON in SQLite — no pgvector needed. Deterministic and offline-safe.
// Live LLM is used for *generation*; retrieval math stays local (production pattern
// for a local-first MVP; swap embed() with a hosted embedding API later).
const DIM = 128;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'what', 'when', 'where', 'who',
  'which', 'why', 'how', 'can', 'could', 'should', 'would', 'do',
  'does', 'did', 'have', 'had', 'or', 'if', 'this', 'my', 'your', 'our'
]);

function tokens(text, filterStopWords = false) {
  const list = String(text || '').toLowerCase().split(/[^a-z0-9$+.]+/).map((t) => t.trim()).filter((t) => t.length > 1);
  return filterStopWords ? list.filter((t) => !STOP_WORDS.has(t)) : list;
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function embed(text) {
  const v = new Array(DIM).fill(0);
  const toks = tokens(text, false);
  for (const t of toks) {
    v[hashStr(t) % DIM] += 1;
    // char-bigram backoff helps partial matches (e.g. "laptop" vs "laptops")
    if (t.length > 4) v[hashStr(t.slice(0, 5)) % DIM] += 0.3;
  }
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => +(x / norm).toFixed(6));
}

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function keywordOverlap(query, content) {
  const qList = tokens(query, true);
  const q = new Set(qList.length ? qList : tokens(query, false));
  if (!q.size) return 0;
  const c = new Set(tokens(content, false));
  let hit = 0;
  for (const t of q) if (c.has(t)) hit++;
  return hit / q.size;
}

// Bonus for exact budget/category signals present in chunk
function hybridScore(query, content, qEmb, cEmb) {
  const cos = cosine(qEmb, cEmb);
  const kw = keywordOverlap(query, content);
  return 0.6 * cos + 0.4 * kw;
}

module.exports = { DIM, tokens, embed, cosine, keywordOverlap, hybridScore };

