import { useSiteSettings } from './useSiteSettings';

const CURRENCY_TO_LOCALE: Record<string, string> = {
  USD: 'en-US',
  VND: 'vi-VN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['VND', 'JPY', 'KRW']);

export interface Formatters {
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function useFormatters(): Formatters {
  const { data } = useSiteSettings();
  const currency = data?.payment?.currency ?? 'USD';
  const locale = CURRENCY_TO_LOCALE[currency] ?? 'en-US';
  const zeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);

  return {
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: zeroDecimal ? 0 : 2,
      }).format(Number.isFinite(amount) ? amount : 0),
    formatDate: (dateString: string) =>
      new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  };
}
