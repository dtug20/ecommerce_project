import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import { useGetShowCategoryQuery } from '@/redux/features/categoryApi';
import CliconDealProductCard from '@/components/clicon/deals/clicon-deal-product-card';
import ErrorMsg from '@/components/common/error-msg';

const MAX_TABS = 4;

const CliconProductSectionWithPromo = ({
  title,
  productType = 'electronics',
  queryType = 'new',
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');

  const {
    data: products,
    isLoading,
    isError,
  } = useGetProductTypeQuery({
    type: productType,
    query: `${queryType}=true&limit=8`,
  });

  const { data: categoryData } = useGetShowCategoryQuery();
  const categories = categoryData?.result?.slice(0, MAX_TABS) || [];

  const allProducts = products?.data || [];
  const promoProduct = allProducts[0];
  const gridProducts = allProducts.slice(0, 8);

  const filteredProducts =
    activeTab === 'all'
      ? gridProducts
      : gridProducts.filter((p) => {
          const catName =
            typeof p.category === 'object' ? p.category?.name : p.category;
          const activeCategory = categories.find((c) => c._id === activeTab);
          return catName === activeCategory?.parent;
        });

  let gridContent = null;
  if (isLoading) {
    gridContent = (
      <div className="row g-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="col-xl-3 col-md-4 col-sm-6 col-6">
            <div className="cl-product-section__skeleton" />
          </div>
        ))}
      </div>
    );
  } else if (isError) {
    gridContent = <ErrorMsg msg={t('error.products', 'Could not load products.')} />;
  } else if (filteredProducts.length === 0) {
    gridContent = (
      <p className="cl-product-section__empty">
        {t('products.empty', 'No products found.')}
      </p>
    );
  } else {
    gridContent = (
      <div className="row g-3">
        {filteredProducts.map((product) => (
          <div key={product._id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6 col-6">
            <CliconDealProductCard product={product} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="cl-product-section" data-testid="cl-product-section-with-promo">
      <div className="container">
        {/* Section header */}
        <div className="cl-product-section__header">
          <h2 className="cl-product-section__title">
            {title || t('product_section.default_title', 'Computer Accessories')}
          </h2>
          <div className="cl-product-section__tabs" role="tablist">
            <button
              className={`cl-product-section__tab${activeTab === 'all' ? ' cl-product-section__tab--active' : ''}`}
              onClick={() => setActiveTab('all')}
              role="tab"
              aria-selected={activeTab === 'all'}
            >
              {t('tabs.all', 'All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                className={`cl-product-section__tab${activeTab === cat._id ? ' cl-product-section__tab--active' : ''}`}
                onClick={() => setActiveTab(cat._id)}
                role="tab"
                aria-selected={activeTab === cat._id}
              >
                {cat.parent}
              </button>
            ))}
          </div>
          <Link href="/shop" className="cl-product-section__browse">
            {t('featured.browse_all', 'Browse All Product')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="row g-4">
          {/* Left: product grid */}
          <div className="col-xl-9">
            {gridContent}
          </div>

          {/* Right: promo column */}
          <div className="col-xl-3 d-none d-xl-flex">
            <div className="cl-product-section__promo">
              {promoProduct && (
                <>
                  <div className="cl-product-section__promo-card">
                    <p className="cl-product-section__promo-label">
                      {t('promo.featured', 'Featured Product')}
                    </p>
                    <h4 className="cl-product-section__promo-name">
                      {promoProduct.title}
                    </h4>
                    <p className="cl-product-section__promo-price">
                      ${promoProduct.price?.toFixed(2)}
                    </p>
                    <Link
                      href={`/product-details/${promoProduct._id}`}
                      className="cl-product-section__promo-btn"
                    >
                      {t('featured.shop_now', 'SHOP NOW')}
                    </Link>
                  </div>
                </>
              )}
              <div className="cl-product-section__discount-banner">
                <p className="cl-product-section__discount-tag">
                  {t('promo.discount_tag', 'UP TO 20% OFF')}
                </p>
                <p className="cl-product-section__discount-label">
                  {t('promo.discount_note', 'On all accessories this week')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CliconProductSectionWithPromo;
