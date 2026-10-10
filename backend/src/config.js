'use strict';
require('dotenv').config();
const path = require('path');

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.TOKENHARBOR_API_KEY || '';
const baseUrl = (process.env.DEEPSEEK_BASE_URL || process.env.TOKENHARBOR_BASE_URL || (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com/v1' : 'https://tokenharbor.ai/v1')).replace(/\/$/, '');
const model = process.env.DEEPSEEK_MODEL || process.env.TOKENHARBOR_MODEL || 'deepseek-v4.1-flash:free';

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  dbPath: process.env.DB_PATH
    ? path.resolve(__dirname, '..', process.env.DB_PATH)
    : path.resolve(__dirname, '..', '..', 'db', 'shopsmart.db'),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || '1800', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  llm: {
    apiKey,
    baseUrl,
    model,
    provider: process.env.DEEPSEEK_API_KEY ? 'deepseek' : (apiKey ? 'tokenharbor' : 'none'),
  },
  refundApprovalThreshold: parseFloat(process.env.REFUND_APPROVAL_THRESHOLD || '100'),
};

module.exports = config;

