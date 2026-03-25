import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import CliconDealProductCard from '@/components/clicon/deals/clicon-deal-product-card';
import ErrorMsg from '@/components/common/error-msg';
import { ShapeLine, NextArr, PrevArr } from '@/svg';

const sliderSettings = {
  slidesPerView: 4,
  spaceBetween: 30,
  pagination: {
    el: '.tp-cms-carousel-dot',
    clickable: true,
  },
  navigation: {
    nextEl: '.tp-cms-carousel-button-next',
    prevEl: '.tp-cms-carousel-button-prev',
  },
  breakpoints: {
    1200: { slidesPerView: 4 },
    992: { slidesPerView: 3 },
    768: { slidesPerView: 2 },
    576: { slidesPerView: 2 },
    0: { slidesPerView: 1 },
  },
};

const ProductCarousel = ({ settings = {}, title, subtitle }) => {
  const productType = settings.productType || 'electronics';
  const queryType = settings.queryType || 'new';
  const limit = settings.limit || 8;

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
    const items = products.data.slice(0, limit);
    content = (
      <Swiper
        {...sliderSettings}
        modules={[Navigation, Pagination]}
        className="tp-product-arrival-active swiper-container"
      >
        {items.map((item) => (
          <SwiperSlide key={item._id}>
            <CliconDealProductCard product={item} />
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  const sectionTitle = title || 'Products';

  return (
    <section className="tp-product-arrival-area pb-55">
      <div className="container">
        <div className="row align-items-end">
          <div className="col-xl-5 col-sm-6">
            <div className="tp-section-title-wrapper mb-40">
              <h3 className="tp-section-title">
                {sectionTitle}
                <ShapeLine />
              </h3>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <div className="col-xl-7 col-sm-6">
            <div className="tp-product-arrival-more-wrapper d-flex justify-content-end">
              <div className="tp-product-arrival-arrow tp-swiper-arrow mb-40 text-end tp-product-arrival-border">
                <button type="button" className="tp-cms-carousel-button-prev">
                  <PrevArr />
                </button>{' '}
                <button type="button" className="tp-cms-carousel-button-next">
                  <NextArr />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12">
            <div className="tp-product-arrival-slider fix">
              {content}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
