'use strict';

const USD_TO_VND = 25000;

const usdToVnd = (usd) => Math.round((Number(usd) * USD_TO_VND) / 1000) * 1000;

const statusFromStock = (stock) => (Number(stock) === 0 ? 'out-of-stock' : 'in-stock');

// Remove Vietnamese diacritics, drop '&', collapse spaces to single dashes, lowercase.
const slugify = (str) =>
  String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining marks
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sizesForType = (productType, parent) => {
  if (productType === 'fashion' && parent === 'Giày dép') return ['38', '39', '40', '41', '42'];
  if (productType === 'fashion') return ['S', 'M', 'L'];
  return [];
};

const PRODUCT_TYPES = ['electronics', 'fashion', 'beauty', 'jewelry', 'home', 'sports'];

// FROZEN canonical taxonomy. `oldParent` (when present) is the existing Category.parent to
// RENAME in place (preserves _id); absorb[] lists extra old parents merged into this one.
const CATEGORY_TREE = [
  // electronics
  { parent: 'Tai nghe',            productType: 'electronics', oldParent: 'Headphones',     children: ['Bluetooth','Nhét tai','Chụp tai'], featured: true,  sortOrder: 1 },
  { parent: 'Điện thoại',          productType: 'electronics',                              children: ['Apple','Samsung','Android'],       featured: true,  sortOrder: 2 },
  { parent: 'Máy tính bảng',       productType: 'electronics', oldParent: 'Mobile Tablets', children: ['Apple','Samsung'],                  featured: false, sortOrder: 3 },
  { parent: 'Laptop',              productType: 'electronics', oldParent: 'pc',             children: ['Apple','Dell','Asus','Lenovo'],     featured: false, sortOrder: 4 },
  { parent: 'Đồng hồ thông minh',  productType: 'electronics', oldParent: 'Smart Watch',    children: ['Apple Watch','Thể thao'],           featured: false, sortOrder: 5 },
  { parent: 'Phụ kiện điện tử',    productType: 'electronics', oldParent: 'Bluetooth', absorb: ['CPU Heat Pipes'], children: ['Sạc & Cáp','Loa','Phụ kiện PC'], featured: false, sortOrder: 6 },
  // fashion
  { parent: 'Thời trang nữ',       productType: 'fashion', oldParent: 'Clothing', children: ['Đầm','Áo','Truyền thống'], featured: true,  sortOrder: 7 },
  { parent: 'Thời trang nam',      productType: 'fashion',                        children: ['Sơ mi','Áo thun'],         featured: false, sortOrder: 8 },
  { parent: 'Giày dép',            productType: 'fashion', oldParent: 'Shoes',    children: ['Nam','Nữ'],                featured: false, sortOrder: 9 },
  { parent: 'Túi xách',            productType: 'fashion', oldParent: 'Bags',     children: ['Túi đeo','Túi du lịch'],   featured: false, sortOrder: 10 },
  { parent: 'Kính mát',            productType: 'fashion',                        children: ['Nam','Nữ'],                featured: false, sortOrder: 11 },
  // beauty
  { parent: 'Chăm sóc da',         productType: 'beauty', oldParent: 'Discover Skincare', absorb: ['Beauty of Skin'], children: ['Serum','Kem dưỡng','Mặt nạ'], featured: true,  sortOrder: 12 },
  { parent: 'Trang điểm',          productType: 'beauty', oldParent: 'Awesome Lip Care',  absorb: ['Facial Care'],    children: ['Son','Phấn','Cọ trang điểm'], featured: false, sortOrder: 13 },
  { parent: 'Nước hoa',            productType: 'beauty',                                                              children: ['Nữ','Nam'],                   featured: false, sortOrder: 14 },
  // jewelry
  { parent: 'Vòng tay',            productType: 'jewelry', oldParent: 'Bracelets', children: ['Vàng','Bạc'], featured: false, sortOrder: 15 },
  { parent: 'Hoa tai',             productType: 'jewelry', oldParent: 'Earrings',  children: ['Vàng','Bạc'], featured: false, sortOrder: 16 },
  { parent: 'Dây chuyền',          productType: 'jewelry', oldParent: 'Necklaces', children: ['Vàng','Bạc'], featured: false, sortOrder: 17 },
  { parent: 'Nhẫn',                productType: 'jewelry',                         children: ['Vàng','Bạc'], featured: false, sortOrder: 18 },
  { parent: 'Đồng hồ',             productType: 'jewelry',                         children: ['Nam','Nữ'],   featured: true,  sortOrder: 19 },
  // home
  { parent: 'Trang trí nhà cửa',   productType: 'home', children: ['Đèn','Đồ trang trí'],     featured: true,  sortOrder: 20 },
  { parent: 'Nội thất',            productType: 'home', children: ['Phòng khách','Phòng ngủ'], featured: false, sortOrder: 21 },
  { parent: 'Đồ bếp',              productType: 'home', children: ['Dụng cụ','Bộ ấm trà'],     featured: false, sortOrder: 22 },
  // sports
  { parent: 'Dụng cụ thể thao',    productType: 'sports', children: ['Yoga','Gym','Phụ kiện'], featured: false, sortOrder: 23 },
];

