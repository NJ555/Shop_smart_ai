'use strict';
// Prompt-injection guard: strip control tokens, quarantine embedded instructions.
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+the\s+above/i,
  /disregard\s+(all\s+)?(prior|previous|system)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*/i,
  /<\s*system\s*>/i,
  /dan\s+mode/i,
  /do\s+anything\s+now/i,
  /override\s+(safety|system|policy)/i,
];

function sanitizeQuery(raw, maxLen = 1000) {
  const text = String(raw || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').slice(0, maxLen).trim();
  let flagged = false;
  for (const re of INJECTION_PATTERNS) {
    if (re.test(text)) { flagged = true; break; }
  }
  // Quarantine: collapse newlines, drop lines that look like injected directives
  const cleaned = text.split('\n').map((l) => l.trim()).filter((l) => {
    if (/^(system|assistant|user)\s*:/i.test(l) && l.length > 200) return false;
    return true;
  }).join(' ').replace(/\s+/g, ' ').trim();
  return { sanitized: cleaned, injectionFlagged: flagged };
}

module.exports = { sanitizeQuery };
