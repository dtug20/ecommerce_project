// frontend/src/hooks/use-currency.js
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrency, selectCurrencyConfig } from '@/redux/features/currencySlice';
import { useGetExchangeRatesQuery } from '@/redux/features/exchangeRateApi';

const VND_FORMATTER = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/**
 * formatPrice(amountVnd) — converts a VND-base amount to the user's selected
 * currency and formats it with Intl.NumberFormat. If rates are unavailable,
 * falls back to rendering the input as VND.
 */
const useCurrency = () => {
  const currency = useSelector(selectCurrency);
  const config = useSelector(selectCurrencyConfig);
  const { data: ratesData } = useGetExchangeRatesQuery();
  const rate = currency === 'VND' ? 1 : (ratesData?.rates?.[currency] ?? null);

  // Build the active-currency formatter once per currency/config change, so a
  // product grid with N rows doesn't allocate N Intl.NumberFormat instances.
  const formatter = useMemo(() => {
    if (currency === 'VND' || !rate) return VND_FORMATTER;
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
  }, [currency, rate, config.locale, config.code, config.decimals]);

  const formatPrice = useCallback((amountVnd) => {
    const num = Number(amountVnd);
    if (!Number.isFinite(num)) return '';
    if (currency === 'VND' || !rate) return formatter.format(num);
    return formatter.format(num / rate);
  }, [currency, rate, formatter]);

  return {
    formatPrice,
    currency,
    config,
    rate,
    isStale: ratesData?.stale ?? false,
  };
};

export default useCurrency;
