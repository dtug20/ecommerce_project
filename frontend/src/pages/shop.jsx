import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import ShopArea from "@/components/shop/shop-area";
import ErrorMsg from "@/components/common/error-msg";
import FooterClicon from "@/layout/footers/footer-clicon";
import ShopFilterOffCanvas from "@/components/common/shop-filter-offcanvas";
import ShopLoader from "@/components/loader/shop/shop-loader";
import { useGetFilteredProductsQuery } from "@/redux/features/cmsApi";

const ShopPage = ({ query }) => {
  const { t } = useTranslation();
  const router = useRouter();
  // Read filters from the LIVE router query (merged over the SSR `query` prop) so
  // that shallow-routed filter changes (price/sort/brand/tag/category) actually
  // re-key this RTK query and re-fetch. getServerSideProps only runs on the first
  // load, so reading the prop alone left the list stale on every sidebar change.
  const liveQuery = { ...query, ...router.query };
  const [selectValue, setSelectValue] = useState(liveQuery.sort || "");

  // Build API params from URL query
  const apiParams = {
    page: liveQuery.page || 1,
    limit: 20,
    ...(liveQuery.subCategory
      ? { subCategory: liveQuery.subCategory }
      : liveQuery.category && { category: liveQuery.category }),
    ...(liveQuery.brand && { brand: liveQuery.brand }),
    ...(liveQuery.color && { color: liveQuery.color }),
    ...(liveQuery.minPrice && { minPrice: liveQuery.minPrice }),
    ...(liveQuery.maxPrice && { maxPrice: liveQuery.maxPrice }),
    ...(liveQuery.productType && { productType: liveQuery.productType }),
    ...(liveQuery.tag && { tag: liveQuery.tag }),
    ...(liveQuery.search && { search: liveQuery.search }),
    ...(liveQuery.sort && liveQuery.sort !== 'Default Sorting'
      ? {
          sortBy:
            liveQuery.sort === 'Low to High' || liveQuery.sort === 'High to Low'
              ? 'price'
              : 'createdAt',
          sortOrder: liveQuery.sort === 'Low to High' ? 'asc' : 'desc',
        }
      : {}),
  };

  const { data: productsData, isError, isLoading } = useGetFilteredProductsQuery(apiParams);

  // Push filter changes to URL query params with shallow routing
  const handleFilterChange = useCallback(
    (newFilters) => {
      const currentQuery = { ...router.query, ...newFilters };
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
    const val = e.target ? e.target.value : e.value;
    setSelectValue(val);
    handleFilterChange({ sort: val, page: 1 });
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
    handleFilterChange,
    totalProducts: productsData?.total || productsData?.data?.length || 0,
  };

  // Build breadcrumb links
  const breadcrumbLinks = [
    { label: t('breadcrumb.home'), href: '/' },
    { label: t('shop.title'), href: '/shop' },
    { label: t('breadcrumb.shopGrid'), href: '/shop' },
  ];
  if (liveQuery.subCategory) {
    breadcrumbLinks.push({ label: liveQuery.subCategory });
  } else if (liveQuery.category) {
    breadcrumbLinks.push({ label: liveQuery.category });
  }

  let content = null;

  if (isLoading) {
    content = <ShopLoader loading={isLoading} />;
  } else if (isError) {
    content = (
      <div className="pb-80 text-center">
        <ErrorMsg msg="There was an error" />
      </div>
    );
  } else {
    // Always render ShopArea — even with zero results — so the sidebar filters
    // stay visible and the user can adjust/clear them. ShopArea shows its own
    // empty state inside the product column when products is empty.
    const shopProducts = productsData?.data || [];
    content = (
      <>
        <ShopArea
          all_products={shopProducts}
          products={shopProducts}
          otherProps={otherProps}
        />
        <ShopFilterOffCanvas
          all_products={shopProducts}
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
      <HeaderClicon />
      <ShopBreadcrumb links={breadcrumbLinks} />
      {content}
      <FooterClicon />
    </Wrapper>
  );
};

export default ShopPage;

export const getServerSideProps = async (context) => {
  const { query } = context;
  return { props: { query } };
};
