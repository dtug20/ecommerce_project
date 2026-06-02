#!/usr/bin/env node

/**
 * Seed sample coupons into the Coupon collection.
 *
 * Usage:
 *   cd backend && node seeds/coupons.seed.js
 *
 * Uses upsert by couponCode so it is safe to re-run without creating duplicates.
 * Amounts are in VND (storefront default currency). productType must match an
 * existing product category: beauty | electronics | fashion | home | jewelry | sports.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Coupon = require('../model/Coupon');

// Reference "now" so date ranges stay relative to seed time.
const now = new Date();
const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

const coupons = [
  {
    title: 'Summer Splash Sale',
    couponCode: 'SUMMER25',
    logo: 'https://i.ibb.co/ThxGY6N/clothing-13.png',
    productType: 'fashion',
    discountPercentage: 25,
    minimumAmount: 800000,
    startTime: days(-2),
    endTime: days(20),
    status: 'active',
    usageLimit: 500,
    perUserLimit: 1,
    displayRules: { showOnBanner: true, showOnCheckout: true, showOnProductPage: false },
  },
  {
    title: 'Tech Mega Deal',
    couponCode: 'TECH30',
    logo: 'https://i.ibb.co/kxGMcrw/ipad-1.png',
    productType: 'electronics',
    discountPercentage: 30,
    minimumAmount: 3000000,
    startTime: days(-1),
    endTime: days(30),
    status: 'active',
    usageLimit: 200,
    perUserLimit: 1,
    displayRules: { showOnBanner: true, showOnCheckout: true, showOnProductPage: true },
  },
  {
    title: 'Glow Up Beauty',
    couponCode: 'GLOW15',
    logo: 'https://i.ibb.co/h9PYFHJ/lip-liner-2.png',
    productType: 'beauty',
    discountPercentage: 15,
    minimumAmount: 500000,
    startTime: days(0),
    endTime: days(45),
    status: 'active',
    usageLimit: null,
    perUserLimit: 2,
    displayRules: { showOnBanner: false, showOnCheckout: true, showOnProductPage: true },
  },
  {
    title: 'Sparkle Jewelry Offer',
    couponCode: 'SPARKLE20',
    logo: 'https://i.ibb.co/rvmPWxc/bracelet-5.png',
    productType: 'jewelry',
    discountPercentage: 20,
    minimumAmount: 1200000,
    startTime: days(-3),
    endTime: days(25),
    status: 'active',
    usageLimit: 300,
    perUserLimit: 1,
    displayRules: { showOnBanner: true, showOnCheckout: false, showOnProductPage: true },
  },
  {
    title: 'Home Comfort Discount',
    couponCode: 'HOME10',
    logo: 'https://i.ibb.co/kxGMcrw/ipad-1.png',
    productType: 'home',
    discountPercentage: 10,
    minimumAmount: 600000,
    startTime: days(-5),
    endTime: days(40),
    status: 'active',
    usageLimit: null,
    perUserLimit: 1,
    displayRules: { showOnBanner: false, showOnCheckout: true, showOnProductPage: false },
  },
  {
    title: 'Active Sports Saver',
    couponCode: 'SPORT12',
    logo: 'https://i.ibb.co/ThxGY6N/clothing-13.png',
    productType: 'sports',
    discountPercentage: 12,
    minimumAmount: 400000,
    startTime: days(0),
    endTime: days(35),
    status: 'active',
    usageLimit: 1000,
    perUserLimit: 3,
    displayRules: { showOnBanner: true, showOnCheckout: true, showOnProductPage: true },
  },
  {
    title: 'Welcome New Customer',
    couponCode: 'WELCOME5',
    logo: 'https://i.ibb.co/h9PYFHJ/lip-liner-2.png',
    productType: 'fashion',
    discountPercentage: 5,
    minimumAmount: 0,
    startTime: days(-10),
    endTime: days(90),
    status: 'active',
    usageLimit: null,
    perUserLimit: 1,
    displayRules: { showOnBanner: false, showOnCheckout: true, showOnProductPage: false },
  },
  {
    title: 'Flash Friday 40',
    couponCode: 'FLASH40',
    logo: 'https://i.ibb.co/kxGMcrw/ipad-1.png',
    productType: 'electronics',
    discountPercentage: 40,
    minimumAmount: 5000000,
    startTime: days(-15),
    endTime: days(-1), // already expired — useful for testing inactive/expired states
    status: 'inactive',
    usageLimit: 100,
    perUserLimit: 1,
    displayRules: { showOnBanner: false, showOnCheckout: false, showOnProductPage: false },
  },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set — check backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected. Seeding ${coupons.length} coupons...\n`);

  let inserted = 0;
  let updated = 0;

  for (const coupon of coupons) {
    const result = await Coupon.findOneAndUpdate(
      { couponCode: coupon.couponCode },
      { $set: coupon },
      { upsert: true, new: true }
    );
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      console.log(`  ✓ Created: ${coupon.couponCode} — ${coupon.title} (${coupon.productType}, ${coupon.discountPercentage}%)`);
      inserted++;
    } else {
      console.log(`  ↻ Updated: ${coupon.couponCode} — ${coupon.title}`);
      updated++;
    }
  }

  console.log(`\nDone: ${inserted} created, ${updated} updated`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
