import CommonBreadcrumb from "@/components/breadcrumb/common-breadcrumb";
import ErrorMsg from "@/components/common/error-msg";
import SearchPrdLoader from "@/components/loader/search-prd-loader";
import ProductItem from "@/components/products/fashion/product-item";
import SEO from "@/components/seo";
import ShopTopLeft from "@/components/shop/shop-top-left";
import Footer from "@/layout/footers/footer";
import HeaderTwo from "@/layout/headers/header-2";
import Wrapper from "@/layout/wrapper";
import { useGetAllProductsQuery } from "@/redux/features/productApi";
import NiceSelect from "@/ui/nice-select";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
// internal

export default function SearchPage({ query }) {
  const { t } = useTranslation();
  const { searchText, productType } = query;
  const { data: products, isError, isLoading } = useGetAllProductsQuery();
  const [shortValue, setShortValue] = useState("");
  const perView = 8;
  const [next, setNext] = useState(perView);

  // selectShortHandler
  const shortHandler = (e) => {
    setShortValue(e.value);
  };

  useEffect(() => {
    setNext(perView);
  }, [searchText, productType]);

  //   handleLoadMore
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
     // Price low to high
     if (shortValue === "Price low to high") {
      product_items = product_items
        .slice()
        .sort((a, b) => Number(a.price) - Number(b.price));
    }
    // Price high to low
    if (shortValue === "Price high to low") {
      product_items = product_items
        .slice()
        .sort((a, b) => Number(b.price) - Number(a.price));
    }
    if (product_items.length === 0) {
      content = (
        <div className="text-center pt-80 pb-80">
          <h3>{t('search.noMatch')} <span style={{color:'#0989FF'}}>{searchText}</span></h3>
        </div>
      );
    }

    else {
      content = ( 
        <>
          <section className="tp-shop-area pb-120">
            <div className="container">
              <div className="row">
                <div className="col-xl-12 col-lg-12">
                  <div className="tp-shop-main-wrapper">
                    <div className="tp-shop-top mb-45">
                      <div className="row">
                        <div className="col-xl-6">

                          <div className="tp-shop-top-left d-flex align-items-center ">
                            <div className="tp-shop-top-result">
                              <p>{t('search.showingResults', { count: product_items.length, total: all_products.length })}</p>
                            </div>
                          </div>

                        </div>
                        <div className="col-xl-6">
                          <div className="tp-shop-top-right d-sm-flex align-items-center justify-content-xl-end">
                            <div className="tp-shop-top-select">
                              <NiceSelect
                                options={[
                                  { value: "Sort By Price", text: t('search.sortByPrice') },
                                  { value: "Price low to high", text: t('search.priceLowHigh') },
                                  { value: "Price high to low", text: t('search.priceHighLow') },
                                ]}
                                defaultCurrent={0}
                                onChange={shortHandler}
                                name="Short By Price"
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                    
                      <div className="tp-shop-items-wrapper tp-shop-item-primary">
                        <div className="row">
                          {product_items
                            .slice(0, next)
                            ?.map((item) => (
                              <div
                                key={item._id}
                                className="col-xl-3 col-lg-4 col-md-6 col-sm-6"
                              >
                                <ProductItem product={item} />
                              </div>
                            ))}
                        </div>
                      </div>

                    {/* load more btn start */}
                    {next < product_items?.length && (
                      <div className="load-more-btn text-center pt-50">
                        <button onClick={handleLoadMore} className="tp-btn tp-btn-2 tp-btn-blue">
                          {t('search.loadMore')}
                        </button>
                      </div>
                    )}
                    {/* load more btn end */}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      );
    }
  }

  return (
    <Wrapper>
      <SEO pageTitle={t('search.title')} />
      <HeaderTwo style_2={true} />
      <CommonBreadcrumb title={t('search.title')} subtitle={t('search.title')} />
      {content}
      <Footer primary_style={true} />
    </Wrapper>
  );
}

export const getServerSideProps = async (context) => {
  const { query } = context;

  return {
    props: {
      query,
    },
  };
};
