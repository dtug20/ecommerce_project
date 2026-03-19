import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import keycloak from "@/lib/keycloak";

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001';

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      try {
        if (keycloak.authenticated) {
          await keycloak.updateToken(30);
          headers.set("Authorization", `Bearer ${keycloak.token}`);
        }
      } catch (error) {
        console.error("Error preparing auth header:", error);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({}),
  tagTypes: ["Products","Coupon","Product","RelatedProducts","UserOrder","UserOrders","ProductType","OfferProducts","PopularProducts","TopRatedProducts","Page","Menu","Banners","BlogPosts","BlogPost","SiteSettings","Categories","Wishlist","Addresses","Reviews"]
});
