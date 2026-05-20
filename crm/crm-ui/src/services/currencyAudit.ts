import api from './api';

export interface AuditProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discount?: number;
  img?: string;
  imageURLs?: Array<{ img: string }>;
  currencyReviewedAt: string | null;
  suggestedVndPrice: number;
}

export interface AuditPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BulkNormalizeResponse {
  updated: number;
  notFound: string[];
  invalidIds: string[];
}

export const currencyAuditApi = {
  list: async (params: { page?: number; limit?: number; showReviewed?: boolean }) => {
    const res = await api.get('/api/products/currency-audit', { params });
    // Backend returns { success, message, data: { items, currentRate }, pagination }
    // pagination is at top level, not nested under data
    return {
      items: res.data.data.items as AuditProduct[],
      currentRate: res.data.data.currentRate as number,
      pagination: res.data.pagination as AuditPagination,
    };
  },
  normalizeOne: async (id: string, fromCurrency: 'USD' | 'VND') => {
    const res = await api.post(`/api/products/${id}/normalize-currency`, { fromCurrency });
    return res.data.data;
  },
  normalizeBulk: async (ids: string[], fromCurrency: 'USD' | 'VND') => {
    const res = await api.post('/api/products/bulk-normalize-currency', { ids, fromCurrency });
    return res.data.data as BulkNormalizeResponse;
  },
};
