'use strict';
const fs = require('fs');
const axios = require('axios');
const cloudinary = require('../../utils/cloudinary'); // configured with dfddeabbs

const loadManifest = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } };
const saveManifest = (p, m) => { if (p) fs.writeFileSync(p, JSON.stringify(m, null, 1)); };

async function defaultDownload(url) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  return Buffer.from(data);
}

async function defaultUpload(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shofy/products', public_id: publicId, overwrite: false, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

// sources: array of remote image URLs. prefix: deterministic public_id stem.
// Returns array of Cloudinary secure_urls (cap 4), idempotent via manifest[publicId].
async function processImages(sources, prefix, { manifestPath, download = defaultDownload, upload = defaultUpload, retries = 3 } = {}) {
  const manifest = loadManifest(manifestPath);
  const urls = [];
  const capped = [...new Set(sources.filter(Boolean))].slice(0, 4);
  for (let k = 0; k < capped.length; k++) {
    const publicId = `${prefix}-${k}`;
    if (manifest[publicId]) { urls.push(manifest[publicId]); continue; }
    let buf = null;
    for (let attempt = 0; attempt < retries && !buf; attempt++) {
      try { buf = await download(capped[k]); } catch (e) { if (attempt === retries - 1) buf = null; }
    }
    if (!buf) continue; // skip this image, keep the rest
    const res = await upload(buf, publicId);
    manifest[publicId] = res.secure_url;
    urls.push(res.secure_url);
  }
  saveManifest(manifestPath, manifest);
  return urls;
}

module.exports = { processImages, defaultDownload, defaultUpload };
