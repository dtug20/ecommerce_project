import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface PublicPaymentSettings {
  enabledGateways?: string[];
  // currency + currencySymbol removed — superseded by Zustand store + /exchange-rates
}

export interface PublicSettings {
  siteName?: string;
  siteDescription?: string;
  logo?: string | null;
  favicon?: string | null;
  ogImage?: string | null;
  theme?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  payment?: PublicPaymentSettings;
}

export function useSiteSettings() {
  return useQuery<PublicSettings>({
    queryKey: ['site-settings', 'public'],
    queryFn: async () => {
      const res = await api.get('/api/v1/store/settings');
      return (res.data?.data ?? {}) as PublicSettings;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
