'use strict';
const crypto = require('crypto');

function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}
function nowIso() {
  return new Date().toISOString();
}
function traceId() {
  return 'trace_' + crypto.randomBytes(6).toString('hex');
}
function orderNumber() {
  return 'ORD-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}
function trackingNumber() {
  return 'SIM-TRACK-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}
function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

module.exports = { uid, nowIso, traceId, orderNumber, trackingNumber, sha256 };
