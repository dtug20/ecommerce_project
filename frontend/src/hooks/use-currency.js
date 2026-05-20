// frontend/src/hooks/use-currency.js
import { useSelector } from 'react-redux';
import { selectCurrency, selectCurrencyConfig } from '@/redux/features/currencySlice';
import { useGetExchangeRatesQuery } from '@/redux/features/exchangeRateApi';

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

  const formatPrice = (amountVnd) => {
    const num = Number(amountVnd);
    if (!Number.isFinite(num)) return '';

    if (currency === 'VND' || !rate) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }
    const converted = num / rate;
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(converted);
  };

  return {
    formatPrice,
    currency,
    config,
    rate,
    isStale: ratesData?.stale ?? false,
  };
};

export default useCurrency;
