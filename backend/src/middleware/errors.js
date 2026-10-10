'use strict';
const { problem } = require('./auth');

// RFC7807 error handler + 404
function notFound(req, res) {
  res.status(404).json({
    type: 'https://shopsmart.ai/errors/not-found', title: 'Not Found', status: 404,
    detail: `No route ${req.method} ${req.originalUrl}`, instance: req.originalUrl, traceId: req.traceId,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[${req.traceId}]`, err.message);
  const status = err.status || 400;
  res.status(status).json(problem(req, status, err.title || 'Request failed', err.message || 'Unknown error'));
}

module.exports = { notFound, errorHandler };
