import { apiSlice } from "../api/apiSlice";

export const cmsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Pages
    getPage: builder.query({
      query: (slug) => `/api/v1/store/pages/${slug}`,
      providesTags: ['Page'],
    }),
    // Menus
    getMenu: builder.query({
      query: (location) => `/api/v1/store/menus/${location}`,
      providesTags: ['Menu'],
    }),
    // Banners
    getBanners: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.set('type', params.type);
        if (params?.page) searchParams.set('page', params.page);
        return `/api/v1/store/banners?${searchParams.toString()}`;
      },
      providesTags: ['Banners'],
    }),
    // Blog
    getBlogPosts: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        if (params.category) searchParams.set('category', params.category);
        if (params.tag) searchParams.set('tag', params.tag);
        if (params.featured) searchParams.set('featured', params.featured);
        return `/api/v1/store/blog?${searchParams.toString()}`;
      },
      providesTags: ['BlogPosts'],
    }),
    getBlogPost: builder.query({
      query: (slug) => `/api/v1/store/blog/${slug}`,
      providesTags: ['BlogPost'],
    }),
    getFeaturedBlogPosts: builder.query({
      query: () => '/api/v1/store/blog/featured',
      providesTags: ['BlogPosts'],
    }),
    // Settings
    getSettings: builder.query({
      query: () => '/api/v1/store/settings',
      providesTags: ['SiteSettings'],
    }),
    // Products (server-side filtered)
    getFilteredProducts: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, value);
          }
        });
        return `/api/v1/store/products?${searchParams.toString()}`;
      },
      providesTags: ['Products'],
    }),
    searchProducts: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.q) searchParams.set('search', params.q);
        if (params.productType) searchParams.set('productType', params.productType);
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        return `/api/v1/store/products/search?${searchParams.toString()}`;
      },
      providesTags: ['Products'],
    }),
    // Categories tree for filter sidebar
    getCategoryTree: builder.query({
      query: () => '/api/v1/store/categories/tree',
      providesTags: ['Categories'],
    }),
  }),
});

export const {
  useGetPageQuery,
  useGetMenuQuery,
  useGetBannersQuery,
  useGetBlogPostsQuery,
  useGetBlogPostQuery,
  useGetFeaturedBlogPostsQuery,
  useGetSettingsQuery,
  useGetFilteredProductsQuery,
  useSearchProductsQuery,
  useGetCategoryTreeQuery,
} = cmsApi;
