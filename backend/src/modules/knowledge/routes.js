'use strict';
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const db = require('../../db');
const { uid, nowIso } = require('../../utils/ids');
const { authenticate, requireRole, problem } = require('../../middleware/auth');
const { audit } = require('../../middleware/idempotency');
const { embed } = require('../../utils/embeddings');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function chunkText(text, target = 2500, overlap = 200) {
  // section-aware: split on markdown headings first
  const sections = [];
  const lines = String(text || '').split('\n');
  let cur = { heading: 'General', buf: '' };
  for (const line of lines) {
    const h = line.match(/^#{1,3}\s+(.*)/);
    if (h) {
      if (cur.buf.trim()) sections.push(cur);
      cur = { heading: h[1].trim(), buf: '' };
    } else cur.buf += line + '\n';
  }
  if (cur.buf.trim()) sections.push(cur);
  const chunks = [];
  for (const s of sections) {
    const body = s.buf.trim();
    if (body.length <= target) { chunks.push({ heading: s.heading, content: `${s.heading}\n${body}` }); continue; }
    let start = 0;
    while (start < body.length) {
      chunks.push({ heading: s.heading, content: `${s.heading}\n${body.slice(start, start + target)}` });
      start += target - overlap;
    }
  }
  return chunks;
}

function ingestDocument(doc) {
  db.run('DELETE FROM knowledge_chunks WHERE document_id=?', [doc.id]);
  const chunks = chunkText(doc.file_text);
  const now = nowIso();
  chunks.forEach((c, i) => {
    db.run('INSERT INTO knowledge_chunks (id, document_id, chunk_index, heading, content, embedding, metadata, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [uid('chk'), doc.id, i, c.heading, c.content, JSON.stringify(embed(c.content)),
        JSON.stringify({ version: doc.version, category: doc.category, region: doc.region, effectiveDate: doc.effective_date }), now]);
  });
  return chunks.length;
}

router.get('/documents', authenticate(), (req, res) => {
  const staff = ['KNOWLEDGE_ADMIN', 'ADMIN', 'SUPPORT_AGENT', 'OPS_MANAGER'].includes(req.user.role);
  const rows = staff
    ? db.all('SELECT * FROM knowledge_documents ORDER BY created_at DESC')
    : db.all(`SELECT * FROM knowledge_documents WHERE status='ACTIVE' ORDER BY created_at DESC`);
  res.json({ items: rows.map((d) => ({ documentId: d.id, title: d.title, category: d.category, version: d.version, effectiveDate: d.effective_date, region: d.region, status: d.status, mimeType: d.mime_type })) });
});

router.post('/documents', authenticate(), requireRole('KNOWLEDGE_ADMIN'), upload.single('file'), (req, res) => {
  const { title, category = 'GENERAL', version = '2026.1', effectiveDate, region = 'GLOBAL' } = req.body || {};
  if (!title || !effectiveDate) return res.status(400).json(problem(req, 400, 'Invalid request', 'title and effectiveDate required'));
  let text = (req.body.text || '').toString();
  if (req.file) {
    const name = req.file.originalname.toLowerCase();
    if (name.endsWith('.pdf')) {
      const raw = req.file.buffer.toString('utf8');
      // naive text extraction: PDFs with real text contain readable strings
      const readable = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
      if (readable.length < 200) return res.status(422).json(problem(req, 422, 'Unprocessable', 'PDF is scanned or unparseable; upload markdown/text instead'));
      text = readable.slice(0, 60000);
    } else {
      text = req.file.buffer.toString('utf8').slice(0, 60000);
      // JSON flatten
      if (name.endsWith('.json')) {
        try { text = Object.entries(JSON.parse(text)).map(([k, v]) => `## ${k}\n${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n'); }
        catch { return res.status(400).json(problem(req, 400, 'Invalid request', 'Invalid JSON file')); }
      }
    }
  }
  if (!text || text.trim().length < 50) return res.status(400).json(problem(req, 400, 'Invalid request', 'Document text too short (upload file or text field)'));
  const id = uid('doc');
  const now = nowIso();
  const checksum = crypto.createHash('sha256').update(text).digest('hex');
  const doc = { id, title, category, version, effective_date: effectiveDate, expiry_date: null, region, status: 'DRAFT', mime_type: req.file ? req.file.mimetype : 'text/markdown', checksum, file_text: text, uploaded_by: req.user.id, created_at: now };
  db.run(`INSERT INTO knowledge_documents (id, title, category, version, effective_date, expiry_date, region, status, mime_type, checksum, file_text, uploaded_by, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [doc.id, doc.title, doc.category, doc.version, doc.effective_date, doc.expiry_date, doc.region, doc.status, doc.mime_type, doc.checksum, doc.file_text, doc.uploaded_by, doc.created_at]);
  const n = ingestDocument(doc);
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'knowledge.uploaded', entityType: 'document', entityId: id, after: { title, chunks: n }, traceId: req.traceId });
  res.status(201).json({ documentId: id, chunks: n, status: 'DRAFT' });
});

router.get('/documents/:id/chunks', authenticate(), requireRole('KNOWLEDGE_ADMIN'), (req, res) => {
  const rows = db.all('SELECT id, chunk_index, heading, substr(content,1,500) as preview FROM knowledge_chunks WHERE document_id=? ORDER BY chunk_index', [req.params.id]);
  res.json({ items: rows });
});

router.post('/documents/:id/activate', authenticate(), requireRole('KNOWLEDGE_ADMIN'), (req, res) => {
  const doc = db.get('SELECT * FROM knowledge_documents WHERE id=?', [req.params.id]);
  if (!doc) return res.status(404).json(problem(req, 404, 'Not Found', 'Document not found'));
  const before = { status: doc.status };
  // supersede previous ACTIVE same title+region
  db.run(`UPDATE knowledge_documents SET status='SUPERSEDED' WHERE title=? AND region=? AND status='ACTIVE' AND id!=?`, [doc.title, doc.region, doc.id]);
  db.run(`UPDATE knowledge_documents SET status='ACTIVE' WHERE id=?`, [doc.id]);
  audit({ actorId: req.user.id, actorType: 'ADMIN', action: 'knowledge.activated', entityType: 'document', entityId: doc.id, before, after: { status: 'ACTIVE' }, traceId: req.traceId });
  res.json({ ok: true, status: 'ACTIVE' });
});

module.exports = router;
module.exports.ingestDocument = ingestDocument;
module.exports.chunkText = chunkText;
