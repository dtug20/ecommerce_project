import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import CliconDealFeaturedCard from './clicon-deal-featured-card';
import CliconDealProductCard from './clicon-deal-product-card';
import { SectionHeader, CountdownTimer, SkeletonLoader } from '@/components/clicon/ui';

// ---------------------------------------------------------------------------
// Skeleton placeholder row
// ---------------------------------------------------------------------------
function DealsSkeletonRow() {
  return (
    <div className="row g-3">
      <div className="col-xl-4">
        <div className="cl-deal-featured cl-deal-featured--skeleton" aria-busy="true">
          <SkeletonLoader variant="rect" height={320} />
          <SkeletonLoader variant="line" width="60%" className="mt-3" />
          <SkeletonLoader variant="line" width="40%" className="mt-2" />
        </div>
      </div>
      <div className="col-xl-8">
        <div className="row g-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="col-6 col-sm-4 col-md-3">
              <div className="cl-deal-card cl-deal-card--skeleton" aria-busy="true">
                <SkeletonLoader variant="rect" height={160} />
                <SkeletonLoader variant="line" width="80%" className="mt-2" />
                <SkeletonLoader variant="line" width="50%" className="mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const CliconBestDeals = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetProductTypeQuery({
    type: 'electronics',
    query: 'featured=true&limit=9',
  });

  const products = data?.data || [];
  const [featuredProduct, ...gridProducts] = products;

  return (
    <section className="cl-deals" data-testid="clicon-best-deals">
      <div className="container">
        {/* Section header */}
        <SectionHeader
          title={t('deals.title')}
          browseLink="/shop"
          browseLinkText={t('deals.browseAll')}
          rightContent={<CountdownTimer label={t('deals.ends')} />}
          className="cl-deals__header"
        />

        {/* Content */}
        {isLoading && <DealsSkeletonRow />}

        {!isLoading && isError && (
          <div className="cl-deals__error" role="alert">
            <i className="fa-solid fa-circle-exclamation me-2" aria-hidden="true" />
            {t('common.error')}
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <p className="cl-deals__empty">{t('deals.noDeals')}</p>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="row g-3 align-items-start">
            {/* Featured product — left column */}
            <div className="col-xl-4">
              {featuredProduct && (
                <CliconDealFeaturedCard product={featuredProduct} />
              )}
            </div>

            {/* 4×2 grid — right column */}
            <div className="col-xl-8">
              <div className="row g-3">
                {gridProducts.slice(0, 8).map((product) => (
                  <div key={product._id} className="col-6 col-sm-4 col-md-3">
                    <CliconDealProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CliconBestDeals;
