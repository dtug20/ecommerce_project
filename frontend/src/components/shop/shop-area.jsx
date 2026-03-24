import React, { useState, useEffect } from "react";
import Pagination from "@/ui/Pagination";
import CliconDealProductCard from "@/components/clicon/deals/clicon-deal-product-card";
import CategoryFilter from "./shop-filter/category-filter";
import PriceFilter from "./shop-filter/price-filter";
import ProductBrand from "./shop-filter/product-brand";
import TagFilter from "./shop-filter/tag-filter";
import SidebarPromoBanner from "./shop-filter/sidebar-promo-banner";
import ShopTopLeft from "./shop-top-left";
import ShopTopRight from "./shop-top-right";
import ShopActiveFilters from "./shop-active-filters";

const ShopArea = ({ all_products, products, otherProps }) => {
  const { priceFilterValues, selectHandleFilter, currPage, setCurrPage, handleFilterChange, totalProducts } = otherProps;
  const [filteredRows, setFilteredRows] = useState(products);
  const [pageStart, setPageStart] = useState(0);
  const [countOfPage, setCountOfPage] = useState(12);

  useEffect(() => {
    setFilteredRows(products);
  }, [products]);

  const paginatedData = (items, startPage, pageCount) => {
    setFilteredRows(items);
    setPageStart(startPage);
    setCountOfPage(pageCount);
  };

  const computedMax = all_products.reduce((max, product) => {
    return product.price > max ? product.price : max;
  }, 0);
  const maxPrice = Math.max(computedMax, priceFilterValues.priceValue[1], 1);

  return (
    <section className="cl-shop">
      <div className="container">
        <div className="row">
          {/* Sidebar */}
          <div className="col-xl-3 col-lg-4 cl-shop__sidebar-desktop">
            <div className="cl-shop__sidebar">
              <CategoryFilter setCurrPage={setCurrPage} />
              <PriceFilter
                priceFilterValues={priceFilterValues}
                maxPrice={maxPrice}
              />
              <ProductBrand setCurrPage={setCurrPage} />
              <TagFilter setCurrPage={setCurrPage} />
              <SidebarPromoBanner />
            </div>
          </div>

          {/* Main content */}
          <div className="col-xl-9 col-lg-8">
            {/* Topbar */}
            <div className="cl-shop__topbar">
              <ShopTopLeft handleFilterChange={handleFilterChange} />
              <ShopTopRight selectHandleFilter={selectHandleFilter} />
            </div>

            {/* Active filters */}
            <ShopActiveFilters totalProducts={totalProducts || all_products.length} />

            {/* Product grid */}
            {products.length === 0 && (
              <div className="text-center py-5">
                <h2 style={{ color: 'var(--cl-text-secondary)' }}>No products found</h2>
              </div>
            )}
            {products.length > 0 && (
              <div className="cl-shop__grid">
                {filteredRows
                  .slice(pageStart, pageStart + countOfPage)
                  .map((item) => (
                    <CliconDealProductCard key={item._id} product={item} />
                  ))}
              </div>
            )}

            {/* Pagination */}
            {products.length > 0 && (
              <Pagination
                items={products}
                countOfPage={12}
                paginatedData={paginatedData}
                currPage={currPage}
                setCurrPage={setCurrPage}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopArea;
