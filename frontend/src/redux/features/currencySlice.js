import { createSlice } from "@reduxjs/toolkit";

// Exchange rates relative to USD (base)
const EXCHANGE_RATES = {
  USD: 1,
  VND: 25450, // 1 USD ≈ 25,450 VND (update periodically)
};

const CURRENCY_CONFIG = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  VND: { code: 'VND', symbol: '₫', locale: 'vi-VN' },
};

const currencySlice = createSlice({
  name: 'currency',
  // Always start with USD to match SSR — localStorage is loaded after hydration
  initialState: {
    currency: 'USD',
    rates: EXCHANGE_RATES,
    config: CURRENCY_CONFIG,
  },
  reducers: {
    setCurrency: (state, action) => {
      const code = action.payload;
      if (CURRENCY_CONFIG[code]) {
        state.currency = code;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('selected_currency', code);
          } catch { /* ignore */ }
        }
      }
    },
    // Called once after hydration to restore from localStorage
    hydrateCurrency: (state) => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('selected_currency');
          if (saved && CURRENCY_CONFIG[saved]) {
            state.currency = saved;
          }
        } catch { /* ignore */ }
      }
    },
  },
});

export const { setCurrency, hydrateCurrency } = currencySlice.actions;

// Selectors
export const selectCurrency = (state) => state.currency.currency;
export const selectCurrencyConfig = (state) => state.currency.config[state.currency.currency];
export const selectExchangeRate = (state) => state.currency.rates[state.currency.currency] || 1;

export default currencySlice.reducer;
