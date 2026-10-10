'use strict';
const express = require('express');
const db = require('../../db');
const { uid, nowIso, traceId } = require('../../utils/ids');
const { authenticate, problem } = require('../../middleware/auth');
const { sanitizeQuery } = require('../../utils/sanitize');
const { chatComplete, extractJson } = require('../../utils/llm');
const {
  extractConstraintsWithLangChain,
  interpretShoppingNeedWithLangChain,
  answerRagWithLangChain,
} = require('../../utils/langchain');
const { EXTRACTION_SYSTEM, RAG_SYSTEM } = require('../../utils/prompts');
const { ruleExtract, rankProducts, buildReason } = require('../../utils/ranking');
const { retrieveChunks } = require('../../utils/retrieval');
const { enrichProduct } = require('../catalog/routes');
const agentService = require('../agent/service');

const router = express.Router();
router.use(authenticate());

const SLUG_BY_HINT = { laptop: 'laptops', notebook: 'laptops', phone: 'smartphones', mobile: 'smartphones', smartphone: 'smartphones', appliance: 'appliances', accessory: 'accessories', accessories: 'accessories' };
function hintToSlug(hint) {
  if (!hint) return null;
  const h = String(hint).toLowerCase();
  for (const [k, v] of Object.entries(SLUG_BY_HINT)) if (h.includes(k)) return v;
  return null;
}

function getPrefs(userId) {
  const p = db.get('SELECT * FROM customer_preferences WHERE user_id=?', [userId]);
  if (!p) return {};
  return { preferred_brands: JSON.parse(p.preferred_brands || '[]'), preferred_categories: JSON.parse(p.preferred_categories || '[]') };
}

function saveConversation(userId, type, query, answer, meta) {
  const cid = uid('conv');
  db.run('INSERT INTO assistant_conversations (id, user_id, assistant_type, created_at) VALUES (?,?,?,?)', [cid, userId, type, nowIso()]);
  db.run('INSERT INTO assistant_messages (id, conversation_id, role, content, metadata, created_at) VALUES (?,?,?,?,?,?)', [uid('ams'), cid, 'USER', query, '{}', nowIso()]);
  db.run('INSERT INTO assistant_messages (id, conversation_id, role, content, metadata, created_at) VALUES (?,?,?,?,?,?)', [uid('ams'), cid, 'ASSISTANT', answer, JSON.stringify(meta || {}), nowIso()]);
  return cid;
}

