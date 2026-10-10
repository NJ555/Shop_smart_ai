'use strict';
// In-memory sliding-window rate limiter (per IP + group). Local-MVP grade.
const buckets = new Map();
function rateLimit({ group = 'default', max = 60, windowMs = 60000 } = {}) {
  return (req, res, next) => {
    const key = `${group}:${req.ip}`;
    const now = Date.now();
    const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      return res.status(429).json({
        type: 'https://shopsmart.ai/errors/rate-limited', title: 'Too Many Requests', status: 429,
        detail: `Rate limit ${max}/min exceeded for ${group}`, instance: req.originalUrl, traceId: req.traceId,
      });
    }
    arr.push(now);
    buckets.set(key, arr);
    next();
  };
}
module.exports = { rateLimit };
