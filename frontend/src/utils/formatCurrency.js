/**
 * Format a numeric amount as a currency string.
 * Uses Intl.NumberFormat for locale-aware formatting.
 *
 * NOTE: In React components, prefer `useCurrency().formatPrice()` hook instead —
 *       it automatically respects the user's selected currency.
 *       This utility is for non-component contexts (SSR, utils, etc.).
 *
 * @param {number|string} amount
 * @param {string} currency - ISO 4217 code (default 'USD')
 * @returns {string} e.g. "$12.99" or "₫300,000"
 */
export function formatCurrency(amount, currency = 'USD') {
  const num = Number(amount);
  if (isNaN(num)) return '$0.00';
  try {
    const fractionDigits = currency === 'VND' ? 0 : 2;
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}
