'use strict';
// SQLite via Node 22 built-in node:sqlite (no native deps).
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('./config');

let db = null;

function open() {
  if (db) return db;
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  db = new DatabaseSync(config.dbPath);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  return db;
}

function all(sql, params = []) {
  return open().prepare(sql).all(...params);
}
function get(sql, params = []) {
  return open().prepare(sql).get(...params);
}
function run(sql, params = []) {
  return open().prepare(sql).run(...params);
}
function exec(sql) {
  return open().exec(sql);
}

module.exports = { open, all, get, run, exec };
