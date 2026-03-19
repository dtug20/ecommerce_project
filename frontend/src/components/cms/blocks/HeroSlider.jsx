import React, { useState } from 'react';
import Link from 'next/link';
import { Navigation, Pagination, EffectFade } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

const HeroSlider = ({ settings = {}, title, subtitle }) => {
  const slides = settings.slides || [];
  const [activeIndex, setActiveIndex] = useState(0);

  if (slides.length === 0) {
    return null;
  }

  // Single slide — render as a simple hero banner without Swiper overhead
  if (slides.length === 1) {
    const slide = slides[0];
    return (
      <section
        className="tp-slider-area p-relative z-index-1"
        style={{
          backgroundImage: slide.image ? `url(${slide.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-6 col-lg-7">
              <div className="tp-slider-content p-relative z-index-1">
                {slide.title && (
                  <h3 className="tp-slider-title">{slide.title}</h3>
                )}
                {slide.subtitle && (
                  <p>{slide.subtitle}</p>
                )}
                {slide.buttonText && slide.buttonUrl && (
                  <div className="tp-slider-btn mt-25">
                    <Link href={slide.buttonUrl} className="tp-btn tp-btn-2 tp-btn-white">
                      {slide.buttonText}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tp-slider-area p-relative z-index-1">
      <Swiper
        slidesPerView={1}
        spaceBetween={0}
        loop={slides.length > 1}
        effect="fade"
        navigation={{
          nextEl: '.tp-cms-slider-button-next',
          prevEl: '.tp-cms-slider-button-prev',
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        pagination={{ el: '.tp-cms-slider-dot', clickable: true }}
        modules={[Navigation, Pagination, EffectFade]}
        className="tp-slider-active tp-slider-variation swiper-container"
      >
        {slides.map((slide, i) => (
          <SwiperSlide
            key={i}
            className="tp-slider-item tp-slider-height d-flex align-items-center"
            style={{
              backgroundImage: slide.image ? `url(${slide.image})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '500px',
            }}
          >
            <div className="container">
              <div className="row align-items-center">
                <div className="col-xl-6 col-lg-7">
                  <div className="tp-slider-content p-relative z-index-1">
                    {slide.title && (
                      <h3 className="tp-slider-title">{slide.title}</h3>
                    )}
                    {slide.subtitle && (
                      <p>{slide.subtitle}</p>
                    )}
                    {slide.buttonText && slide.buttonUrl && (
                      <div className="tp-slider-btn mt-25">
                        <Link href={slide.buttonUrl} className="tp-btn tp-btn-2 tp-btn-white">
                          {slide.buttonText}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        <div className="tp-slider-arrow tp-swiper-arrow">
          <button type="button" className="tp-cms-slider-button-prev">
            <i className="fa-solid fa-angle-left"></i>
          </button>
          <button type="button" className="tp-cms-slider-button-next">
            <i className="fa-solid fa-angle-right"></i>
          </button>
        </div>
        <div className="tp-cms-slider-dot tp-swiper-dot"></div>
      </Swiper>
    </section>
  );
};

export default HeroSlider;