// ---------- SHOPPING ----------
router.post('/shopping/query', async (req, res) => {
  const trace = traceId();
  const { sanitized, injectionFlagged } = sanitizeQuery((req.body || {}).query, 1000);
  if (!sanitized) return res.status(400).json(problem(req, 400, 'Invalid request', 'query required'));
  let constraints = null;
  let llmUsed = false;
  // 1) LangChain LCEL constraint extraction (primary)
  const r = ruleExtract(sanitized);
  try {
    const j = await extractConstraintsWithLangChain(sanitized);
    llmUsed = true;
    const catSlug = hintToSlug(j.categoryHint) || r.categorySlug;
    const budgetMax = j.budget && j.budget.max != null ? Number(j.budget.max) : r.max;
    const resolvedIntent = (j.intent === 'CLARIFY' && (catSlug || budgetMax != null))
      ? 'PRODUCT_RECOMMENDATION'
      : (j.intent || 'PRODUCT_RECOMMENDATION');

    constraints = {
      intent: resolvedIntent,
      categorySlug: catSlug,
      max: budgetMax,
      useCases: Array.isArray(j.useCases) && j.useCases.length ? j.useCases : r.useCases,
      requiredAttributes: (j.requiredAttributes && Object.keys(j.requiredAttributes).length) ? j.requiredAttributes : r.requiredAttributes,
      clarifyingQuestion: (resolvedIntent === 'CLARIFY') ? (j.clarifyingQuestion || r.clarifyingQuestion) : null,
      engine: 'langchain-lcel',
    };
  } catch (e) {
    if (e.code === 'NO_LLM_KEY') {
      return res.status(503).json(problem(req, 503, 'AI Service Unavailable', 'DeepSeek LLM key is not configured. Set DEEPSEEK_API_KEY or TOKENHARBOR_API_KEY in .env'));
    }
    // Fallback: direct chatComplete
    try {
      const out = await chatComplete([
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: `Query: ${sanitized}` },
      ], { maxTokens: 400 });
      const j = extractJson(out);
      llmUsed = true;
      const catSlug = hintToSlug(j.categoryHint) || r.categorySlug;
      const budgetMax = j.budget && j.budget.max != null ? Number(j.budget.max) : r.max;
      const resolvedIntent = (j.intent === 'CLARIFY' && (catSlug || budgetMax != null))
        ? 'PRODUCT_RECOMMENDATION'
        : (j.intent || 'PRODUCT_RECOMMENDATION');

      constraints = {
        intent: resolvedIntent,
        categorySlug: catSlug,
        max: budgetMax,
        useCases: Array.isArray(j.useCases) && j.useCases.length ? j.useCases : r.useCases,
        requiredAttributes: (j.requiredAttributes && Object.keys(j.requiredAttributes).length) ? j.requiredAttributes : r.requiredAttributes,
        clarifyingQuestion: (resolvedIntent === 'CLARIFY') ? (j.clarifyingQuestion || r.clarifyingQuestion) : null,
      };
    } catch {
      // deterministic fallback on network or parsing error
      constraints = { intent: r.intent, categorySlug: r.categorySlug, max: r.max, useCases: r.useCases, requiredAttributes: r.requiredAttributes, clarifyingQuestion: r.clarifyingQuestion, fallback: e.code || 'LLM_ERROR' };
    }
  }
  if (constraints.max != null && constraints.max <= 0) {
    return res.status(400).json(problem(req, 400, 'Invalid request', 'budget must be greater than 0'));
  }
  if (constraints.intent === 'CLARIFY' || (!constraints.categorySlug && constraints.max == null)) {
    const cq = constraints.clarifyingQuestion || 'Could you share the category (laptop, phone, appliance, accessory) and your budget?';
    const cid = saveConversation(req.user.id, 'SHOPPING', sanitized, cq, { traceId: trace, llmUsed, injectionFlagged });
    return res.json({ conversationId: cid, recommendations: [], clarifyingQuestion: cq, traceId: trace, engine: 'langchain-lcel' });
  }
  // 2) Catalog grounding — DB ONLY
  let rows = db.all(`SELECT p.*, c.slug as cat_slug, c.name as cat_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.is_active=1`);
  if (constraints.categorySlug) rows = rows.filter((p) => p.cat_slug === constraints.categorySlug);
  if (constraints.max != null) rows = rows.filter((p) => p.price <= constraints.max);
  const products = rows.map((p) => {
    const e = enrichProduct({ id: p.id, name: p.name, slug: p.slug, category_id: p.category_id, brand: p.brand, description: p.description, price: p.price, rating: p.rating, is_active: p.is_active });
    return { ...e, attrs: db.all('SELECT attribute_key, attribute_value FROM product_attributes WHERE product_id=?', [p.id]), category_name: p.cat_name };
  });
  if (!products.length) {
    const msg = constraints.max != null
      ? `No ${constraints.categorySlug || 'products'} under $${constraints.max} currently match all requirements. You can increase the budget or remove specific requirements.`
      : `No matching products found. Try broadening the category or budget.`;
    const cid = saveConversation(req.user.id, 'SHOPPING', sanitized, msg, { traceId: trace, llmUsed, constraints });
    return res.json({ conversationId: cid, recommendations: [], clarifyingQuestion: null, message: msg, traceId: trace, engine: 'langchain-lcel' });
  }
  // 3) Deterministic ranking + factual explanations
  const ranked = rankProducts(products, constraints, getPrefs(req.user.id)).slice(0, 5);
  // 4) LangChain LCEL chain for the interpreted-requirement sentence
  let interpreted = `${constraints.categorySlug ? constraints.categorySlug : 'Products'}${constraints.max != null ? ` under $${constraints.max}` : ''}${constraints.useCases.length ? ` for ${constraints.useCases.join(', ')}` : ''}`;
  try {
    const label = await interpretShoppingNeedWithLangChain(sanitized);
    if (label) interpreted = label;
    llmUsed = true;
  } catch { /* keep template */ }
  const recommendations = ranked.map((p) => ({
    productId: p.productId, productName: p.name,
    reason: buildReason(p, constraints),
    price: p.price, rating: p.rating, availability: p.availability,
    matchType: constraints.max != null && p.price <= constraints.max ? 'EXACT' : 'APPROXIMATE',
    score: p.score,
  }));
  const cid = saveConversation(req.user.id, 'SHOPPING', sanitized, JSON.stringify(recommendations.map((r) => r.productId)), { traceId: trace, llmUsed, injectionFlagged, constraints, productIds: recommendations.map((r) => r.productId) });
  res.json({ conversationId: cid, interpretedRequirement: interpreted, budget: constraints.max ?? null, recommendations, clarifyingQuestion: null, traceId: trace, engine: 'langchain-lcel' });
});

