# Shofy Backend

Express.js REST API for the Shofy e-commerce platform (port 7001).

## Chatbot setup

1. Set `GEMINI_API_KEY` in `.env` (Google AI Studio key — free tier works).
2. Create Atlas Vector Search indexes — see [docs/superpowers/plans/atlas-vector-index.md](../docs/superpowers/plans/atlas-vector-index.md).
3. Backfill embeddings for existing products + published blog posts:
   ```bash
   node scripts/backfill-embeddings.js
   ```
   The script batches 20 docs and sleeps 500 ms between batches to stay under the Gemini free-tier rate limit.
4. Start the server: `npm run dev`. The debounced re-embed queue starts automatically and re-embeds products/blogs ~30 s after each create/update.

## Useful scripts

```bash
npm run dev                          # nodemon on port 7001
node scripts/backfill-embeddings.js  # one-shot embed backfill
```
