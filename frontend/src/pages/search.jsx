import ErrorMsg from "@/components/common/error-msg";
import SearchPrdLoader from "@/components/loader/search-prd-loader";
import ProductItem from "@/components/clicon/deals/clicon-deal-product-card";
import SEO from "@/components/seo";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import Wrapper from "@/layout/wrapper";
import { useGetAllProductsQuery } from "@/redux/features/productApi";
import { ClButton } from "@/components/clicon/ui";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function SearchPage({ query }) {
  const { t } = useTranslation();
  const { searchText, productType } = query;
  const { data: products, isError, isLoading } = useGetAllProductsQuery();
  const [shortValue, setShortValue] = useState("");
  const perView = 8;
  const [next, setNext] = useState(perView);

  const shortHandler = (e) => {
    setShortValue(e.target.value);
  };

  useEffect(() => {
    setNext(perView);
  }, [searchText, productType]);

  const handleLoadMore = () => {
    setNext((value) => value + 4);
  };

  // decide what to render
  let content = null;
  if (isLoading) {
    content = <SearchPrdLoader loading={isLoading} />;
  }

  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }

  if (!isLoading && !isError && products?.data?.length === 0) {
    content = <ErrorMsg msg="No products found!" />;
  }

  if (!isLoading && !isError && products?.data?.length > 0) {
    let all_products = products.data;
    let product_items = all_products;

    if (searchText && !productType) {
      product_items = all_products.filter((prd) =>
        prd.title?.toLowerCase().includes(searchText?.toLowerCase())
      );
    }
    if (searchText && productType) {
      product_items = all_products.filter(
        (prd) => prd.productType?.toLowerCase() === productType?.toLowerCase()
      ).filter(p => p?.title?.toLowerCase().includes(searchText?.toLowerCase()));
    }
    if (shortValue === "low") {
      product_items = product_items
        .slice()
        .sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (shortValue === "high") {
      product_items = product_items
        .slice()
        .sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (product_items.length === 0) {
      content = (
        <div className="cl-search__no-match">
          <h3>{t('search.noMatch', 'No results for')} <span className="cl-search__query">{searchText}</span></h3>
        </div>
      );
    } else {
      content = (
        <section className="cl-search" data-testid="cl-search-results">
          <div className="container">
            {/* Top bar: results count + sort */}
            <div className="cl-search__topbar">
              <div className="cl-search__results-count">
                <p>{t('search.showingResults', '{{count}} of {{total}} results', { count: Math.min(next, product_items.length), total: product_items.length })}</p>
              </div>
              <div className="cl-search__sort">
                <label htmlFor="cl-search-sort">{t('shop.sortBy', 'Sort by')}:</label>
                <select
                  id="cl-search-sort"
                  className="cl-search__sort-select"
                  value={shortValue}
                  onChange={shortHandler}
                >
                  <option value="">{t('shop.mostPopular', 'Most Popular')}</option>
                  <option value="low">{t('search.priceLowHigh', 'Price low to high')}</option>
                  <option value="high">{t('search.priceHighLow', 'Price high to low')}</option>
                </select>
              </div>
            </div>

            {/* Product grid */}
            <div className="row g-3">
              {product_items.slice(0, next).map((item) => (
                <div key={item._id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6 col-6">
                  <ProductItem product={item} />
                </div>
              ))}
            </div>

            {/* Load more */}
            {next < product_items.length && (
              <div className="cl-search__load-more">
                <ClButton variant="outlined" size="md" onClick={handleLoadMore}>
                  {t('search.loadMore', 'Load More')}
                </ClButton>
              </div>
            )}
          </div>
        </section>
      );
    }
  }

  return (
    <Wrapper>
      <SEO pageTitle={t('search.title', 'Search')} />
      <HeaderClicon />
      <ShopBreadcrumb
        links={[
          { label: t('breadcrumb.home', 'Home'), href: '/' },
          { label: t('search.title', 'Search') },
        ]}
      />
      {content}
      <FooterClicon />
    </Wrapper>
  );
}

export const getServerSideProps = async (context) => {
  const { query } = context;
  return { props: { query } };
};
