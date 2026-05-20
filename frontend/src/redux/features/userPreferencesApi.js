// frontend/src/redux/features/userPreferencesApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export const userPreferencesApi = createApi({
  reducerPath: 'userPreferencesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001',
    prepareHeaders: (headers) => {
      try {
        const userInfo = JSON.parse(Cookies.get('userInfo') || '{}');
        if (userInfo.accessToken) headers.set('Authorization', `Bearer ${userInfo.accessToken}`);
      } catch { /* no-op */ }
      return headers;
    },
  }),
  tagTypes: ['UserPreferences'],
  endpoints: (builder) => ({
    getUserPreferences: builder.query({
      query: () => '/api/v1/user/preferences',
      transformResponse: (r) => r.data,
      providesTags: ['UserPreferences'],
    }),
    patchUserPreferences: builder.mutation({
      query: (body) => ({
        url: '/api/v1/user/preferences',
        method: 'PATCH',
        body,
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: ['UserPreferences'],
    }),
  }),
});

export const { useGetUserPreferencesQuery, usePatchUserPreferencesMutation } = userPreferencesApi;
