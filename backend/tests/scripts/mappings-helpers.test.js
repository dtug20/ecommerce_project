const { usdToVnd, statusFromStock, slugify, sizesForType } = require('../../scripts/lib/mappings');

describe('mappings helpers', () => {
  it('converts USD to VND rounded to nearest 1000', () => {
    expect(usdToVnd(9.99)).toBe(250000);    // 249750 -> 250000
    expect(usdToVnd(129.99)).toBe(3250000); // 3249750 -> 3250000
    expect(usdToVnd(0.79)).toBe(20000);     // 19750 -> 20000
  });
  it('maps stock to hyphenated status enum', () => {
    expect(statusFromStock(0)).toBe('out-of-stock');
    expect(statusFromStock(5)).toBe('in-stock');
  });
  it('slugifies including Vietnamese diacritics and &', () => {
    expect(slugify('Tai nghe')).toBe('tai-nghe');
    expect(slugify('Nhà cửa & Đời sống')).toBe('nha-cua-doi-song');
    expect(slugify('Đồng hồ')).toBe('dong-ho');
  });
  it('returns clothing sizes for fashion, shoe sizes for Giày dép, [] otherwise', () => {
    expect(sizesForType('fashion', 'Thời trang nữ')).toEqual(['S', 'M', 'L']);
    expect(sizesForType('fashion', 'Giày dép')).toEqual(['38', '39', '40', '41', '42']);
    expect(sizesForType('electronics', 'Tai nghe')).toEqual([]);
  });
});
