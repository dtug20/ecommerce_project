import React from 'react';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import { useGetFilteredProductsQuery } from '@/redux/features/cmsApi';
import CliconDealProductCard from '@/components/clicon/deals/clicon-deal-product-card';
import ErrorMsg from '@/components/common/error-msg';
import { ShapeLine } from '@/svg';

const FeaturedProducts = ({ settings = {}, title, subtitle }) => {
  const productType = settings.productType || 'electronics';
  const queryType = settings.queryType || 'new';
  const limit = settings.limit || 8;

  // Prefer legacy productApi endpoint which is already wired up with the
  // existing backend. Fall back to cmsApi if a different productType is given.
  const legacyQuery = `${queryType}=true&limit=${limit}`;
  const {
    data: products,
    isError,
    isLoading,
  } = useGetProductTypeQuery({ type: productType, query: legacyQuery });

  let content = null;

  if (isLoading) {
    content = <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>;
  } else if (isError) {
    content = <ErrorMsg msg="There was an error loading products" />;
  } else if (!products?.data?.length) {
    content = <ErrorMsg msg="No products found" />;
  } else {
    content = products.data.slice(0, limit).map((prd, i) => (
      <div key={prd._id || i} className="col-xl-3 col-lg-3 col-sm-6">
        <CliconDealProductCard product={prd} />
      </div>
    ));
  }

  const sectionTitle = title || 'Featured Products';

  return (
    <section className="tp-product-area pb-55">
      <div className="container">
        <div className="row align-items-end">
          <div className="col-xl-5 col-lg-6 col-md-5">
            <div className="tp-section-title-wrapper mb-40">
              <h3 className="tp-section-title">
                {sectionTitle}
                <ShapeLine />
              </h3>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
        </div>
        <div className="row">{content}</div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
