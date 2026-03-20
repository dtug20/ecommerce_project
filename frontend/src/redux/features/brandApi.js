import { apiSlice } from "../api/apiSlice";

export const brandApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    getActiveBrands: builder.query({
      query: () => `/api/v1/store/brands/active`
    }),
  }),
});

export const {
 useGetActiveBrandsQuery
} = brandApi;
