'use strict';

/**
 * 07-migrate-orders.js
 *
 * Merges orders from both databases into unified.orders.
 *
 * Merge rules:
 *   - Backend (shofy) orders are PRIMARY.
 *   - CRM (shofy_ecommerce) orders fill gaps: only CRM orders whose _id
 *     AND invoice number do not already exist in unified are inserted.
 *
 * Field transformations:
 *   - status       : 'cancel' is retained as-is (backward compat); the
 *                    schema enum includes both 'cancel' and 'cancelled'.
 *   - status       : CRM orderStatus takes precedence over CRM status
 *                    when both are present.
 *   - deliveredAt  : mapped from CRM deliveryDate when absent.
 *   - paymentStatus: CRM paymentStatus string mapped to enum values;
 *                    defaults to 'unpaid'.
 *   - tax          : from CRM tax field; defaults to 0.
 *   - items        : set to [] — new field, populated by application logic.
 *   - orderNumber  : set to null — generated for new orders only.
 *
 * Idempotency: replaceOne with upsert:true keyed on _id.
 *
 * Usage:
 *   SHOFY_URI=mongodb://...
 *   SHOFY_ECOMMERCE_URI=mongodb://...
 *   UNIFIED_URI=mongodb://...
 *   node migration/07-migrate-orders.js
 */

const mongoose = require('mongoose');

const SHOFY_URI           = process.env.SHOFY_URI           || 'mongodb://127.0.0.1:27017/shofy';
const SHOFY_ECOMMERCE_URI = process.env.SHOFY_ECOMMERCE_URI || 'mongodb://127.0.0.1:27017/shofy_ecommerce';
const UNIFIED_URI         = process.env.UNIFIED_URI         || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 200;

const VALID_STATUSES = new Set([
  'pending', 'confirmed', 'processing', 'shipped',
  'delivered', 'cancelled', 'cancel',
]);

const VALID_PAYMENT_STATUSES = new Set([
  'unpaid', 'paid', 'refunded', 'partially-refunded',
]);

/**
 * Maps a freeform CRM paymentStatus string to a valid enum value.
 */
function normalisePaymentStatus(raw) {
  if (!raw) return 'unpaid';
  const lower = String(raw).toLowerCase().trim();
  if (lower === 'paid')               return 'paid';
  if (lower === 'refunded')           return 'refunded';
  if (lower === 'partially-refunded' || lower === 'partial') return 'partially-refunded';
  return 'unpaid';
}

/**
 * Returns the best available status for an order, preferring the more
 * granular CRM orderStatus over the simpler CRM status.
 */
function resolveStatus(doc) {
  // orderStatus is the CRM-specific extended field
  if (doc.orderStatus && VALID_STATUSES.has(doc.orderStatus.toLowerCase())) {
    return doc.orderStatus.toLowerCase();
  }
  if (doc.status && VALID_STATUSES.has(doc.status.toLowerCase())) {
    return doc.status.toLowerCase();
  }
  return 'pending';
}

/**
 * Normalises any order document (from either source) into the unified shape.
 */
function transformOrder(doc) {
  return {
    _id:             doc._id,
    user:            doc.user,
    cart:            Array.isArray(doc.cart) ? doc.cart : [],
    name:            doc.name            || '',
    address:         doc.address         || '',
    email:           doc.email           || '',
    contact:         doc.contact         || '',
    city:            doc.city            || '',
    country:         doc.country         || '',
    zipCode:         doc.zipCode         || '',
    subTotal:        doc.subTotal        || 0,
    shippingCost:    doc.shippingCost     || 0,
    discount:        doc.discount        != null ? doc.discount : 0,
    totalAmount:     doc.totalAmount     || 0,
    shippingOption:  doc.shippingOption  || null,
    cardInfo:        doc.cardInfo        || null,
    paymentIntent:   doc.paymentIntent   || null,
    paymentMethod:   doc.paymentMethod   || 'COD',
    orderNote:       doc.orderNote       || null,
    invoice:         doc.invoice         || null,
    status:          resolveStatus(doc),
    // Extended fields
    orderNumber:     doc.orderNumber     || null,
    tax:             doc.tax             != null ? doc.tax : 0,
    paymentStatus:   normalisePaymentStatus(doc.paymentStatus),
    paymentGateway:  doc.paymentGateway  || null,
    transactionId:   doc.transactionId   || null,
    paidAt:          doc.paidAt          || null,
    refundedAt:      doc.refundedAt      || null,
    refundAmount:    doc.refundAmount    != null ? doc.refundAmount : 0,
    trackingNumber:  doc.trackingNumber  || null,
    carrier:         doc.carrier         || null,
    trackingUrl:     doc.trackingUrl     || null,
    shippedAt:       doc.shippedAt       || null,
    // Map CRM deliveryDate → deliveredAt
    deliveredAt:     doc.deliveredAt     || doc.deliveryDate || null,
    estimatedDelivery: doc.estimatedDelivery || null,
    splitOrders:     Array.isArray(doc.splitOrders) ? doc.splitOrders : [],
    parentOrder:     doc.parentOrder     || null,
    // items is a new field — leave empty; populated by application logic
    items:           [],
    createdAt:       doc.createdAt       || new Date(),
    updatedAt:       doc.updatedAt       || new Date(),
  };
}

