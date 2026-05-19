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
import { hydrateCurrency } from "@/redux/features/currencySlice";
import { useGetSettingsQuery } from "@/redux/features/cmsApi";

const Wrapper = ({ children }) => {
  const { productItem } = useSelector((state) => state.productModal);
  const dispatch = useDispatch();

  const { data: settingsData } = useGetSettingsQuery();

  useEffect(() => {
    dispatch(get_cart_products());
    dispatch(get_wishlist_products());
    dispatch(get_compare_products());
    dispatch(initialOrderQuantity());
    dispatch(hydrateCurrency());
  }, [dispatch]);

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
