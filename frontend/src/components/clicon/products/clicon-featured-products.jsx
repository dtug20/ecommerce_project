import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import { useGetShowCategoryQuery } from '@/redux/features/categoryApi';
import CliconDealProductCard from '@/components/clicon/deals/clicon-deal-product-card';
import { SkeletonLoader } from '@/components/clicon/ui';
import ErrorMsg from '@/components/common/error-msg';

const MAX_TABS = 5;

const CliconFeaturedProducts = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');

  const {
    data: products,
    isLoading: prdLoading,
    isError: prdError,
  } = useGetProductTypeQuery({ type: 'electronics', query: 'new=true&limit=8' });

  const { data: categoryData } = useGetShowCategoryQuery();

  const categories = categoryData?.result?.slice(0, MAX_TABS) || [];

  const allProducts = products?.data || [];

  const filteredProducts =
    activeTab === 'all'
      ? allProducts
      : allProducts.filter((p) => {
          const catName =
            typeof p.category === 'object' ? p.category?.name : p.category;
          const activeCategory = categories.find((c) => c._id === activeTab);
          return (
            catName === activeCategory?.parent ||
            (Array.isArray(p.category?.children) &&
              p.category.children.includes(activeTab))
          );
        });

  let gridContent = null;
  if (prdLoading) {
    gridContent = (
      <div className="cl-featured__loading">
        {[...Array(8)].map((_, i) => (
          <SkeletonLoader key={i} variant="rect" height={200} className="cl-featured__skeleton" />
        ))}
      </div>
    );
  } else if (prdError) {
    gridContent = <ErrorMsg msg={t('error.products', 'Could not load products.')} />;
  } else if (filteredProducts.length === 0) {
    gridContent = (
      <p className="cl-featured__empty">
        {t('products.empty', 'No products found.')}
      </p>
    );
  } else {
    gridContent = (
      <div className="row g-3">
        {filteredProducts.slice(0, 8).map((product) => (
          <div key={product._id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6 col-6">
            <CliconDealProductCard product={product} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="cl-featured" data-testid="cl-featured-products">
      <div className="container">
        <div className="row g-4">
          {/* Left promo column */}
          <div className="col-xl-3 d-none d-xl-flex">
            <div className="cl-featured__promo">
              <div className="cl-featured__promo-tag">
                {t('featured.badge', 'SPECIAL OFFER')}
              </div>
              <p className="cl-featured__promo-discount">
                {t('featured.discount', '32% Discount')}
              </p>
              <h3 className="cl-featured__promo-title">
                {t('featured.promo_title', 'For All Electronics Products')}
              </h3>
              <p className="cl-featured__promo-note">
                {t('featured.offer_note', 'Offer ends in: ENDS OF CHRISTMAS')}
              </p>
              <Link
                href="/shop"
                className="cl-featured__promo-btn"
                data-testid="cl-featured-shop-now"
              >
                {t('featured.shop_now', 'SHOP NOW')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="cl-featured__promo-images">
                {allProducts.slice(0, 2).map((p) => (
                  <div key={p._id} className="cl-featured__promo-img-item">
                    {p.img && <img src={p.img} alt={p.title} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right products column */}
          <div className="col-xl-9">
            {/* Tab header */}
            <div className="cl-featured__header">
              <div className="cl-featured__tabs" role="tablist">
                <button
                  className={`cl-featured__tab${activeTab === 'all' ? ' cl-featured__tab--active' : ''}`}
                  onClick={() => setActiveTab('all')}
                  data-testid="cl-featured-tab-all"
                  role="tab"
                  aria-selected={activeTab === 'all'}
                >
                  {t('tabs.all', 'All Product')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    className={`cl-featured__tab${activeTab === cat._id ? ' cl-featured__tab--active' : ''}`}
                    onClick={() => setActiveTab(cat._id)}
                    role="tab"
                    aria-selected={activeTab === cat._id}
                  >
                    {cat.parent}
                  </button>
                ))}
              </div>
              <Link href="/shop" className="cl-featured__browse" data-testid="cl-featured-browse">
                {t('featured.browse_all', 'Browse All Product')}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Product grid */}
            <div className="cl-featured__grid">
              {gridContent}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CliconFeaturedProducts;
