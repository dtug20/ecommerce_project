/**
 * Debounced embedding queue.
 *
 * When a product or blog post is created/updated, controllers call
 * `schedule(type, id)`. The item is held in an in-memory map and re-embedded
 * DEBOUNCE_MS after the most recent schedule call — back-to-back saves
 * collapse into a single embed.
 *
 * This is best-effort and single-process: queued items are lost on restart,
 * and a multi-instance deployment will double-embed. Acceptable trade-off
 * given hourly product updates and Gemini free-tier rate limits.
 */
const Product = require('../../model/Products');
const BlogPost = require('../../model/BlogPost');
const embeddings = require('./embeddings');

const DEBOUNCE_MS = 30_000;
const TICK_MS = 10_000;

const pending = new Map(); // key = `${type}:${id}` -> { type, id, scheduledAt }

function schedule(type, id) {
  if (!id) return;
  pending.set(`${type}:${id}`, {
    type,
    id: String(id),
    scheduledAt: Date.now() + DEBOUNCE_MS,
  });
}

async function tick() {
  const now = Date.now();
  for (const [key, item] of pending.entries()) {
    if (item.scheduledAt > now) continue;
    pending.delete(key);
    try {
      if (item.type === 'product') {
        const p = await Product.findById(item.id).select('+embedding');
        if (!p) continue;
        p.embedding = await embeddings.embedProduct(p);
        p.embeddedAt = new Date();
        await p.save();
      } else if (item.type === 'blogpost') {
        const b = await BlogPost.findById(item.id).select('+embedding');
        if (!b || b.status !== 'published') continue;
        b.embedding = await embeddings.embedBlogPost(b);
        b.embeddedAt = new Date();
        await b.save();
      }
    } catch (e) {
      console.warn(`[embedQueue] ${key} failed:`, e.message);
    }
  }
}

let interval = null;
function start() {
  if (interval) return;
  interval = setInterval(tick, TICK_MS);
  if (interval.unref) interval.unref();
}

function stop() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

module.exports = { schedule, start, stop, _tick: tick, _pending: pending };