async function run() {
  console.log('\n=== 07-migrate-orders ===');
  console.log(`Source backend : ${SHOFY_URI}`);
  console.log(`Source CRM     : ${SHOFY_ECOMMERCE_URI}`);
  console.log(`Target unified : ${UNIFIED_URI}`);
  console.log(`Timestamp      : ${new Date().toISOString()}\n`);

  let connBackend;
  let connCRM;
  let connUnified;

  try {
    connBackend = await mongoose.createConnection(SHOFY_URI).asPromise();
    console.log('[OK] Connected to backend (shofy)');
    connCRM     = await mongoose.createConnection(SHOFY_ECOMMERCE_URI).asPromise();
    console.log('[OK] Connected to CRM (shofy_ecommerce)');
    connUnified = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to unified\n');
  } catch (err) {
    console.error('[ERROR] Connection failed:', err.message);
    process.exit(1);
  }

  const backendCol = connBackend.db.collection('orders');
  const crmCol     = connCRM.db.collection('orders');
  const targetCol  = connUnified.db.collection('orders');

  const backendCount = await backendCol.countDocuments();
  const crmCount     = await crmCol.countDocuments();
  console.log(`Backend orders : ${backendCount}`);
  console.log(`CRM orders     : ${crmCount}\n`);

  // ── Pass 1: backend orders (primary) ─────────────────────────────────────
  console.log('Pass 1: migrating backend orders...');
  let beInserted = 0;
  let beReplaced = 0;
  const beBatches = Math.ceil(backendCount / BATCH_SIZE);

  for (let i = 0; i < beBatches; i++) {
    const docs = await backendCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const doc of docs) {
      const transformed = transformOrder(doc);
      const result = await targetCol.replaceOne(
        { _id: transformed._id },
        transformed,
        { upsert: true }
      );
      if (result.upsertedCount > 0) beInserted++;
      else if (result.modifiedCount > 0) beReplaced++;
    }
    console.log(`  [Backend] Batch ${i + 1}/${beBatches} done`);
  }

  // ── Build lookup sets from unified (after backend pass) ──────────────────
  console.log('\nBuilding unified order ID + invoice lookup...');
  const existingIds      = new Set();
  const existingInvoices = new Set();

  const lookupCursor = targetCol.find({}, { projection: { _id: 1, invoice: 1 } });
  while (await lookupCursor.hasNext()) {
    const doc = await lookupCursor.next();
    existingIds.add(String(doc._id));
    if (doc.invoice != null) existingInvoices.add(doc.invoice);
  }
  console.log(`  Known IDs: ${existingIds.size}, Known invoices: ${existingInvoices.size}\n`);

  // ── Pass 2: CRM-only orders ───────────────────────────────────────────────
  console.log('Pass 2: migrating CRM-only orders...');
  let crmInserted = 0;
  let crmSkipped  = 0;
  const crmBatches = Math.ceil(crmCount / BATCH_SIZE);

  for (let i = 0; i < crmBatches; i++) {
    const docs = await crmCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const doc of docs) {
      const idStr = String(doc._id);
      if (existingIds.has(idStr)) {
        crmSkipped++;
        continue;
      }
      if (doc.invoice != null && existingInvoices.has(doc.invoice)) {
        // Same invoice number but different _id — skip to avoid duplicate
        crmSkipped++;
        console.log(`  [SKIP] CRM order invoice=${doc.invoice} already exists in unified`);
        continue;
      }

      const transformed = transformOrder(doc);
      try {
        await targetCol.insertOne(transformed);
        existingIds.add(idStr);
        if (transformed.invoice != null) existingInvoices.add(transformed.invoice);
        crmInserted++;
      } catch (err) {
        if (err.code === 11000) {
          crmSkipped++;
        } else {
          throw err;
        }
      }
    }
    console.log(`  [CRM] Batch ${i + 1}/${crmBatches} done`);
  }

  const unifiedCount = await targetCol.countDocuments();

  console.log('\n--- Summary ---');
  console.log(`Backend orders migrated  : ${beInserted + beReplaced}`);
  console.log(`  Inserted               : ${beInserted}`);
  console.log(`  Replaced (re-run)      : ${beReplaced}`);
  console.log(`CRM orders processed     : ${crmCount}`);
  console.log(`  Inserted               : ${crmInserted}`);
  console.log(`  Skipped (already exist): ${crmSkipped}`);
  console.log(`Unified total            : ${unifiedCount}`);

  await connBackend.close();
  await connCRM.close();
  await connUnified.close();

  console.log('\n[DONE] Order migration complete.');
  console.log('NOTE: order.items[] is left empty — application logic populates it from cart[].');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
