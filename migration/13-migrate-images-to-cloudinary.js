#!/usr/bin/env node

/**
 * Migration Script: Migrate all images to Cloudinary
 *
 * Downloads images from external sources (i.ibb.co, etc.) and re-uploads
 * them to YOUR Cloudinary account, then updates MongoDB documents.
 *
 * Usage:
 *   cd backend && node ../migration/13-migrate-images-to-cloudinary.js
 *
 * Options (env vars):
 *   DRY_RUN=1        — scan & report only, no uploads or DB writes
 *   BATCH_SIZE=10    — concurrent uploads per batch (default 5)
 *   SKIP_MODELS=Brand,Banner — comma-separated models to skip
 *
 * Requirements:
 *   - Backend .env must have CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   - Backend .env must have MONGO_URI
 */

const path = require("path");
const Module = require("module");

// Resolve npm packages from backend/node_modules
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

// Load backend .env
dotenv.config({ path: path.join(backendDir, ".env") });

const mongoose = require("mongoose");
const cloudinaryModule = require("cloudinary");
const https = require("https");
const http = require("http");
const { Readable } = require("stream");

// ─── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN === "1";
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 5;
const SKIP_MODELS = (process.env.SKIP_MODELS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const CLOUDINARY_FOLDER = "shofy"; // root folder in Cloudinary

const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Models ──────────────────────────────────────────────────────────────────

const Product = require("../backend/model/Products");
const Category = require("../backend/model/Category");
const Brand = require("../backend/model/Brand");
const Banner = require("../backend/model/Banner");
const BlogPost = require("../backend/model/BlogPost");
const SiteSetting = require("../backend/model/SiteSetting");
const User = require("../backend/model/User");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const stats = {
  scanned: 0,
  skipped: 0,
  uploaded: 0,
  failed: 0,
  updated: 0,
};

/**
 * Check if URL is already on our Cloudinary account
 */
function isOurCloudinary(url) {
  if (!url || typeof url !== "string") return true; // skip empty
  return url.includes(`res.cloudinary.com/${process.env.CLOUDINARY_NAME}`);
}

/**
 * Check if a URL is a valid image URL worth migrating
 */
function isImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Download image from URL into a Buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(url, { timeout: 30000 }, (res) => {
      // Follow redirects (up to 3)
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {string} folder — subfolder under CLOUDINARY_FOLDER (e.g. "products", "brands")
 * @returns {Promise<string>} — secure_url
 */
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${CLOUDINARY_FOLDER}/${folder}`,
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Migrate a single image URL: download → upload → return new URL
 * Returns original URL if already on our Cloudinary or if migration fails
 */
async function migrateUrl(url, folder) {
  if (!isImageUrl(url) || isOurCloudinary(url)) {
    stats.skipped++;
    return url;
  }

  stats.scanned++;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would migrate: ${url}`);
    return url;
  }

  try {
    const buffer = await downloadImage(url);
    const newUrl = await uploadToCloudinary(buffer, folder);
    stats.uploaded++;
    console.log(`  ✓ ${url.substring(0, 60)}... → ${newUrl.substring(0, 60)}...`);
    return newUrl;
  } catch (err) {
    stats.failed++;
    console.error(`  ✗ Failed: ${url} — ${err.message}`);
    return url; // keep original on failure
  }
}

/**
 * Process items in batches
 */
async function processBatch(items, fn) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(fn));
  }
}

// ─── Model Migration Functions ───────────────────────────────────────────────

async function migrateProducts() {
  console.log("\n═══ Products ═══");
  const products = await Product.find({}).lean();
  console.log(`Found ${products.length} products`);

  await processBatch(products, async (product) => {
    let changed = false;
    const update = {};

    // 1. Main image
    if (product.img && !isOurCloudinary(product.img)) {
      const newUrl = await migrateUrl(product.img, "products");
      if (newUrl !== product.img) {
        update.img = newUrl;
        changed = true;
      }
    }

    // 2. imageURLs array (color variants)
    if (product.imageURLs?.length) {
      const newImageURLs = [];
      for (const item of product.imageURLs) {
        if (item.img && !isOurCloudinary(item.img)) {
          const newUrl = await migrateUrl(item.img, "products");
          if (newUrl !== item.img) {
            newImageURLs.push({ ...item, img: newUrl });
            changed = true;
            continue;
          }
        }
        newImageURLs.push(item);
      }
      if (changed) update.imageURLs = newImageURLs;
    }

    // 3. variants[].images
    if (product.variants?.length) {
      const newVariants = [];
      let variantChanged = false;
      for (const variant of product.variants) {
        if (variant.images?.length) {
          const newImages = [];
          for (const imgUrl of variant.images) {
            if (imgUrl && !isOurCloudinary(imgUrl)) {
              const newUrl = await migrateUrl(imgUrl, "products/variants");
              if (newUrl !== imgUrl) variantChanged = true;
              newImages.push(newUrl);
            } else {
              newImages.push(imgUrl);
            }
          }
          newVariants.push({ ...variant, images: newImages });
        } else {
          newVariants.push(variant);
        }
      }
      if (variantChanged) {
        update.variants = newVariants;
        changed = true;
      }
    }

    // 4. seo.ogImage
    if (product.seo?.ogImage && !isOurCloudinary(product.seo.ogImage)) {
      const newUrl = await migrateUrl(product.seo.ogImage, "products/seo");
      if (newUrl !== product.seo.ogImage) {
        update["seo.ogImage"] = newUrl;
        changed = true;
      }
    }

    if (changed && !DRY_RUN) {
      await Product.updateOne({ _id: product._id }, { $set: update });
      stats.updated++;
      console.log(`  → Updated product: ${product.title}`);
    }
  });
}

