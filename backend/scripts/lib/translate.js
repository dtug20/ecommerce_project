'use strict';
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

const hash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);
const loadCache = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } };
const saveCache = (p, c) => fs.writeFileSync(p, JSON.stringify(c, null, 1));

// Default real Gemini call: returns [{sku,title_vi,description_vi}] for a batch.
async function defaultCallGemini(batch, { model = process.env.GEMINI_CHAT_MODEL, key = process.env.GEMINI_API_KEY } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const prompt = 'Dịch sang tiếng Việt thương mại tự nhiên. Trả về JSON array [{"sku","title_vi","description_vi"}], giữ nguyên sku:\n' + JSON.stringify(batch.map((b) => ({ sku: b.sku, title: b.title, description: b.description })));
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, response_mime_type: 'application/json' } };
  const { data } = await axios.post(url, body, { timeout: 30000 });
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

async function translateProducts(items, { cachePath, callGemini = defaultCallGemini, batchSize = 10 } = {}) {
  const cache = loadCache(cachePath);
  const out = new Map();
  const todo = [];
  for (const it of items) {
    const h = hash((it.title || '') + '|' + (it.description || ''));
    const c = cache[it.sku];
    if (c && c.src_hash === h) out.set(it.sku, { title_vi: c.title_vi, description_vi: c.description_vi });
    else todo.push({ ...it, _h: h });
  }
  for (let i = 0; i < todo.length; i += batchSize) {
    const batch = todo.slice(i, i + batchSize);
    let translated;
    try {
      const res = await callGemini(batch.map(({ sku, title, description }) => ({ sku, title, description })));
      translated = new Map(res.map((r) => [r.sku, r]));
    } catch (e) {
      translated = null; // whole-batch failure -> English fallback for this batch
    }
    for (const b of batch) {
      const t = translated && translated.get(b.sku);
      if (t && t.title_vi) {
        out.set(b.sku, { title_vi: t.title_vi, description_vi: t.description_vi || b.description });
        cache[b.sku] = { title_vi: t.title_vi, description_vi: t.description_vi || b.description, src_hash: b._h, model: process.env.GEMINI_CHAT_MODEL || 'gemini' };
      } else {
        out.set(b.sku, { title_vi: b.title, description_vi: b.description }); // fallback, NOT cached
      }
    }
  }
  if (cachePath) saveCache(cachePath, cache);
  return out;
}

module.exports = { translateProducts, defaultCallGemini };
