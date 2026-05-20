import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
// internal
import BackToTopCom from "@/components/common/back-to-top";
import ProductModal from "@/components/common/product-modal";

const ChatWidget = dynamic(() => import("@/components/chatbot/ChatWidget"), {
  ssr: false,
});
import {
  get_cart_products,
  initialOrderQuantity,
} from "@/redux/features/cartSlice";
import { get_wishlist_products } from "@/redux/features/wishlist-slice";
import { get_compare_products } from "@/redux/features/compareSlice";
import { hydrateCurrencyFromCookie, setCurrency } from "@/redux/features/currencySlice";
import { useGetSettingsQuery } from "@/redux/features/cmsApi";
import { useGetUserPreferencesQuery } from "@/redux/features/userPreferencesApi";

const Wrapper = ({ children }) => {
  const { productItem } = useSelector((state) => state.productModal);
  const dispatch = useDispatch();

  const { data: settingsData } = useGetSettingsQuery();

  // Determine if a user is authenticated. authSlice stores `authenticated`
  // boolean (no accessToken field at top level). useMemo keeps the value stable
  // across re-renders so RTK Query's `skip` doesn't flicker.
  const isAuthenticated = useSelector((s) => s.auth?.authenticated ?? false);
  const { data: prefs } = useGetUserPreferencesQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    dispatch(get_cart_products());
    dispatch(get_wishlist_products());
    dispatch(get_compare_products());
    dispatch(initialOrderQuantity());
    dispatch(hydrateCurrencyFromCookie());
  }, [dispatch]);

  // DB preference wins over cookie default. Runs after the hydrate effect
  // because prefs is undefined on mount and only becomes truthy after the
  // API responds — ensuring the ordering: SSR default → cookie → DB.
  useEffect(() => {
    if (prefs?.currency) dispatch(setCurrency(prefs.currency));
  }, [prefs?.currency, dispatch]);

  const chatbotEnabled = settingsData?.data?.chatbot?.enabled !== false;

  return (
    <div id="wrapper">
      {children}
      <BackToTopCom />
      <ToastContainer />
      {productItem && <ProductModal />}
      {chatbotEnabled && <ChatWidget />}
    </div>
  );
};

export default Wrapper;
