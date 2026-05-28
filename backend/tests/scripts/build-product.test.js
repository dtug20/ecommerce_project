'use strict';
const { buildProductDoc } = require('../../scripts/lib/build-product');

const phone = {
  title: 'iPhone 14 Pro', description: 'A great phone', category: 'smartphones',
  price: 999, discountPercentage: 10.5, stock: 12, rating: 4.8, sku: 'ELE-APP-001',
  weight: 1, tags: ['phone'], brand: 'Apple',
};

describe('buildProductDoc', () => {
  it('produces a schema-valid product doc with VND price and resolved refs', () => {
    const doc = buildProductDoc(phone, {
      importId: 'dummyjson:1', categoryId: 'cat1', brandName: 'Apple', brandId: 'br1',
      translation: { title_vi: 'iPhone 14 Pro', description_vi: 'Điện thoại tuyệt vời' },
      images: ['https://res.cloudinary.com/dfddeabbs/image/upload/dj-ele-app-001-0.webp'],
    });
    expect(doc.price).toBe(24975000);
    expect(doc.status).toBe('in-stock');
    expect(doc.productType).toBe('electronics');
    expect(doc.parent).toBe('Điện thoại');
    expect(doc.category).toEqual({ name: 'Điện thoại', id: 'cat1' });
    expect(doc.brand).toEqual({ name: 'Apple', id: 'br1' });
    expect(doc.img).toMatch(/^https:\/\/res\.cloudinary\.com\/dfddeabbs\//);
    expect(doc.imageURLs[0].sizes).toEqual([]); // electronics -> no sizes
    expect(doc.unit).toBe('1pc');
    expect(doc.importId).toBe('dummyjson:1');
    expect(doc.featured).toBe(true);
  });

  it('falls back to English title when no translation, and sets fashion sizes', () => {
    const dress = { ...phone, title: 'Red Summer Dress', category: 'womens-dresses', price: 40, stock: 0, rating: 3.9, sku: 'FAS-DRS-001', brand: null };
    const doc = buildProductDoc(dress, { importId: 'dummyjson:2', categoryId: 'c2', brandName: 'Shofy Wear', brandId: 'b2', translation: null, images: ['https://res.cloudinary.com/dfddeabbs/x.webp'] });
    expect(doc.title).toBe('Red Summer Dress');
    expect(doc.status).toBe('out-of-stock');
    expect(doc.productType).toBe('fashion');
    expect(doc.imageURLs[0].sizes).toEqual(['S', 'M', 'L']);
    expect(doc.featured).toBe(false);
  });
});
