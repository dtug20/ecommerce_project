// frontend/src/utils/formatOrderAmount.js
const LOCALES = { VND: 'vi-VN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP' };

/**
 * formatOrderAmount(vndAmount, order)
 *
 * Formats an order-level VND-base amount in the currency the buyer saw at
 * checkout, using the rate snapshotted at order time.
 *
 * - If order is missing or has no displayCurrency, falls back to VND.
 * - If exchangeRate is missing or zero, falls back to VND.
 */
export default function formatOrderAmount(vndAmount, order) {
  const num = Number(vndAmount);
  if (!Number.isFinite(num)) return '';

  const cur = order?.displayCurrency || 'VND';
  const rate = Number(order?.exchangeRate) || 1;

  if (cur === 'VND' || rate === 1) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  }
  const converted = num / rate;
  const decimals = cur === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat(LOCALES[cur] || 'en-US', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(converted);
}
