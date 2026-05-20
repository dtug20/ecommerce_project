import { useCurrencyStore, type CurrencyCode } from '@/stores/useCurrencyStore';
import { useExchangeRates } from './useExchangeRates';

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; decimals: number; symbol: string }> = {
  VND: { locale: 'vi-VN', decimals: 0, symbol: '₫' },
  USD: { locale: 'en-US', decimals: 2, symbol: '$' },
  EUR: { locale: 'de-DE', decimals: 2, symbol: '€' },
  GBP: { locale: 'en-GB', decimals: 2, symbol: '£' },
  JPY: { locale: 'ja-JP', decimals: 0, symbol: '¥' },
};

export interface Formatters {
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  currency: CurrencyCode;
  isStale: boolean;
}

export function useFormatters(): Formatters {
  const currency = useCurrencyStore((s) => s.currency);
  const { data: ratesData } = useExchangeRates();
  const config = CURRENCY_CONFIG[currency];
  const rate = currency === 'VND' ? 1 : (ratesData?.rates?.[currency] ?? null);

  return {
    formatCurrency: (amountVnd: number) => {
      const num = Number(amountVnd);
      if (!Number.isFinite(num)) return '';
      if (currency === 'VND' || !rate) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
      }
      const converted = num / rate;
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
      }).format(converted);
    },
    formatDate: (s: string) =>
      new Date(s).toLocaleDateString(config.locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    currency,
    isStale: ratesData?.stale ?? false,
  };
}
