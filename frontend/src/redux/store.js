import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import { initSocket, registerCmsInvalidations, registerOrderInvalidations } from "../utils/socketClient";
import authSlice from "./features/auth/authSlice";
import cartSlice from "./features/cartSlice";
import compareSlice from "./features/compareSlice";
import productModalSlice from "./features/productModalSlice";
import shopFilterSlice from "./features/shop-filter-slice";
import wishlistSlice from "./features/wishlist-slice";
import couponSlice from "./features/coupon/couponSlice";
import orderSlice from "./features/order/orderSlice";
import currencySlice from "./features/currencySlice";

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth:authSlice,
    productModal:productModalSlice,
    shopFilter:shopFilterSlice,
    cart:cartSlice,
    wishlist:wishlistSlice,
    compare:compareSlice,
    coupon:couponSlice,
    order:orderSlice,
    currency:currencySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Initialize real-time socket connections and wire up cache invalidation (client-side only)
if (typeof window !== "undefined") {
  initSocket();
  registerCmsInvalidations(store, apiSlice);
  registerOrderInvalidations(store, apiSlice);
}

export default store;
