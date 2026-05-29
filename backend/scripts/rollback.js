'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EJSON } = require('bson');
const { Products, Category, Brand, connect, disconnect, parseFlags } = require('./lib/db');
const { secret } = require('../config/secret');

async function rollback({ dir = path.join(__dirname, '..', 'backups'), timestamp, yes = false, checkHash = false } = {}) {
  if (!timestamp) throw new Error('rollback requires a timestamp (or --latest)');
  const outDir = path.join(dir, timestamp);
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  if (checkHash) {
    const cur = crypto.createHash('sha256').update(String(secret.db_url || '')).digest('hex');
    if (manifest.mongoUriHash !== cur) throw new Error('mongoUriHash mismatch — refusing cross-DB restore');
  }
  if (!yes) throw new Error('rollback requires --yes to proceed');
  const cols = { products: Products, categories: Category, brands: Brand };
  for (const [name, Model] of Object.entries(cols)) {
    const docs = EJSON.parse(fs.readFileSync(path.join(outDir, `${name}.json`), 'utf8'));
    await Model.deleteMany({});
    if (docs.length) await Model.collection.insertMany(docs);
  }
  return { restored: manifest.counts };
}

function latestTimestamp(dir) {
  const dirs = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'manifest.json')));
  return dirs.sort().pop();
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    const dir = path.join(__dirname, '..', 'backups');
    const ts = flags.positional.includes('--latest') || !flags.positional.length ? latestTimestamp(dir) : flags.positional[0];
    await connect();
    const r = await rollback({ dir, timestamp: ts, yes: flags.yes, checkHash: true });
    console.log('Rolled back:', r.restored);
    await disconnect();
  })().catch((e) => { console.error('rollback FAILED:', e.message); process.exit(1); });
}

module.exports = { rollback, latestTimestamp };
