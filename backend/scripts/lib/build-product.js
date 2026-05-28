'use strict';
const { usdToVnd, statusFromStock, slugify, sizesForType, mapDjToTaxonomy } = require('./mappings');

// ctx: { importId, categoryId, brandName, brandId, translation:{title_vi,description_vi}|null, images:[secure_url], taxonomy?:{productType,parent,children} }
function buildProductDoc(dj, ctx) {
  const tax = ctx.taxonomy || mapDjToTaxonomy(dj.category, dj);
  if (!tax) throw new Error(`No taxonomy mapping for DummyJSON category "${dj.category}"`);
  const title = ((ctx.translation && ctx.translation.title_vi) || dj.title || '').slice(0, 200);
  const description = (ctx.translation && ctx.translation.description_vi) || dj.description || title;
  const images = (ctx.images || []).filter(Boolean).slice(0, 4);
  if (images.length === 0) {
    throw new Error(`buildProductDoc requires at least one image in ctx.images (sku=${dj.sku || '?'})`);
  }
  const sizes = sizesForType(tax.productType, tax.parent);
  return {
    importId: ctx.importId,
    sku: dj.sku,
    title,
    slug: slugify(title),
    unit: '1pc',
    productType: tax.productType,
    parent: tax.parent,
    children: tax.children,
    category: { name: tax.parent, id: ctx.categoryId },
    brand: { name: ctx.brandName, id: ctx.brandId },
    price: usdToVnd(dj.price),
    discount: Math.round((dj.discountPercentage || 0) * 100) / 100,
    quantity: dj.stock,
    status: statusFromStock(dj.stock),
    description,
    img: images[0],
    imageURLs: images.map((u) => ({ img: u, color: { name: 'Mặc định', clrCode: '#000000' }, sizes })),
    tags: dj.tags || [],
    sizes,
    weight: dj.weight,
    featured: (dj.rating || 0) >= 4.5,
    sellCount: 0,
  };
}

module.exports = { buildProductDoc };
