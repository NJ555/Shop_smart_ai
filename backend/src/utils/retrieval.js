'use strict';
const db = require('../db');
const { embed, hybridScore } = require('./embeddings');

function parseVec(s) {
  try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

// Hybrid retrieval: vector cosine (60%) + keyword overlap (40%), metadata-filtered.
function retrieveChunks(query, { region = null, category = null, topK = 5 } = {}) {
  const docs = db.all(`SELECT id, title, category, version, effective_date, region, status FROM knowledge_documents WHERE status='ACTIVE'`);
  const activeIds = new Set(docs.map((d) => d.id));
  if (!activeIds.size) return { chunks: [], confidence: 'NONE' };
  let rows = db.all(`SELECT c.*, d.title as doc_title, d.category as doc_category, d.version as doc_version, d.effective_date, d.region as doc_region
    FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id WHERE d.status='ACTIVE'`);
  if (region) rows = rows.filter((r) => !r.doc_region || r.doc_region === 'GLOBAL' || r.doc_region === region);
  if (category) rows = rows.filter((r) => r.doc_category === category || r.doc_category === 'GENERAL');
  const qEmb = embed(query);
  const scored = rows.map((r) => ({
    row: r,
    score: hybridScore(query, `${r.heading} ${r.content}`, qEmb, parseVec(r.embedding)),
  })).filter((s) => s.score >= 0.22).sort((a, b) => b.score - a.score).slice(0, topK);
  const chunks = scored.map((s) => ({
    chunkId: s.row.id,
    document: s.row.doc_title,
    section: s.row.heading,
    version: s.row.doc_version,
    effectiveDate: s.row.effective_date,
    content: s.row.content,
    score: +s.score.toFixed(4),
  }));
  let confidence = 'NONE';
  if (chunks.length) {
    const top = chunks[0].score;
    // contradiction: same category, different versions with divergent content
    const versions = new Set(chunks.map((c) => c.version));
    if (top >= 0.45) confidence = 'HIGH';
    else if (top >= 0.30) confidence = 'MEDIUM';
    else confidence = 'LOW';
    if (versions.size > 1 && chunks.length > 1 && Math.abs(chunks[0].score - chunks[1].score) < 0.08) confidence = 'LOW';
  }
  return { chunks, confidence };
}

module.exports = { retrieveChunks };