async function migrateCategories() {
  console.log("\n═══ Categories ═══");
  const categories = await Category.find({}).lean();
  console.log(`Found ${categories.length} categories`);

  await processBatch(categories, async (cat) => {
    let changed = false;
    const update = {};

    if (cat.img && !isOurCloudinary(cat.img)) {
      const newUrl = await migrateUrl(cat.img, "categories");
      if (newUrl !== cat.img) {
        update.img = newUrl;
        changed = true;
      }
    }

    if (cat.icon && !isOurCloudinary(cat.icon)) {
      const newUrl = await migrateUrl(cat.icon, "categories");
      if (newUrl !== cat.icon) {
        update.icon = newUrl;
        changed = true;
      }
    }

    if (changed && !DRY_RUN) {
      await Category.updateOne({ _id: cat._id }, { $set: update });
      stats.updated++;
      console.log(`  → Updated category: ${cat.parent}`);
    }
  });
}

async function migrateBrands() {
  console.log("\n═══ Brands ═══");
  const brands = await Brand.find({}).lean();
  console.log(`Found ${brands.length} brands`);

  await processBatch(brands, async (brand) => {
    if (brand.logo && !isOurCloudinary(brand.logo)) {
      const newUrl = await migrateUrl(brand.logo, "brands");
      if (newUrl !== brand.logo && !DRY_RUN) {
        await Brand.updateOne({ _id: brand._id }, { $set: { logo: newUrl } });
        stats.updated++;
        console.log(`  → Updated brand: ${brand.name}`);
      }
    }
  });
}

async function migrateBanners() {
  console.log("\n═══ Banners ═══");
  const banners = await Banner.find({}).lean();
  console.log(`Found ${banners.length} banners`);

  await processBatch(banners, async (banner) => {
    let changed = false;
    const update = {};

    if (banner.content?.image && !isOurCloudinary(banner.content.image)) {
      const newUrl = await migrateUrl(banner.content.image, "banners");
      if (newUrl !== banner.content.image) {
        update["content.image"] = newUrl;
        changed = true;
      }
    }

    if (banner.content?.imageMobile && !isOurCloudinary(banner.content.imageMobile)) {
      const newUrl = await migrateUrl(banner.content.imageMobile, "banners");
      if (newUrl !== banner.content.imageMobile) {
        update["content.imageMobile"] = newUrl;
        changed = true;
      }
    }

    if (changed && !DRY_RUN) {
      await Banner.updateOne({ _id: banner._id }, { $set: update });
      stats.updated++;
      console.log(`  → Updated banner: ${banner.title}`);
    }
  });
}

async function migrateBlogPosts() {
  console.log("\n═══ Blog Posts ═══");
  const posts = await BlogPost.find({}).lean();
  console.log(`Found ${posts.length} blog posts`);

  await processBatch(posts, async (post) => {
    let changed = false;
    const update = {};

    if (post.featuredImage && !isOurCloudinary(post.featuredImage)) {
      const newUrl = await migrateUrl(post.featuredImage, "blog");
      if (newUrl !== post.featuredImage) {
        update.featuredImage = newUrl;
        changed = true;
      }
    }

    if (post.seo?.ogImage && !isOurCloudinary(post.seo.ogImage)) {
      const newUrl = await migrateUrl(post.seo.ogImage, "blog/seo");
      if (newUrl !== post.seo.ogImage) {
        update["seo.ogImage"] = newUrl;
        changed = true;
      }
    }

    if (changed && !DRY_RUN) {
      await BlogPost.updateOne({ _id: post._id }, { $set: update });
      stats.updated++;
      console.log(`  → Updated blog post: ${post.title}`);
    }
  });
}

