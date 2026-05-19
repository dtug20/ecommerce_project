import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeCategoryQuery } from '@/redux/features/categoryApi';
import ErrorMsg from '@/components/common/error-msg';
import SafeImage from '@/components/common/safe-image';
import { ShapeLine } from '@/svg';

const CategoryShowcase = ({ settings = {}, title, subtitle }) => {
  const { t } = useTranslation();
  const productType = settings.productType || 'electronics';
  const limit = settings.limit || 10;
  const router = useRouter();

  const {
    data: categories,
    isLoading,
    isError,
  } = useGetProductTypeCategoryQuery(productType);

  const handleCategoryRoute = (categoryTitle) => {
    router.push(
      `/shop?category=${categoryTitle.toLowerCase().replace('&', '').split(' ').join('-')}`
    );
  };

  let content = null;

  if (isLoading) {
    content = <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>;
  } else if (isError) {
    content = <ErrorMsg msg={t('error.loadingCategoriesError')} />;
  } else if (!categories?.result?.length) {
    content = <ErrorMsg msg={t('error.noCategoriesFound')} />;
  } else {
    const items = categories.result.slice(0, limit);
    content = items.map((item) => (
      <div className="col" key={item._id}>
        <div className="tp-product-category-item text-center mb-40">
          <div className="tp-product-category-thumb fix">
            <a
              className="cursor-pointer"
              onClick={() => handleCategoryRoute(item.parent)}
            >
              <SafeImage
                src={item.img}
                alt={item.parent}
                width={76}
                height={98}
                unoptimized
              />
            </a>
          </div>
          <div className="tp-product-category-content">
            <h3 className="tp-product-category-title">
              <a
                className="cursor-pointer"
                onClick={() => handleCategoryRoute(item.parent)}
              >
                {item.parent}
              </a>
            </h3>
            <p>{t('categories.productCount', { count: item.products?.length || 0 })}</p>
          </div>
        </div>
      </div>
    ));
  }

  const sectionTitle = title || t('categories.browseTitle');

  return (
    <section className="tp-product-category pt-60 pb-15">
      <div className="container">
        {sectionTitle && (
          <div className="row mb-30">
            <div className="col-12">
              <div className="tp-section-title-wrapper text-center">
                <h3 className="tp-section-title">
                  {sectionTitle}
                  <ShapeLine />
                </h3>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>
          </div>
        )}
        <div className="row row-cols-xl-5 row-cols-lg-5 row-cols-md-4">
          {content}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
