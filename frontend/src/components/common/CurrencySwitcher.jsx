// frontend/src/components/common/CurrencySwitcher.jsx
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectCurrency, CURRENCY_CONFIG } from '@/redux/features/currencySlice';
import useSetCurrency from '@/hooks/use-set-currency';

const ORDER = ['VND', 'USD', 'EUR', 'GBP', 'JPY'];

export default function CurrencySwitcher() {
  const { t } = useTranslation();
  const currency = useSelector(selectCurrency);
  const setCurrency = useSetCurrency();

  return (
    <div className="currency-switcher">
      <label htmlFor="currency-switcher-select" className="visually-hidden">
        {t('common.currency', 'Currency')}
      </label>
      <select
        id="currency-switcher-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="form-select form-select-sm"
      >
        {ORDER.map((code) => (
          <option key={code} value={code}>
            {code} {CURRENCY_CONFIG[code].symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
