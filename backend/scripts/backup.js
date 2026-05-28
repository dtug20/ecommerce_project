'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EJSON } = require('bson');
const { mongoose, connect, disconnect, Products, Category, Brand, parseFlags } = require('./lib/db');
const { secret } = require('../config/secret');

function tsNow() { return new Date().toISOString().replace(/[:.]/g, '-'); }

async function runBackup({ dir = path.join(__dirname, '..', 'backups'), timestamp = tsNow(), allowEmpty = false } = {}) {
  const outDir = path.join(dir, timestamp);
  fs.mkdirSync(outDir, { recursive: true });
  const cols = { products: Products, categories: Category, brands: Brand };
  const counts = {};
  for (const [name, Model] of Object.entries(cols)) {
    const docs = await Model.find({}).lean();
    counts[name] = docs.length;
    if (!allowEmpty && docs.length === 0) throw new Error(`Refusing backup: collection "${name}" is empty (0 docs)`);
    fs.writeFileSync(path.join(outDir, `${name}.json`), EJSON.stringify(docs, null, 2));
  }
  const mongoUriHash = crypto.createHash('sha256').update(String(secret.db_url || '')).digest('hex');
  const manifest = { timestamp, counts, mongoUriHash, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { outDir, counts, manifest, timestamp };
}

if (require.main === module) {
  (async () => {
    parseFlags();
    await connect();
    const res = await runBackup({});
    console.log('Backup written:', res.outDir, res.counts);
    await disconnect();
  })().catch((e) => { console.error('BACKUP FAILED:', e.message); process.exit(1); });
}

module.exports = { runBackup, tsNow };
