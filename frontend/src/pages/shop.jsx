import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import ShopArea from "@/components/shop/shop-area";
import ErrorMsg from "@/components/common/error-msg";
import Footer from "@/layout/footers/footer";
import ShopFilterOffCanvas from "@/components/common/shop-filter-offcanvas";
import ShopLoader from "@/components/loader/shop/shop-loader";
import { useGetFilteredProductsQuery } from "@/redux/features/cmsApi";

const ShopPage = ({ query }) => {
  const router = useRouter();
  const [selectValue, setSelectValue] = useState(query.sort || "");

  // Build API params from URL query
  const apiParams = {
    page: query.page || 1,
    limit: 20,
    ...(query.category && { category: query.category }),
    ...(query.subCategory && { category: query.subCategory }),
    ...(query.brand && { brand: query.brand }),
    ...(query.color && { color: query.color }),
    ...(query.minPrice && { minPrice: query.minPrice }),
    ...(query.maxPrice && { maxPrice: query.maxPrice }),
    ...(query.productType && { productType: query.productType }),
    ...(query.sort && query.sort !== 'Default Sorting'
      ? {
          sortBy:
            query.sort === 'Low to High' || query.sort === 'High to Low'
              ? 'price'
              : 'createdAt',
          sortOrder: query.sort === 'Low to High' ? 'asc' : 'desc',
        }
      : {}),
  };

  const { data: productsData, isError, isLoading } = useGetFilteredProductsQuery(apiParams);

  // Push filter changes to URL query params with shallow routing so the
  // page does not fully reload but getServerSideProps runs on next navigation
  const handleFilterChange = useCallback(
    (newFilters) => {
      const currentQuery = { ...router.query, ...newFilters };
      // Remove falsy/empty values to keep the URL clean
      Object.keys(currentQuery).forEach((key) => {
        if (!currentQuery[key]) delete currentQuery[key];
      });
      router.push({ pathname: '/shop', query: currentQuery }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const selectHandleFilter = (e) => {
    setSelectValue(e.value);
    handleFilterChange({ sort: e.value, page: 1 });
  };

  const otherProps = {
    priceFilterValues: {
      priceValue: [
        parseInt(query.minPrice) || 0,
        parseInt(query.maxPrice) || 10000,
      ],
      handleChanges: (val) =>
        handleFilterChange({ minPrice: val[0], maxPrice: val[1], page: 1 }),
    },
    selectHandleFilter,
    currPage: parseInt(query.page) || 1,
    setCurrPage: (page) => handleFilterChange({ page }),
  };

  let content = null;

  if (isLoading) {
    content = <ShopLoader loading={isLoading} />;
  } else if (isError) {
    content = (
      <div className="pb-80 text-center">
        <ErrorMsg msg="There was an error" />
      </div>
    );
  } else if (!productsData?.data?.length) {
    content = <ErrorMsg msg="No Products found!" />;
  } else {
    content = (
      <>
        <ShopArea
          all_products={productsData.data}
          products={productsData.data}
          otherProps={otherProps}
        />
        <ShopFilterOffCanvas
          all_products={productsData.data}
          otherProps={otherProps}
        />
      </>
    );
  }

  return (
    <Wrapper>
      <SEO
        pageTitle="Shop"
        description="Browse our full product catalog — electronics, fashion, beauty and more"
        url="/shop"
      />
      <HeaderTwo style_2={true} />
      <ShopBreadcrumb title="Shop Grid" subtitle="Shop Grid" />
      {content}
      <Footer primary_style={true} />
    </Wrapper>
  );
};

export default ShopPage;

export const getServerSideProps = async (context) => {
  const { query } = context;
  return { props: { query } };
};
