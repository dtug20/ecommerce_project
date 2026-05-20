import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'GBP' | 'JPY';

interface State {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}

export const useCurrencyStore = create<State>()(
  persist(
    (set) => ({
      currency: 'VND',
      setCurrency: (c) => set({ currency: c }),
    }),
    { name: 'crm_display_currency' },
  ),
);
