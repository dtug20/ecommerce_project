'use strict';
const mongoose = require('mongoose');
const { secret } = require('../../config/secret');
const Products = require('../../model/Products');
const Category = require('../../model/Category');
const Brand = require('../../model/Brand');

function parseFlags(argv = process.argv.slice(2)) {
  const flags = { commit: false, dryRun: true, yes: false, positional: [] };
  for (const a of argv) {
    if (a === '--commit') { flags.commit = true; flags.dryRun = false; }
    else if (a === '--yes') flags.yes = true;
    else if (!a.startsWith('--')) flags.positional.push(a);
  }
  return flags;
}

async function connect(uri = secret.db_url) {
  if (!uri) throw new Error('MONGO_URI is not set (config/secret.js db_url)');
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  return mongoose.connection;
}

async function disconnect() { await mongoose.disconnect(); }

module.exports = { mongoose, parseFlags, connect, disconnect, Products, Category, Brand };
