import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
// internal
import BackToTopCom from "@/components/common/back-to-top";
import ProductModal from "@/components/common/product-modal";
import {
  get_cart_products,
  initialOrderQuantity,
} from "@/redux/features/cartSlice";
import { get_wishlist_products } from "@/redux/features/wishlist-slice";
import { get_compare_products } from "@/redux/features/compareSlice";
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
  }, [dispatch]);

  // Apply theme CSS variables from CMS settings
  useEffect(() => {
    if (settingsData?.data?.theme) {
      const theme = settingsData.data.theme;
      const root = document.documentElement;
      // Map to the CSS variable names defined in _colors.scss / _root.scss
      if (theme.primaryColor)
        root.style.setProperty('--tp-theme-primary', theme.primaryColor);
      if (theme.secondaryColor)
        root.style.setProperty('--tp-theme-secondary', theme.secondaryColor);
      if (theme.accentColor)
        root.style.setProperty('--tp-blue-1', theme.accentColor);
      if (theme.fontFamily)
        root.style.setProperty('--tp-ff-body', `${theme.fontFamily}, sans-serif`);
    }
  }, [settingsData]);

  return (
    <div id="wrapper">
      {children}
      <BackToTopCom />
      <ToastContainer />
      {productItem && <ProductModal />}
    </div>
  );
};

export default Wrapper;
