import React from "react";
import { useDispatch, useSelector } from "react-redux";
import CategoryFilter from "../shop/shop-filter/category-filter";
import PriceFilter from "../shop/shop-filter/price-filter";
import ProductBrand from "../shop/shop-filter/product-brand";
import TagFilter from "../shop/shop-filter/tag-filter";
import { handleFilterSidebarClose, handleFilterSidebarOpen } from "@/redux/features/shop-filter-slice";

const ShopFilterOffCanvas = ({
  all_products,
  otherProps,
}) => {
  const { priceFilterValues, setCurrPage } = otherProps;
  const { filterSidebar } = useSelector((state) => state.shopFilter);
  const dispatch = useDispatch();

  const computedMax = all_products.reduce((max, product) => {
    return product.price > max ? product.price : max;
  }, 0);
  const maxPrice = Math.max(computedMax, priceFilterValues.priceValue[1], 1);

  return (
    <>
      <div
        className={`tp-filter-offcanvas-area ${
          filterSidebar ? "offcanvas-opened" : ""
        }`}
      >
        <div className="tp-filter-offcanvas-wrapper">
          <div className="tp-filter-offcanvas-close">
            <button
              type="button"
              onClick={() => dispatch(handleFilterSidebarOpen())}
              className="tp-filter-offcanvas-close-btn filter-close-btn"
            >
              <i className="fa-solid fa-xmark"></i>
              {" "}Close
            </button>
          </div>
          <div className="cl-shop__sidebar">
            <CategoryFilter setCurrPage={setCurrPage} />
            <PriceFilter
              priceFilterValues={priceFilterValues}
              maxPrice={maxPrice}
            />
            <ProductBrand setCurrPage={setCurrPage} />
            <TagFilter setCurrPage={setCurrPage} />
          </div>
        </div>
      </div>

      <div
        onClick={() => dispatch(handleFilterSidebarClose())}
        className={`body-overlay ${filterSidebar ? "opened" : ""}`}
      ></div>
    </>
  );
};

export default ShopFilterOffCanvas;
