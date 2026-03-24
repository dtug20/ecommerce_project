#!/usr/bin/env node

/**
 * Seed banners into the Banner collection.
 *
 * Usage:
 *   cd backend && node seeds/banners.seed.js
 *
 * Uses upsert by title so it is safe to re-run without creating duplicates.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Banner = require('../model/Banner');
const { secret } = require('../config/secret');

const banners = [
  // ─── Hero Slides (3) ────────────────────────────────────────────────
  {
    title: 'Best Collection For Home Decoration',
    type: 'hero-slide',
    status: 'active',
    priority: 10,
    dismissible: false,
    content: {
      text: 'Best Collection For Home Decoration',
      textVi: 'Bộ sưu tập trang trí nhà tốt nhất',
      buttonText: 'Starting at only $299',
      buttonTextVi: 'Chỉ từ $299',
      buttonUrl: '/shop',
      image: 'https://i.ibb.co/WVdTgR8/headphone-1.png',
      backgroundColor: '#F2F4F5',
      textColor: '#191C1F',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['home'], userSegments: ['all'] },
  },
  {
    title: 'Explore Our Latest Electronics',
    type: 'hero-slide',
    status: 'active',
    priority: 9,
    dismissible: false,
    content: {
      text: 'Explore Our Latest Electronics',
      textVi: 'Khám phá sản phẩm điện tử mới nhất',
      buttonText: 'Up to 40% off',
      buttonTextVi: 'Giảm đến 40%',
      buttonUrl: '/shop?category=electronics',
      image: 'https://i.ibb.co/jvGv6qf/mobile-1.png',
      backgroundColor: '#EAF4FB',
      textColor: '#191C1F',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['home'], userSegments: ['all'] },
  },
  {
    title: 'Fashion Forward — Shop the Trend',
    type: 'hero-slide',
    status: 'active',
    priority: 8,
    dismissible: false,
    content: {
      text: 'Fashion Forward — Shop the Trend',
      textVi: 'Thời trang xu hướng — Mua sắm ngay',
      buttonText: 'New Season',
      buttonTextVi: 'Mùa mới',
      buttonUrl: '/shop?category=fashion',
      image: 'https://i.ibb.co/gg9yCwX/clothing-1.png',
      backgroundColor: '#FFF3EB',
      textColor: '#191C1F',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['home'], userSegments: ['all'] },
  },

  // ─── Promotional Banners (2 — sidebar promo cards) ──────────────────
  {
    title: 'iPhone 14 Pro',
    type: 'promotional-banner',
    status: 'active',
    priority: 5,
    dismissible: false,
    content: {
      text: 'iPhone 14 Pro',
      textVi: 'iPhone 14 Pro',
      buttonText: 'Apple Smartphone',
      buttonTextVi: 'Điện thoại Apple',
      buttonUrl: '/shop?category=electronics',
      image: 'https://i.ibb.co/3WMPkkf/mobile-5.png',
      backgroundColor: '#EAF4FB',
      textColor: '#191C1F',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['home'], userSegments: ['all'] },
  },
  {
    title: 'Sony Headphones',
    type: 'promotional-banner',
    status: 'active',
    priority: 4,
    dismissible: false,
    content: {
      text: 'Sony Headphones',
      textVi: 'Tai nghe Sony',
      buttonText: 'Wireless Audio',
      buttonTextVi: 'Âm thanh không dây',
      buttonUrl: '/shop?category=electronics',
      image: 'https://i.ibb.co/WVdTgR8/headphone-1.png',
      backgroundColor: '#FFF3EB',
      textColor: '#191C1F',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['home'], userSegments: ['all'] },
  },

  // ─── Announcement Bar ───────────────────────────────────────────────
  {
    title: 'Free Shipping Announcement',
    type: 'announcement-bar',
    status: 'active',
    priority: 10,
    dismissible: true,
    content: {
      text: 'FREE Express Shipping On Orders $570+',
      textVi: 'MIỄN PHÍ vận chuyển nhanh cho đơn hàng từ $570',
      buttonText: 'Shop Now',
      buttonTextVi: 'Mua ngay',
      buttonUrl: '/shop',
      backgroundColor: '#1B6392',
      textColor: '#FFFFFF',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['*'], userSegments: ['all'] },
  },

  // ─── Category Banners ──────────────────────────────────────────────
  {
    title: 'Electronics Category Banner',
    type: 'category-banner',
    status: 'active',
    priority: 3,
    dismissible: false,
    content: {
      text: 'Top Electronics Deals',
      textVi: 'Ưu đãi điện tử hàng đầu',
      buttonText: 'Browse Electronics',
      buttonTextVi: 'Xem điện tử',
      buttonUrl: '/shop?category=electronics',
      image: 'https://i.ibb.co/kxGMcrw/ipad-1.png',
      backgroundColor: '#F2F4F5',
      textColor: '#191C1F',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['shop'], userSegments: ['all'] },
  },
  {
    title: 'Fashion Category Banner',
    type: 'category-banner',
    status: 'active',
    priority: 2,
    dismissible: false,
    content: {
      text: 'New Fashion Arrivals',
      textVi: 'Thời trang mới về',
      buttonText: 'Browse Fashion',
      buttonTextVi: 'Xem thời trang',
      buttonUrl: '/shop?category=fashion',
      image: 'https://i.ibb.co/DKJr0w4/clothing-9.png',
      backgroundColor: '#FFF3EB',
      textColor: '#191C1F',
    },
    scheduling: { isAlwaysActive: true },
    targeting: { pages: ['shop'], userSegments: ['all'] },
  },
];

async function seed() {
  await mongoose.connect(secret.db_url);
  console.log('Connected to MongoDB');

  let inserted = 0;
  let updated = 0;

  for (const banner of banners) {
    const result = await Banner.findOneAndUpdate(
      { title: banner.title },
      { $set: banner },
      { upsert: true, new: true }
    );
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      console.log(`  ✓ Created: ${banner.title} (${banner.type})`);
      inserted++;
    } else {
      console.log(`  ↻ Updated: ${banner.title} (${banner.type})`);
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
