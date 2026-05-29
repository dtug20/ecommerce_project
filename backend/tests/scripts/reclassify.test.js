'use strict';

const { reclassifyExisting, isVnSpecial } = require('../../scripts/lib/mappings');

it('re-files the 5 orphans into home/sports', () => {
  expect(reclassifyExisting({ title: 'Bamboo Tea Set', parent: 'Headphones', productType: 'home' })).toMatchObject({ productType: 'home', parent: 'Đồ bếp' });
  expect(reclassifyExisting({ title: 'Rattan Pendant Lamp', parent: 'Headphones', productType: 'home' })).toMatchObject({ parent: 'Trang trí nhà cửa' });
  expect(reclassifyExisting({ title: 'Linen Bedding Set Queen', parent: 'Headphones', productType: 'home' })).toMatchObject({ parent: 'Nội thất' });
  expect(reclassifyExisting({ title: 'Yoga Mat Premium 6mm', parent: 'Headphones', productType: 'sports' })).toMatchObject({ productType: 'sports', parent: 'Dụng cụ thể thao' });
});
it('uses oldParent map for normal items and re-files watches', () => {
  expect(reclassifyExisting({ title: 'Gaming Headphone', parent: 'Headphones', productType: 'electronics' })).toMatchObject({ parent: 'Tai nghe' });
  expect(reclassifyExisting({ title: 'Rolex Datejust Women', parent: 'Bracelets', productType: 'jewelry' })).toMatchObject({ parent: 'Đồng hồ' });
  expect(reclassifyExisting({ title: 'iPhone 14 Pro', parent: 'Mobile Tablets', productType: 'electronics' })).toMatchObject({ parent: 'Điện thoại' });
});
it('flags the 7 VN-special items', () => {
  expect(isVnSpecial('Ao Dai Truyen Thong Lua new')).toBe(true);
  expect(isVnSpecial('Gaming Headphone')).toBe(false);
});
