'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json(problem(req, 401, 'Unauthorized', 'Missing bearer token'));
    }
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = { id: payload.sub, email: payload.email, role: payload.role, membership: payload.membership };
      next();
    } catch {
      return res.status(401).json(problem(req, 401, 'Unauthorized', 'Invalid or expired token'));
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json(problem(req, 401, 'Unauthorized', 'Login required'));
    if (roles.includes(req.user.role) || req.user.role === 'ADMIN') return next();
    return res.status(403).json(problem(req, 403, 'Forbidden', `Requires role: ${roles.join(', ')}`));
  };
}

function problem(req, status, title, detail) {
  return {
    type: 'https://shopsmart.ai/errors/' + title.toLowerCase().replace(/\s+/g, '-'),
    title, status, detail,
    instance: req.originalUrl,
    traceId: req.traceId || 'trace_unknown',
  };
}

module.exports = { authenticate, requireRole, problem };
