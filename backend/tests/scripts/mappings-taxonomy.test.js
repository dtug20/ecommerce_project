const {
  CATEGORY_TREE, DJ_CATEGORY_MAP, EXCLUDED_DJ, HOUSE_BRANDS, VN_SPECIAL,
  SOFT_DELETE_PARENTS, PRODUCT_TYPES, mapDjToTaxonomy, brandFixFor,
} = require('../../scripts/lib/mappings');

describe('frozen taxonomy', () => {
  it('only uses the 6 productTypes (lowercase) and unique parents', () => {
    const types = new Set(CATEGORY_TREE.map(c => c.productType));
    expect([...types].sort()).toEqual(['beauty','electronics','fashion','home','jewelry','sports']);
    const parents = CATEGORY_TREE.map(c => c.parent);
    expect(new Set(parents).size).toBe(parents.length); // unique
    expect(PRODUCT_TYPES).toEqual(['electronics','fashion','beauty','jewelry','home','sports']);
  });
  it('covers home and sports so nothing is orphaned', () => {
    expect(CATEGORY_TREE.some(c => c.productType === 'home')).toBe(true);
    expect(CATEGORY_TREE.some(c => c.productType === 'sports')).toBe(true);
  });
  it('maps every non-excluded DummyJSON category to a parent that exists in the tree', () => {
    const parents = new Set(CATEGORY_TREE.map(c => c.parent));
    for (const [dj, m] of Object.entries(DJ_CATEGORY_MAP)) {
      expect(PRODUCT_TYPES).toContain(m.productType);
      expect(parents.has(m.parent)).toBe(true);
    }
  });
  it('routes watches to the dedicated Đồng hồ jewelry category (finding #6)', () => {
    expect(mapDjToTaxonomy('mens-watches', { title: 'Rolex' })).toMatchObject({ productType: 'jewelry', parent: 'Đồng hồ' });
    expect(mapDjToTaxonomy('womens-watches', { title: 'Datejust' })).toMatchObject({ productType: 'jewelry', parent: 'Đồng hồ' });
  });
  it('routes smartphones to electronics/Điện thoại with a children value', () => {
    const r = mapDjToTaxonomy('smartphones', { title: 'iPhone 14 Pro', brand: 'Apple' });
    expect(r).toMatchObject({ productType: 'electronics', parent: 'Điện thoại' });
    expect(typeof r.children).toBe('string');
    expect(r.children.length).toBeGreaterThan(0);
  });
  it('excludes groceries/motorcycle/vehicle', () => {
    expect(EXCLUDED_DJ).toEqual(expect.arrayContaining(['groceries','motorcycle','vehicle']));
    expect(DJ_CATEGORY_MAP['groceries']).toBeUndefined();
  });
  it('has a house brand per productType and freezes 7 VN-special items', () => {
    expect(Object.keys(HOUSE_BRANDS).sort()).toEqual(['beauty','electronics','fashion','home','jewelry','sports']);
    expect(VN_SPECIAL.length).toBe(7);
  });
  it('brandFixFor reassigns Logitech-on-clothing to a sensible brand', () => {
    const fix = brandFixFor({ title: 'Ao Dai Truyen Thong Lua new', productType: 'fashion', brandName: 'Logitech' });
    expect(fix).toBeTruthy();
    expect(fix).not.toBe('Logitech');
  });
  it('soft-delete list names the 3 merged-away categories', () => {
    expect(SOFT_DELETE_PARENTS).toEqual(expect.arrayContaining(['CPU Heat Pipes','Beauty of Skin','Facial Care']));
  });
});