const EXCLUDED_DJ = ['groceries', 'motorcycle', 'vehicle'];

// DummyJSON category slug -> { productType, parent }. Excluded cats intentionally absent.
const DJ_CATEGORY_MAP = {
  laptops:             { productType: 'electronics', parent: 'Laptop' },
  smartphones:         { productType: 'electronics', parent: 'Điện thoại' },
  'mobile-accessories':{ productType: 'electronics', parent: 'Phụ kiện điện tử' },
  tablets:             { productType: 'electronics', parent: 'Máy tính bảng' },
  'womens-dresses':    { productType: 'fashion', parent: 'Thời trang nữ' },
  tops:                { productType: 'fashion', parent: 'Thời trang nữ' },
  'mens-shirts':       { productType: 'fashion', parent: 'Thời trang nam' },
  'mens-shoes':        { productType: 'fashion', parent: 'Giày dép' },
  'womens-shoes':      { productType: 'fashion', parent: 'Giày dép' },
  'womens-bags':       { productType: 'fashion', parent: 'Túi xách' },
  sunglasses:          { productType: 'fashion', parent: 'Kính mát' },
  beauty:              { productType: 'beauty', parent: 'Trang điểm' },
  fragrances:          { productType: 'beauty', parent: 'Nước hoa' },
  'skin-care':         { productType: 'beauty', parent: 'Chăm sóc da' },
  'womens-jewellery':  { productType: 'jewelry', parent: 'Nhẫn' },
  'womens-watches':    { productType: 'jewelry', parent: 'Đồng hồ' },
  'mens-watches':      { productType: 'jewelry', parent: 'Đồng hồ' },
  'home-decoration':   { productType: 'home', parent: 'Trang trí nhà cửa' },
  furniture:           { productType: 'home', parent: 'Nội thất' },
  'kitchen-accessories':{ productType: 'home', parent: 'Đồ bếp' },
  'sports-accessories':{ productType: 'sports', parent: 'Dụng cụ thể thao' },
};

const HOUSE_BRANDS = {
  electronics: 'Shofy Tech',
  fashion: 'Shofy Wear',
  beauty: 'Shofy Beauty',
  jewelry: 'Shofy Jewels',
  home: 'Shofy Home',
  sports: 'Shofy Sport',
};

// 7 frozen VN-special items (match by title substring, case-insensitive).
const VN_SPECIAL = [
  'Ao Dai Truyen Thong Lua',
  'Linen Summer Dress',
  'Silk Scarf Hand-painted',
  'K-Beauty Cleansing Set',
  'Bamboo Tea Set',
  'Rattan Pendant Lamp',
  'Linen Bedding Set Queen',
];

const SOFT_DELETE_PARENTS = ['CPU Heat Pipes', 'Beauty of Skin', 'Facial Care'];

// Brand-fix matrix for existing products. Each rule: { when:(p)=>bool, brand:string }.
// First matching rule wins. `p` = { title, productType, brandName }.
// Note: the beauty/home/sports/jewelry rules fire unconditionally per productType because the
// existing 53 catalog rows in those verticals carry wrong/junk brand names across the board;
// normalizing to a house brand is intended, not a bug. Electronics keeps a brand-specific guard.
const _wrongBrands = new Set(['Logitech', 'Antec', 'Sony', 'Deepcool', 'Lenovo']);
const BRAND_FIX_RULES = [
  { when: (p) => p.productType === 'fashion' && /ao dai|linen summer dress|silk scarf|tote|traveling bag/i.test(p.title), brand: 'Legendary Whitetails' },
  { when: (p) => p.productType === 'beauty', brand: 'INIKA' },
  { when: (p) => p.productType === 'home',   brand: HOUSE_BRANDS.home },
  { when: (p) => p.productType === 'sports', brand: HOUSE_BRANDS.sports },
  { when: (p) => p.productType === 'jewelry', brand: HOUSE_BRANDS.jewelry },
  { when: (p) => p.productType === 'electronics' && /headphone|earbud|speaker|wireless/i.test(p.title) && _wrongBrands.has(p.brandName), brand: 'Sony' },
];