// ---------- KNOWLEDGE (RAG) ----------
router.post('/knowledge/query', async (req, res) => {
  const trace = traceId();
  const { query, region = null, category = null } = req.body || {};
  const { sanitized } = sanitizeQuery(query, 1000);
  if (!sanitized) return res.status(400).json(problem(req, 400, 'Invalid request', 'query required'));
  const { chunks, confidence } = retrieveChunks(sanitized, { region, category, topK: 5 });
  if (!chunks.length || confidence === 'NONE') {
    const answer = "I don't have enough approved information to answer that accurately.";
    const cid = saveConversation(req.user.id, 'KNOWLEDGE', sanitized, answer, { traceId: trace, confidence: 'NONE', event: 'NO_EVIDENCE' });
    return res.json({ answer, confidence: 'NONE', sources: [], followUpRequired: true, traceId: trace, conversationId: cid, engine: 'langchain-lcel' });
  }
  const context = chunks.map((c, i) => `[${i + 1}] (${c.document} §${c.section} v${c.version}): ${c.content.slice(0, 1200)}`).join('\n');
  let answer = '';
  try {
    answer = await answerRagWithLangChain(context, sanitized);
  } catch (e) {
    if (e.code === 'NO_LLM_KEY') {
      return res.status(503).json(problem(req, 503, 'AI Service Unavailable', 'DeepSeek LLM key is not configured. Set DEEPSEEK_API_KEY or TOKENHARBOR_API_KEY in .env'));
    }
    // grounded fallback: stitch top chunk sentences
    answer = chunks[0].content.split('. ').slice(0, 3).join('. ').slice(0, 600);
  }
  if (!answer) answer = "I don't have enough approved information to answer that accurately.";
  const sources = chunks.slice(0, 3).map((c) => ({ document: c.document, section: c.section, version: c.version, effectiveDate: c.effectiveDate, chunkId: c.chunkId }));
  const cid = saveConversation(req.user.id, 'KNOWLEDGE', sanitized, answer, { traceId: trace, confidence, chunkIds: chunks.map((c) => c.chunkId) });
  res.json({ answer, confidence, sources, followUpRequired: confidence === 'NONE' || confidence === 'LOW', traceId: trace, conversationId: cid, engine: 'langchain-lcel' });
});

// ---------- OPS (agentic) ----------
router.post('/ops/query', async (req, res) => {
  const trace = traceId();
  const { sanitized } = sanitizeQuery((req.body || {}).query, 1000);
  if (!sanitized) return res.status(400).json(problem(req, 400, 'Invalid request', 'query required'));
  const result = await agentService.handleOpsQuery({ user: req.user, query: sanitized, traceId: trace });
  const cid = saveConversation(req.user.id, 'OPS', sanitized, result.answer, { traceId: trace, agentRunId: result.agentRunId });
  res.json({ ...result, conversationId: cid, traceId: trace });
});

module.exports = router;
