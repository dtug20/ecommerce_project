// frontend/src/redux/features/exchangeRateApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const exchangeRateApi = createApi({
  reducerPath: 'exchangeRateApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001',
  }),
  endpoints: (builder) => ({
    getExchangeRates: builder.query({
      query: () => '/api/v1/store/exchange-rates',
      transformResponse: (response) => response.data,
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetExchangeRatesQuery } = exchangeRateApi;
