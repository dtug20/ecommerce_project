'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { processImages } = require('../../scripts/lib/images');

it('uploads each source once, caps at 4, and is idempotent via manifest', async () => {
  const manifestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'im-')), 'm.json');
  let uploads = 0;
  const download = async () => Buffer.from('img');
  const upload = async (buf, publicId) => { uploads += 1; return { secure_url: `https://res.cloudinary.com/dfddeabbs/${publicId}.webp`, public_id: publicId }; };
  const srcs = ['a', 'b', 'c', 'd', 'e']; // 5 -> capped to 4
  const r1 = await processImages(srcs, 'dj-sku-001', { manifestPath, download, upload });
  expect(r1).toHaveLength(4);
  expect(r1[0]).toMatch(/^https:\/\/res\.cloudinary\.com\/dfddeabbs\//);
  expect(uploads).toBe(4);
  const r2 = await processImages(srcs, 'dj-sku-001', { manifestPath, download, upload }); // cached
  expect(uploads).toBe(4);                    // no new uploads
  expect(r2).toEqual(r1);
});

it('skips a source that fails to download but keeps the rest', async () => {
  const manifestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'im-')), 'm.json');
  const download = async (url) => { if (url === 'bad') throw new Error('404'); return Buffer.from('x'); };
  const upload = async (buf, publicId) => ({ secure_url: `https://res.cloudinary.com/dfddeabbs/${publicId}.webp`, public_id: publicId });
  const r = await processImages(['ok', 'bad'], 'dj-sku-002', { manifestPath, download, upload });
  expect(r).toHaveLength(1);
});
