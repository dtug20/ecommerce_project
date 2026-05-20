// frontend/src/redux/features/currencySlice.js
import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

export const CURRENCY_CONFIG = {
  VND: { code: 'VND', symbol: '₫', locale: 'vi-VN', decimals: 0 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', decimals: 0 },
};

const COOKIE_NAME = 'display_currency';

const currencySlice = createSlice({
  name: 'currency',
  initialState: { currency: 'VND' },  // SSR-safe default
  reducers: {
    setCurrency: (state, action) => {
      const code = action.payload;
      if (CURRENCY_CONFIG[code]) {
        state.currency = code;
        if (typeof window !== 'undefined') {
          try { Cookies.set(COOKIE_NAME, code, { expires: 365 }); } catch { /* ignore */ }
        }
      }
    },
    hydrateCurrencyFromCookie: (state) => {
      if (typeof window !== 'undefined') {
        try {
          const saved = Cookies.get(COOKIE_NAME);
          if (saved && CURRENCY_CONFIG[saved]) state.currency = saved;
        } catch { /* ignore */ }
      }
    },
  },
});

export const { setCurrency, hydrateCurrencyFromCookie } = currencySlice.actions;

export const selectCurrency = (state) => state.currency.currency;
export const selectCurrencyConfig = (state) => CURRENCY_CONFIG[state.currency.currency];

export default currencySlice.reducer;
