import { apiSlice } from "../api/apiSlice";

export const categoryApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    addCategory: builder.mutation({
      query: (data) => ({
        url: "/api/v1/admin/categories",
        method: "POST",
        body: data,
      }),
    }),
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
 useAddCategoryMutation,
 useGetProductTypeCategoryQuery,
 useGetShowCategoryQuery,
} = categoryApi;
