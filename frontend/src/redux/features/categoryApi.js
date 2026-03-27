import { apiSlice } from "../api/apiSlice";

export const categoryApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    getShowCategory: builder.query({
      query: () => `/api/v1/store/categories/show`,
      transformResponse: (response) => ({
        result: response.data || response.result || response,
      }),
    }),
    getProductTypeCategory: builder.query({
      query: (type) => `/api/v1/store/categories/show/${type}`,
      transformResponse: (response) => ({
        result: response.data || response.result || response,
      }),
    }),
  }),
});

export const {
 useGetProductTypeCategoryQuery,
 useGetShowCategoryQuery,
} = categoryApi;
