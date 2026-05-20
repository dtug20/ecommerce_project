import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface ExchangeRateData {
  base: 'VND';
  rates: { USD: number; EUR: number; GBP: number; JPY: number };
  stale: boolean;
  updatedAt: string;
}

export function useExchangeRates() {
  return useQuery<ExchangeRateData>({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const res = await api.get('/api/exchange-rates');
      return res.data?.data as ExchangeRateData;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
}
