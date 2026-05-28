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

module.exports = { USD_TO_VND, usdToVnd, statusFromStock, slugify, sizesForType };
