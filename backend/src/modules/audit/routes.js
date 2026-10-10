'use strict';
const express = require('express');
const db = require('../../db');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate(), requireRole('OPS_MANAGER'));

router.get('/', (req, res) => {
  res.json({ items: db.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200') });
});

module.exports = router;
