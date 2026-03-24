import React from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import ErrorMsg from "@/components/common/error-msg";
import { useGetActiveBrandsQuery } from "@/redux/features/brandApi";
import { handleFilterSidebarClose } from "@/redux/features/shop-filter-slice";

const ProductBrand = ({ setCurrPage }) => {
  const { data: brands, isError, isLoading } = useGetActiveBrandsQuery();
  const router = useRouter();
  const dispatch = useDispatch();

  const handleBrandRoute = (brand) => {
    setCurrPage(1);
    const slug = brand.toLowerCase().replace("&", "").split(" ").join("-");
    router.push(`/shop?brand=${slug}`);
    dispatch(handleFilterSidebarClose());
  };

  let content = null;

  if (isLoading) {
    content = (
      <div className="cl-shop__brand-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="cl-skeleton cl-skeleton--line" style={{ height: 18 }} />
        ))}
      </div>
    );
  } else if (isError) {
    content = <ErrorMsg msg="There was an error" />;
  } else if (!brands?.result?.length) {
    content = <ErrorMsg msg="No Brands found!" />;
  } else {
    const activeBrand = router.query.brand || '';
    const sortedBrands = brands.result
      .slice()
      .sort((a, b) => b.products.length - a.products.length);

    content = (
      <div className="cl-shop__brand-grid">
        {sortedBrands.map((b) => {
          const slug = b.name.toLowerCase().replace("&", "").split(" ").join("-");
          const isActive = activeBrand === slug;
          return (
            <label key={b._id} className="cl-shop__brand-item">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => handleBrandRoute(b.name)}
              />
              {b.name}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="cl-shop__widget">
      <h3 className="cl-shop__widget-title">Popular Brands</h3>
      {content}
    </div>
  );
};

export default ProductBrand;
