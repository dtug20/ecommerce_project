import React from 'react';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTranslation } from 'react-i18next';
import { useGetShowCategoryQuery } from '@/redux/features/categoryApi';
import CliconCategoryCard from './clicon-category-card';
import { SkeletonLoader } from '@/components/clicon/ui';

// ---------------------------------------------------------------------------
// Skeleton loader row
// ---------------------------------------------------------------------------
function CategorySkeletons() {
  return (
    <div className="cl-categories__skeleton-row" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="cl-category-card cl-category-card--skeleton">
          <SkeletonLoader variant="circle" width={120} height={120} />
          <SkeletonLoader variant="line" width="70%" className="mt-2" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const CliconCategoryShowcase = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetShowCategoryQuery();

  const categories = data?.result || [];

  return (
    <section className="cl-categories" data-testid="clicon-category-showcase">
      <div className="container">
        {/* Section title — centered */}
        <div className="cl-categories__header">
          <h2 className="cl-categories__title">{t('categories.title')}</h2>
        </div>

        {/* Loading */}
        {isLoading && <CategorySkeletons />}

        {/* Error */}
        {!isLoading && isError && (
          <p className="cl-categories__error" role="alert">
            <i className="fa-solid fa-circle-exclamation me-2" aria-hidden="true" />
            {t('common.error')}
          </p>
        )}

        {/* Empty */}
        {!isLoading && !isError && categories.length === 0 && (
          <p className="cl-categories__empty">{t('categories.noCategories')}</p>
        )}

        {/* Carousel */}
        {!isLoading && !isError && categories.length > 0 && (
          <div className="cl-categories__carousel-wrap">
            {/* Prev arrow */}
            <button
              type="button"
              className="cl-categories__nav cl-categories__nav--prev"
              aria-label="Previous categories"
              data-testid="clicon-cat-prev"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>

            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: '.cl-categories__nav--next',
                prevEl: '.cl-categories__nav--prev',
              }}
              slidesPerView={2}
              spaceBetween={12}
              breakpoints={{
                576: { slidesPerView: 3, spaceBetween: 16 },
                768: { slidesPerView: 4, spaceBetween: 16 },
                992: { slidesPerView: 5, spaceBetween: 20 },
                1200: { slidesPerView: 6, spaceBetween: 24 },
              }}
              className="cl-categories__swiper"
              data-testid="clicon-category-swiper"
            >
              {categories.map((cat) => (
                <SwiperSlide key={cat._id}>
                  <CliconCategoryCard category={cat} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Next arrow */}
            <button
              type="button"
              className="cl-categories__nav cl-categories__nav--next"
              aria-label="Next categories"
              data-testid="clicon-cat-next"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CliconCategoryShowcase;