async function migrateSiteSettings() {
  console.log("\n═══ Site Settings ═══");
  const settings = await SiteSetting.find({}).lean();
  console.log(`Found ${settings.length} site settings`);

  for (const setting of settings) {
    let changed = false;
    const update = {};

    if (setting.logo && !isOurCloudinary(setting.logo)) {
      const newUrl = await migrateUrl(setting.logo, "settings");
      if (newUrl !== setting.logo) {
        update.logo = newUrl;
        changed = true;
      }
    }

    if (setting.favicon && !isOurCloudinary(setting.favicon)) {
      const newUrl = await migrateUrl(setting.favicon, "settings");
      if (newUrl !== setting.favicon) {
        update.favicon = newUrl;
        changed = true;
      }
    }

    if (setting.ogImage && !isOurCloudinary(setting.ogImage)) {
      const newUrl = await migrateUrl(setting.ogImage, "settings");
      if (newUrl !== setting.ogImage) {
        update.ogImage = newUrl;
        changed = true;
      }
    }

    if (changed && !DRY_RUN) {
      await SiteSetting.updateOne({ _id: setting._id }, { $set: update });
      stats.updated++;
      console.log(`  → Updated site settings`);
    }
  }
}

async function migrateUsers() {
  console.log("\n═══ Users ═══");
  // Only migrate users that have image fields set
  const users = await User.find({
    $or: [
      { imageURL: { $exists: true, $ne: "" } },
      { "vendorProfile.storeLogo": { $exists: true, $ne: "" } },
      { "vendorProfile.storeBanner": { $exists: true, $ne: "" } },
    ],
  }).lean();
  console.log(`Found ${users.length} users with images`);

  await processBatch(users, async (user) => {
    let changed = false;
    const update = {};

    if (user.imageURL && !isOurCloudinary(user.imageURL)) {
      // Skip Google profile pictures — they're served by Google
      if (!user.imageURL.includes("lh3.googleusercontent.com")) {
        const newUrl = await migrateUrl(user.imageURL, "users");
        if (newUrl !== user.imageURL) {
          update.imageURL = newUrl;
          changed = true;
        }
      }
    }

    if (user.vendorProfile?.storeLogo && !isOurCloudinary(user.vendorProfile.storeLogo)) {
      const newUrl = await migrateUrl(user.vendorProfile.storeLogo, "vendors");
      if (newUrl !== user.vendorProfile.storeLogo) {
        update["vendorProfile.storeLogo"] = newUrl;
        changed = true;
      }
    }

    if (user.vendorProfile?.storeBanner && !isOurCloudinary(user.vendorProfile.storeBanner)) {
      const newUrl = await migrateUrl(user.vendorProfile.storeBanner, "vendors");
      if (newUrl !== user.vendorProfile.storeBanner) {
        update["vendorProfile.storeBanner"] = newUrl;
        changed = true;
      }
    }

    if (changed && !DRY_RUN) {
      await User.updateOne({ _id: user._id }, { $set: update });
      stats.updated++;
      console.log(`  → Updated user: ${user.name || user.email}`);
    }
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║     Image Migration to Cloudinary                   ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log();
  console.log(`Cloudinary account: ${process.env.CLOUDINARY_NAME}`);
  console.log(`Upload folder:      ${CLOUDINARY_FOLDER}/`);
  console.log(`Batch size:         ${BATCH_SIZE}`);
  console.log(`Mode:               ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  if (SKIP_MODELS.length) console.log(`Skipping models:    ${SKIP_MODELS.join(", ")}`);
  console.log();

  if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.error("ERROR: Missing Cloudinary credentials in .env");
    process.exit(1);
  }

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", process.env.MONGO_URI.replace(/\/\/.*@/, "//***@"));

  const migrations = [
    { name: "product", fn: migrateProducts },
    { name: "category", fn: migrateCategories },
    { name: "brand", fn: migrateBrands },
    { name: "banner", fn: migrateBanners },
    { name: "blogpost", fn: migrateBlogPosts },
    { name: "sitesetting", fn: migrateSiteSettings },
    { name: "user", fn: migrateUsers },
  ];

  for (const { name, fn } of migrations) {
    if (SKIP_MODELS.includes(name)) {
      console.log(`\n═══ Skipping ${name} ═══`);
      continue;
    }
    await fn();
  }

  // Summary
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║     Migration Summary                               ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Images scanned:    ${String(stats.scanned).padStart(6)}                        ║`);
  console.log(`║  Already migrated:  ${String(stats.skipped).padStart(6)}                        ║`);
  console.log(`║  Uploaded:          ${String(stats.uploaded).padStart(6)}                        ║`);
  console.log(`║  Failed:            ${String(stats.failed).padStart(6)}                        ║`);
  console.log(`║  Documents updated: ${String(stats.updated).padStart(6)}                        ║`);
  console.log("╚══════════════════════════════════════════════════════╝");

  if (DRY_RUN) {
    console.log("\n⚠  DRY RUN — no changes were made. Remove DRY_RUN=1 to execute.");
  }

  if (stats.failed > 0) {
    console.log(`\n⚠  ${stats.failed} images failed to migrate. Re-run to retry.`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
