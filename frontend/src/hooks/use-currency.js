import { useSelector } from "react-redux";
import { selectCurrency, selectCurrencyConfig, selectExchangeRate } from "@/redux/features/currencySlice";

/**
 * Hook that returns a `formatPrice` function respecting the user's selected currency.
 *
 * All product prices in the database are stored in USD.
 * When the user picks VND, we multiply by the exchange rate and format accordingly.
 *
 * Usage:
 *   const { formatPrice, currency } = useCurrency();
 *   <span>{formatPrice(product.price)}</span>
 */
const useCurrency = () => {
  const currency = useSelector(selectCurrency);
  const config = useSelector(selectCurrencyConfig);
  const rate = useSelector(selectExchangeRate);

  const formatPrice = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return config?.symbol ? `${config.symbol}0` : '$0.00';

    const converted = num * rate;

    try {
      // VND typically has no decimal places
      const fractionDigits = currency === 'VND' ? 0 : 2;
      return new Intl.NumberFormat(config?.locale || 'en-US', {
        style: 'currency',
        currency: config?.code || 'USD',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(converted);
    } catch {
      return `${config?.symbol || '$'}${converted.toFixed(currency === 'VND' ? 0 : 2)}`;
    }
  };

  return { formatPrice, currency, config, rate };
};

export default useCurrency;
