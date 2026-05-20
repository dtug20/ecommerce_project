#!/usr/bin/env node

/**
 * Migration Script #14: Fix tychicus.id.vn production content
 *
 * One-shot data fixes:
 *   - Multiply absurdly low VND product prices by 1000 (legacy USD-scale fixtures)
 *   - Remap coupon minimumAmount values to realistic VND tiers
 *   - Update SiteSetting contact + shipping defaults for the Vietnamese market
 *
 * Usage:
 *   cd backend && node ../migration/14-fix-tychicus-content.js
 *
 * Options (env vars):
 *   DRY_RUN=1    — scan & report only, no writes
 *
 * Requirements:
 *   - backend/.env must have MONGO_URI
 */

const path = require("path");
const Module = require("module");

// Resolve npm packages from backend/node_modules (same pattern as migration 13)
const backendDir = path.join(__dirname, "..", "backend");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  try {
    return origResolve.call(this, request, parent, ...rest);
  } catch {
    return origResolve.call(this, path.join(backendDir, "node_modules", request), parent, ...rest);
  }
};

const dotenv = require("dotenv");
dotenv.config({ path: path.join(backendDir, ".env") });

const mongoose = require("mongoose");
const Product = require("../backend/model/Products");
const Coupon = require("../backend/model/Coupon");
const SiteSetting = require("../backend/model/SiteSetting");

const DRY_RUN = process.env.DRY_RUN === "1";

const stats = {
  productsScanned: 0,
  productsUpdated: 0,
  couponsScanned: 0,
  couponsUpdated: 0,
  siteSettingUpdated: false,
};

async function fixCheapProductPrices() {
  // Any product priced below 10,000 VND is almost certainly a legacy USD-scale
  // fixture (e.g. $1.10 became 1.10). Multiply by 1000 to get realistic VND.
  const cheap = await Product.find({ price: { $lt: 10000 } });
  stats.productsScanned = cheap.length;
  console.log(`Found ${cheap.length} products with price < 10000 VND`);
  for (const p of cheap) {
    const newPrice = Math.round(p.price * 1000);
    const newDiscount =
      typeof p.discount === "number" && p.discount > 0 && p.discount < 10000
        ? Math.round(p.discount * 1000)
        : p.discount;
    console.log(
      `  ${p.title}: price ${p.price} → ${newPrice}` +
        (newDiscount !== p.discount ? ` | discount ${p.discount} → ${newDiscount}` : "")
    );
    if (!DRY_RUN) {
      p.price = newPrice;
      p.discount = newDiscount;
      await p.save();
      stats.productsUpdated++;
    }
  }
}

async function fixCouponThresholds() {
  // Map old USD-scale values (300/400/500/700) to realistic VND tiers
  const tierMap = {
    300: 500000,    // 500k VND ≈ $20 USD
    400: 1000000,   // 1M VND ≈ $40 USD
    500: 1500000,   // 1.5M VND ≈ $60 USD
    700: 2000000,   // 2M VND ≈ $80 USD
  };
  const cheapCoupons = await Coupon.find({ minimumAmount: { $lt: 10000 } });
  stats.couponsScanned = cheapCoupons.length;
  console.log(`Found ${cheapCoupons.length} coupons with minimumAmount < 10000 VND`);
  for (const c of cheapCoupons) {
    const newMin = tierMap[c.minimumAmount] ?? Math.round(c.minimumAmount * 1000);
    console.log(`  ${c.couponCode}: minimumAmount ${c.minimumAmount} → ${newMin}`);
    if (!DRY_RUN) {
      c.minimumAmount = newMin;
      await c.save();
      stats.couponsUpdated++;
    }
  }
}

async function fixSiteSettings() {
  const settings = await SiteSetting.findOne();
  if (!settings) {
    console.log("No SiteSetting document found; skipping.");
    return;
  }
  const updates = {
    "contact.phone":   "+84 28 7106 1234",
    "contact.email":   "support@tychicus.id.vn",
    "contact.address": "Hồ Chí Minh, Việt Nam",
    "shipping.freeShippingThreshold": 5000000,
    "shipping.defaultShippingCost":   30000,
  };
  console.log("SiteSetting updates:");
  for (const [k, v] of Object.entries(updates)) console.log(`  ${k}: ${JSON.stringify(v)}`);
  if (!DRY_RUN) {
    await SiteSetting.updateOne({ _id: settings._id }, { $set: updates });
    stats.siteSettingUpdated = true;
  }
}

(async () => {
  console.log(`Migration 14 — ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  await mongoose.connect(process.env.MONGO_URI);
  try {
    await fixCheapProductPrices();
    await fixCouponThresholds();
    await fixSiteSettings();
  } finally {
    await mongoose.disconnect();
  }
  console.log("\nSummary:");
  console.log(`  Products scanned: ${stats.productsScanned}, updated: ${stats.productsUpdated}`);
  console.log(`  Coupons scanned: ${stats.couponsScanned}, updated: ${stats.couponsUpdated}`);
  console.log(`  SiteSetting updated: ${stats.siteSettingUpdated}`);
  console.log(DRY_RUN ? "DRY RUN complete — no writes." : "Done.");
})().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
