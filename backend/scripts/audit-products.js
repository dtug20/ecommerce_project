require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../model/Product');

const SLUG_RE = /^[a-z0-9-]+$/;

function isUrl(v) {
  if (typeof v !== 'string' || !v.trim()) return false;
  try {
    new URL(v.trim());
    return true;
  } catch {
    return false;
  }
}

function truncate(s, n) {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n) + '…' : str;
}

const CHECKS = [
  {
    code: 'MISSING_IMG',
    sev: 'high',
    test: (p) => !p.img || !String(p.img).trim(),
    detail: () => 'img field empty or whitespace-only',
  },
  {
    code: 'INVALID_IMG_URL',
    sev: 'high',
    test: (p) => p.img && String(p.img).trim() && !isUrl(p.img),
    detail: (p) => `Cannot parse URL: ${truncate(p.img, 60)}`,
  },
  {
    code: 'INVALID_PRICE',
    sev: 'high',
    test: (p) => !Number.isFinite(p.price) || p.price <= 0,
    detail: (p) => `price=${p.price}`,
  },
  {
    code: 'NEGATIVE_QTY',
    sev: 'high',
    test: (p) => typeof p.quantity === 'number' && p.quantity < 0,
    detail: (p) => `quantity=${p.quantity}`,
  },
  {
    code: 'MISSING_TITLE',
    sev: 'high',
    test: (p) => !p.title || !String(p.title).trim(),
    detail: () => 'title empty or whitespace-only',
  },
  {
    code: 'MISSING_CATEGORY',
    sev: 'medium',
    test: (p) => !p.category,
    detail: () => 'category ref missing or populate returned null',
  },
  {
    code: 'MISSING_BRAND',
    sev: 'medium',
    test: (p) => !p.brand,
    detail: () => 'brand ref missing or populate returned null',
  },
  {
    code: 'DISCOUNT_OUT_OF_RANGE',
    sev: 'medium',
    test: (p) => typeof p.discount === 'number' && (p.discount < 0 || p.discount > 100),
    detail: (p) => `discount=${p.discount}`,
  },
  {
    code: 'INVALID_SLUG',
    sev: 'low',
    test: (p) => !p.slug || !SLUG_RE.test(p.slug),
    detail: (p) => `slug=${truncate(p.slug, 40)}`,
  },
  {
    code: 'OFFER_DATE_INVALID',
    sev: 'low',
    test: (p) => {
      const s = p.offerDate?.start;
      const e = p.offerDate?.end;
      return s && e && new Date(s) > new Date(e);
    },
    detail: (p) =>
      `offerDate.start=${p.offerDate?.start} > end=${p.offerDate?.end}`,
  },
];

const CSV_HEADERS = [
  '_id',
  'title',
  'slug',
  'productType',
  'status',
  'issue_code',
  'issue_severity',
  'issue_detail',
  'updatedAt',
];

function escapeCsv(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function maskMongoUri(uri) {
  return String(uri || '').replace(/\/\/([^:]+):[^@]+@/, '//$1:***@');
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }
  console.log(`Connecting to: ${maskMongoUri(uri)}`);
  await mongoose.connect(uri);
  console.log('Connected. Scanning products…');

  const rows = [];
  let total = 0;
  const cursor = Product.find({}).populate('category', '_id').populate('brand', '_id').cursor();

  for await (const p of cursor) {
    total++;
    for (const c of CHECKS) {
      if (c.test(p)) {
        rows.push({
          _id: p._id.toString(),
          title: p.title || '',
          slug: p.slug || '',
          productType: p.productType || '',
          status: p.status || '',
          issue_code: c.code,
          issue_severity: c.sev,
          issue_detail: c.detail(p),
          updatedAt: p.updatedAt ? p.updatedAt.toISOString() : '',
        });
      }
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.resolve(__dirname, '..', '..', `audit-products-${ts}.csv`);

  const BOM = '﻿'; // Excel UTF-8 hint
  const csv =
    BOM +
    [
      CSV_HEADERS.join(','),
      ...rows.map((r) => CSV_HEADERS.map((h) => escapeCsv(r[h])).join(',')),
    ].join('\n');

  fs.writeFileSync(outPath, csv, 'utf8');

  const bySev = rows.reduce((acc, r) => {
    acc[r.issue_severity] = (acc[r.issue_severity] || 0) + 1;
    return acc;
  }, {});
  const productCount = new Set(rows.map((r) => r._id)).size;

  console.log('');
  console.log(`Scanned: ${total} products`);
  console.log(`Issues:  ${rows.length} (across ${productCount} products)`);
  console.log('By severity:', bySev);
  console.log(`CSV:     ${outPath}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