// Returns a corrected brand name if the current brand is wrong for the product, else null.
const brandFixFor = (p) => {
  for (const r of BRAND_FIX_RULES) if (r.when(p)) return r.brand;
  return null;
};

// Choose the single `children` String for a product given its DJ category + fields.
const pickChildren = (djCategory, dj, parent) => {
  const node = CATEGORY_TREE.find((c) => c.parent === parent);
  const kids = (node && node.children) || [];
  const title = (dj.title || '').toLowerCase();
  const brand = (dj.brand || '').toLowerCase();
  if (kids.includes('Apple') && (/apple|iphone|ipad|macbook/.test(title) || brand === 'apple')) return 'Apple';
  if (kids.includes('Samsung') && (/samsung|galaxy/.test(title) || brand === 'samsung')) return 'Samsung';
  if (djCategory === 'tops') return kids.includes('Áo') ? 'Áo' : kids[0];
  if (djCategory === 'mens-shoes' || djCategory === 'mens-shirts' || djCategory === 'mens-watches') return kids.includes('Nam') ? 'Nam' : kids[0];
  if (djCategory === 'womens-shoes' || djCategory === 'womens-watches') return kids.includes('Nữ') ? 'Nữ' : kids[0];
  return kids[0] || 'Khác';
};

const mapDjToTaxonomy = (djCategory, dj = {}) => {
  const m = DJ_CATEGORY_MAP[djCategory];
  if (!m) return null; // excluded / unknown
  return { productType: m.productType, parent: m.parent, children: pickChildren(djCategory, dj, m.parent) };
};

const _catByParent = (parent) => CATEGORY_TREE.find((c) => c.parent === parent);

const isVnSpecial = (title) => VN_SPECIAL.some((s) => String(title || '').toLowerCase().includes(s.toLowerCase()));

// Reclassify an EXISTING product (not from DummyJSON). p = {title, parent, productType, brandName}.
// Note: the watch regex is intentionally broad (/\bwatch\b|rolex|datejust|omega|casio|seiko/) to
// capture luxury watch brand names that don't include "watch" literally (e.g. "Rolex Datejust Women").
// This is a deliberate deviation from the plan's narrower /\bwatch\b/ to satisfy the test assertion
// that "Rolex Datejust Women" → parent: 'Đồng hồ'. Plan inconsistency acknowledged.
function reclassifyExisting(p) {
  const t = String(p.title || '').toLowerCase();
  const target = (parent) => {
    const node = _catByParent(parent);
    return { productType: node.productType, parent: node.parent, children: pickChildren(null, { title: p.title, brand: p.brandName }, node.parent) };
  };
  if (/tea set|bamboo/.test(t)) return target('Đồ bếp');
  if (/pendant lamp|rattan|\blamp\b/.test(t)) return target('Trang trí nhà cửa');
  if (/bedding|duvet|bed sheet/.test(t)) return target('Nội thất');
  if (/yoga|resistance band|dumbbell|treadmill|gym/.test(t)) return target('Dụng cụ thể thao');
  if (/(\bwatch\b|rolex|datejust|omega|casio|seiko)/.test(t) && !/smart\s*watch|apple watch/.test(t)) return target('Đồng hồ');
  if (/(iphone|galaxy s\d|smartphone|\bphone\b)/.test(t) && !/case|cover|charger|cable|headphone/.test(t)) return target('Điện thoại');
  const node = CATEGORY_TREE.find((c) => c.oldParent === p.parent);
  if (node) return { productType: node.productType, parent: node.parent, children: pickChildren(null, { title: p.title, brand: p.brandName }, node.parent) };
  const byType = CATEGORY_TREE.find((c) => c.productType === p.productType);
  if (byType) return { productType: byType.productType, parent: byType.parent, children: byType.children[0] };
  return null;
}

module.exports = {
  USD_TO_VND, usdToVnd, statusFromStock, slugify, sizesForType,
  PRODUCT_TYPES, CATEGORY_TREE, EXCLUDED_DJ, DJ_CATEGORY_MAP, HOUSE_BRANDS,
  VN_SPECIAL, SOFT_DELETE_PARENTS, brandFixFor, pickChildren, mapDjToTaxonomy,
  reclassifyExisting, isVnSpecial,
};
