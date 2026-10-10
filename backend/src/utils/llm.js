'use strict';
// Live DeepSeek LLM via OpenAI-compatible endpoint (TokenHarbor or Direct DeepSeek API).
// Primary path for all AI generation.
// Supports bounded retries, timeout protection, strict request validation, and safe error reporting.
const config = require('../config');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chatComplete(messages, { maxTokens = 800, temperature = 0.2, timeoutMs = 20000, maxRetries = 2 } = {}) {
  if (!config.llm.apiKey) {
    const err = new Error('DeepSeek / LLM API key not configured (set DEEPSEEK_API_KEY or TOKENHARBOR_API_KEY in .env)');
    err.code = 'NO_LLM_KEY';
    throw err;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    const err = new Error('Invalid request: messages array cannot be empty');
    err.code = 'INVALID_MESSAGES';
    throw err;
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.llm.apiKey}`,
        },
        body: JSON.stringify({
          model: config.llm.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const status = res.status;
        const err = new Error(`DeepSeek LLM HTTP ${status}: ${body.slice(0, 300)}`);
        err.code = 'LLM_HTTP_ERROR';
        err.status = status;

        // Retry on 429 rate limit or 5xx server errors
        if ((status === 429 || status >= 500) && attempt <= maxRetries) {
          lastError = err;
          await sleep(500 * Math.pow(2, attempt - 1));
          continue;
        }
        throw err;
      }

      const json = await res.json();
      const content = json.choices && json.choices[0] && json.choices[0].message
        ? json.choices[0].message.content : '';
      return String(content || '').trim();
    } catch (e) {
      if (e.name === 'AbortError') {
        const err = new Error(`DeepSeek LLM call timed out after ${timeoutMs}ms`);
        err.code = 'LLM_TIMEOUT';
        lastError = err;
      } else {
        lastError = e;
      }

      if (attempt <= maxRetries && (lastError.code === 'LLM_TIMEOUT' || lastError.code === 'LLM_HTTP_ERROR')) {
        await sleep(500 * Math.pow(2, attempt - 1));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(t);
    }
  }

  throw lastError;
}

// Extract first {...} JSON object from possibly fenced LLM output.
function extractJson(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No valid JSON found in LLM output');
  return JSON.parse(m[0]);
}

module.exports = { chatComplete, extractJson };

