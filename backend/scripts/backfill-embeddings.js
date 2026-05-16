require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../model/Products');
const BlogPost = require('../model/BlogPost');
const embeddings = require('../services/chatbot/embeddings');

const BATCH = 20;
const SLEEP_MS = 500;

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function backfillProducts() {
  const cursor = Product.find({ $or: [{ embedding: null }, { embedding: { $exists: false } }] })
    .select('+embedding')
    .cursor();
  let i = 0, ok = 0, fail = 0;
  for await (const p of cursor) {
    try {
      const vec = await embeddings.embedProduct(p);
      p.embedding = vec;
      p.embeddedAt = new Date();
      await p.save();
      ok += 1;
    } catch (e) {
      console.error(`[backfill] product ${p._id} failed:`, e.message);
      fail += 1;
    }
    i += 1;
    if (i % BATCH === 0) {
      console.log(`[backfill] products processed=${i} ok=${ok} fail=${fail}`);
      await sleep(SLEEP_MS);
    }
  }
  console.log(`[backfill] products done total=${i} ok=${ok} fail=${fail}`);
}

async function backfillBlogPosts() {
  const cursor = BlogPost.find({ status: 'published', $or: [{ embedding: null }, { embedding: { $exists: false } }] })
    .select('+embedding')
    .cursor();
  let i = 0, ok = 0, fail = 0;
  for await (const b of cursor) {
    try {
      const vec = await embeddings.embedBlogPost(b);
      b.embedding = vec;
      b.embeddedAt = new Date();
      await b.save();
      ok += 1;
    } catch (e) {
      console.error(`[backfill] blog ${b._id} failed:`, e.message);
      fail += 1;
    }
    i += 1;
    if (i % BATCH === 0) {
      console.log(`[backfill] blogs processed=${i}`);
      await sleep(SLEEP_MS);
    }
  }
  console.log(`[backfill] blogs done total=${i} ok=${ok} fail=${fail}`);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[backfill] connected to mongo');
  await backfillProducts();
  await backfillBlogPosts();
  await mongoose.disconnect();
  console.log('[backfill] complete');
})().catch((e) => { console.error(e); process.exit(1); });
