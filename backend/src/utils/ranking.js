'use strict';
// Deterministic weighted ranking per PRD §6.7:
// budget 30% + attribute/use-case 30% + rating 20% + availability 10% + preference 10%.
// Hard constraints (category, budget) filter first. Preferences never override budget.
const CATEGORY_ALIASES = {
  laptops: ['laptop', 'notebook', 'macbook', 'thinkpad'],
  smartphones: ['phone', 'mobile', 'smartphone', 'iphone', 'pixel'],
  appliances: ['appliance', 'vacuum', 'washer', 'fridge', 'air fryer', 'ac ', 'cooker'],
  accessories: ['mouse', 'headphone', 'earphone', 'keyboard', 'ssd', 'power bank', 'charger', 'cable'],
};

function detectCategory(query) {
  const q = String(query || '').toLowerCase();
  for (const [slug, words] of Object.entries(CATEGORY_ALIASES)) {
    if (words.some((w) => q.includes(w))) return slug;
  }
  return null;
}

function detectBudget(query) {
  const m = String(query || '').match(/(?:under|below|max|budget|less than|upto|up to)\s*\$?\s*(\d+(?:\.\d+)?)/i)
    || String(query || '').match(/\$\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

// Rule-based extraction (used when LLM unavailable, and to validate LLM output).
function ruleExtract(query) {
  const categorySlug = detectCategory(query);
  const max = detectBudget(query);
  const q = String(query || '').toLowerCase();
  const useCases = [];
  if (/java|develop|code|coding|program/.test(q)) useCases.push('development');
  if (/\bai\b|machine learning|\bml\b|gpu|train/.test(q)) useCases.push('ai projects');
  if (/photo|camera|photograph/.test(q)) useCases.push('photography');
  if (/game|gaming/.test(q)) useCases.push('gaming');
  if (/student|budget|cheap/.test(q)) useCases.push('budget');
  const requiredAttributes = {};
  const ramM = q.match(/(\d+)\s*gb\s*ram/);
  if (ramM) requiredAttributes.ram = [`${ramM[1]}GB`];
  else if (useCases.includes('development') || useCases.includes('ai projects') || useCases.includes('gaming')) requiredAttributes.ram = ['16GB', '32GB'];
  if (/ssd/.test(q) || useCases.includes('development')) requiredAttributes.storage = ['SSD'];
  if (/i7|ryzen 7/.test(q)) requiredAttributes.cpu = ['i7', 'Ryzen 7'];
  const vague = !categorySlug && max == null && Object.keys(requiredAttributes).length === 0 && query.trim().split(/\s+/).length < 4;
  return {
    intent: vague ? 'CLARIFY' : 'PRODUCT_RECOMMENDATION',
    categorySlug, max, useCases, requiredAttributes,
    clarifyingQuestion: vague ? 'Could you tell me the product category (laptop, phone, appliance, accessory) and your budget?' : null,
  };
}

function availabilityScore(inv) {
  if (inv > 10) return 1;
  if (inv > 3) return 0.8;
  if (inv > 0) return 0.5;
  return 0;
}

function attributeScore(product, constraints) {
  const attrs = {};
  for (const a of (product.attrs || [])) attrs[a.attribute_key.toLowerCase()] = String(a.attribute_value);
  const blob = Object.values(attrs).join(' ').toLowerCase();
  let score = 0.5, checks = 0;
  const req = constraints.requiredAttributes || {};
  // RAM check (numeric compare)
  if (req.ram && req.ram.length) {
    checks++;
    const nums = req.ram.map((r) => parseInt(r, 10)).filter(Boolean);
    const have = parseInt(attrs.ram || '0', 10) || 0;
    if (have >= Math.min(...nums)) score += 0.5;
    else if (have >= 8) score += 0.15;
  }
  if (req.storage && req.storage.length) {
    checks++;
    if (req.storage.some((s) => blob.includes(String(s).toLowerCase()))) score += 0.5;
  }
  if (req.cpu && req.cpu.length) {
    checks++;
    if (req.cpu.some((s) => blob.includes(String(s).toLowerCase()))) score += 0.5;
    else if (/(i5|i7|ryzen 5|ryzen 7)/i.test(blob)) score += 0.2;
  }
  // use-case bonuses
  const uc = (constraints.useCases || []).join(' ');
  if (/development|ai|gaming/.test(uc)) {
    if (parseInt(attrs.ram || '0', 10) >= 16) score += 0.2;
    if (/ssd/i.test(blob)) score += 0.15;
    if (/dedicated|rtx|ryzen 7|i7/i.test(blob)) score += 0.15;
  }
  if (/photography/.test(uc)) {
    const mp = parseInt(attrs.camera || '0', 10) || 0;
    if (mp >= 50) score += 0.4; else if (mp >= 12) score += 0.15;
  }
  return checks === 0 ? Math.min(1, score) : Math.min(1, score / (1 + checks * 0.5) + 0.4);
}

function rankProducts(products, constraints, prefs = {}) {
  const prefBrands = new Set((prefs.preferred_brands || []).map((b) => String(b).toLowerCase()));
  const ranked = products.map((p) => {
    const budgetFit = constraints.max != null
      ? (p.price <= constraints.max ? 1 : 0) // hard filter normally; partial credit if approximate
      : 0.7 + Math.min(0.3, 1000 / (p.price + 1000));
    const attrFit = attributeScore(p, constraints);
    const ratingFit = Math.min(1, (p.rating || 0) / 5);
    const availFit = availabilityScore(p.inventory ?? 0);
    const prefFit = prefBrands.size && prefBrands.has(String(p.brand || '').toLowerCase()) ? 1 : 0.5;
    const score = +(0.3 * budgetFit + 0.3 * attrFit + 0.2 * ratingFit + 0.1 * availFit + 0.1 * prefFit).toFixed(4);
    return { ...p, score };
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

function buildReason(product, constraints) {
  const parts = [];
  if (constraints.max != null) parts.push(`$${product.price} within your $${constraints.max} budget`);
  const attrs = {};
  for (const a of (product.attrs || [])) attrs[a.attribute_key] = a.attribute_value;
  const highlights = [];
  if (attrs.ram) highlights.push(`${attrs.ram} RAM`);
  if (attrs.cpu) highlights.push(`${attrs.cpu} processor`);
  if (attrs.storage) highlights.push(`${attrs.storage} storage`);
  if (attrs.camera) highlights.push(`${attrs.camera} camera`);
  if (attrs.gpu && /dedicated|rtx/i.test(attrs.gpu)) highlights.push('dedicated GPU for AI workloads');
  if (highlights.length) parts.push(`includes ${highlights.join(', ')}`);
  if ((constraints.useCases || []).length) parts.push(`suits ${(constraints.useCases || []).join(' + ')}`);
  parts.push(`rated ${product.rating}/5`);
  parts.push((product.inventory ?? 0) > 0 ? 'in stock' : 'currently out of stock');
  return `This ${product.category_name || 'product'} matches your needs: ${parts.join('; ')}.`;
}

module.exports = { detectCategory, detectBudget, ruleExtract, rankProducts, buildReason };
