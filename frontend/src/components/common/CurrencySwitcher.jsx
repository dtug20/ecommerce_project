// frontend/src/components/common/CurrencySwitcher.jsx
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import { selectCurrency, setCurrency, CURRENCY_CONFIG } from '@/redux/features/currencySlice';
import { usePatchUserPreferencesMutation } from '@/redux/features/userPreferencesApi';

const ORDER = ['VND', 'USD', 'EUR', 'GBP', 'JPY'];

export default function CurrencySwitcher() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currency = useSelector(selectCurrency);
  const [patchPrefs] = usePatchUserPreferencesMutation();

  const handleChange = async (e) => {
    const code = e.target.value;
    dispatch(setCurrency(code));
    try {
      const userInfo = JSON.parse(Cookies.get('userInfo') || '{}');
      if (userInfo.accessToken) await patchPrefs({ currency: code }).unwrap();
    } catch { /* ignore */ }
  };

  return (
    <div className="currency-switcher">
      <label className="visually-hidden">{t('common.currency', 'Currency')}</label>
      <select value={currency} onChange={handleChange} className="form-select form-select-sm">
        {ORDER.map((code) => (
          <option key={code} value={code}>
            {code} {CURRENCY_CONFIG[code].symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
