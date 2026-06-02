/**
 * seed-variants.js — Backfill Color + Size variants onto products.
 *
 * Each product gets a small matrix of variants (COLORS_PER_PRODUCT colors ×
 * SIZES sizes). Variant price defaults to the product's base price (VND),
 * stock is spread from the product's quantity, and each variant carries the
 * product image so the storefront ProductVariantSelector has something to show.
 *
 * Usage (run from backend/, reads MONGO_URI from .env):
 *   node scripts/seed-variants.js            # seed products that have NO variants
 *   node scripts/seed-variants.js --dry      # print the plan, write nothing
 *   node scripts/seed-variants.js --force    # overwrite variants on ALL products
 *
 * Idempotent: without --force, products that already have variants are skipped,
 * so the script is safe to re-run.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Products');

const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');

// Generic palette — sports gear has no canonical colors, so we use common ones.
const COLORS = [
  { name: 'Black', clrCode: '#1A1A1A' },
  { name: 'White', clrCode: '#F5F5F5' },
  { name: 'Red', clrCode: '#E53935' },
  { name: 'Blue', clrCode: '#1E88E5' },
  { name: 'Green', clrCode: '#43A047' },
  { name: 'Orange', clrCode: '#FB8C00' },
];
const SIZES = ['S', 'M', 'L'];
const COLORS_PER_PRODUCT = 2;

function skuBase(product) {
  const raw = (product.slug || product.title || String(product._id)).toString();
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 16);
  return cleaned || `P${String(product._id).slice(-6).toUpperCase()}`;
}

function colorAbbr(name) {
  return name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}

function buildVariants(product, index) {
  const base = skuBase(product);
  // Rotate the palette by product index so the catalog isn't all the same colors.
  const colors = [];
  for (let i = 0; i < COLORS_PER_PRODUCT; i += 1) {
    colors.push(COLORS[(index + i) % COLORS.length]);
  }
  const count = colors.length * SIZES.length;
  const total = product.quantity && product.quantity > 0 ? product.quantity : 60;
  const perVariant = Math.max(3, Math.floor(total / count));
  const price = product.price > 0 ? product.price : 1;
  const img = product.img;

  const variants = [];
  for (const c of colors) {
    for (const size of SIZES) {
      variants.push({
        sku: `${base}-${colorAbbr(c.name)}-${size}`,
        color: { name: c.name, clrCode: c.clrCode },
        size,
        price,
        stock: perVariant,
        images: img ? [img] : [],
      });
    }
  }
  return variants;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const dbName = mongoose.connection.name;
  console.log(`[seed-variants] connected to "${dbName}" (dry=${DRY}, force=${FORCE})`);

  const products = await Product.find(
    {},
    'slug title price quantity img variants',
  ).lean();
  console.log(`[seed-variants] ${products.length} products found`);

  const ops = [];
  let skipped = 0;
  let planned = 0;
  let i = 0;
  for (const p of products) {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
    if (hasVariants && !FORCE) {
      skipped += 1;
      continue;
    }
    const variants = buildVariants(p, i);
    i += 1;
    planned += 1;
    if (planned <= 3) {
      console.log(
        `[seed-variants] e.g. "${p.title}" → ${variants.length} variants ` +
          `(${variants.map((v) => v.sku).join(', ')})`,
      );
    }
    ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: { variants } } } });
  }

  console.log(`[seed-variants] planned=${planned} skipped(existing)=${skipped}`);

  if (DRY) {
    console.log('[seed-variants] --dry: no writes performed');
  } else if (ops.length > 0) {
    const res = await Product.bulkWrite(ops, { ordered: false });
    console.log(`[seed-variants] modified=${res.modifiedCount} matched=${res.matchedCount}`);
  } else {
    console.log('[seed-variants] nothing to write');
  }

  await mongoose.disconnect();
  console.log('[seed-variants] done');
})().catch((e) => {
  console.error('[seed-variants] failed:', e);
  process.exit(1);
});
