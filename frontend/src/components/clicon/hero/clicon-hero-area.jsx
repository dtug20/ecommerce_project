import React from 'react';
import { Pagination, EffectFade, Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CliconHeroPromoCard from './clicon-hero-promo-card';

// ---------------------------------------------------------------------------
// Hardcoded slide data — replace image URLs with real assets when available
// ---------------------------------------------------------------------------
const SLIDES = [
  {
    id: 1,
    subtitleKey: 'hero.slide1Subtitle',
    titleKey: 'hero.slide1Title',
    descKey: 'hero.slide1Desc',
    image: 'https://i.ibb.co/7VDrSJv/slider-product-1.png',
    bgColor: '#F2F4F5',
    price: '$299',
  },
  {
    id: 2,
    subtitleKey: 'hero.slide2Subtitle',
    titleKey: 'hero.slide2Title',
    descKey: 'hero.slide2Desc',
    image: 'https://i.ibb.co/7t7yxpb/slider-product-2.png',
    bgColor: '#EAF4FB',
    price: '$499',
  },
  {
    id: 3,
    subtitleKey: 'hero.slide3Subtitle',
    titleKey: 'hero.slide3Title',
    descKey: 'hero.slide3Desc',
    image: 'https://i.ibb.co/4mgZSSS/slider-product-3.png',
    bgColor: '#FFF3EB',
    price: '$199',
  },
];

const PROMO_CARDS = [
  {
    id: 'promo-1',
    subtitleKey: 'hero.promo1Subtitle',
    titleKey: 'hero.promo1Name',
    price: 999,
    link: '/shop?category=electronics',
    bgColor: '#EAF4FB',
    image: 'https://i.ibb.co/bRf0Gvz/promo-phone.png',
  },
  {
    id: 'promo-2',
    subtitleKey: 'hero.promo2Subtitle',
    titleKey: 'hero.promo2Name',
    price: 89,
    link: '/shop?category=electronics',
    bgColor: '#FFF3EB',
    image: 'https://i.ibb.co/KydJSfN/promo-headphone.png',
  },
];

// ---------------------------------------------------------------------------
// Sub-component: single slide content
// ---------------------------------------------------------------------------
function HeroSlide({ slide, t }) {
  return (
    <div
      className="cl-hero-slide"
      style={{ backgroundColor: slide.bgColor }}
      data-testid={`clicon-hero-slide-${slide.id}`}
    >
      <div className="container-fluid px-0">
        <div className="row g-0 align-items-center">
          {/* Text content */}
          <div className="col-md-6 col-lg-7">
            <div className="cl-hero-slide__content">
              <p className="cl-hero-slide__subtitle">{t(slide.subtitleKey)}</p>
              <h2 className="cl-hero-slide__title">{t(slide.titleKey)}</h2>
              <p className="cl-hero-slide__desc">{t(slide.descKey)}</p>
              <Link
                href="/shop"
                className="cl-hero-slide__btn"
                data-testid="clicon-hero-shop-btn"
              >
                {t('hero.shopNow')}
                <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
              </Link>
            </div>
          </div>
          {/* Product image + price circle */}
          <div className="col-md-6 col-lg-5">
            <div className="cl-hero-slide__image">
              {slide.price && (
                <span className="cl-hero-slide__price-circle">{slide.price}</span>
              )}
              <Image
                src={slide.image}
                alt={t(slide.titleKey)}
                width={420}
                height={360}
                priority={slide.id === 1}
                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const CliconHeroArea = () => {
  const { t } = useTranslation();

  return (
    <section className="cl-hero-area" data-testid="clicon-hero-area">
      <div className="container">
        <div className="row g-3 align-items-stretch">
          {/* Left: Swiper slider — 60% on xl+ */}
          <div className="col-xl-8 d-flex">
            <div className="cl-hero-slider w-100">
              <Swiper
                slidesPerView={1}
                effect="fade"
                loop
                autoplay={{ delay: 4500, disableOnInteraction: false }}
                pagination={{ el: '.cl-hero-dots', clickable: true }}
                modules={[Pagination, EffectFade, Autoplay]}
                className="cl-hero-swiper"
                data-testid="clicon-hero-swiper"
              >
                {SLIDES.map((slide) => (
                  <SwiperSlide key={slide.id}>
                    <HeroSlide slide={slide} t={t} />
                  </SwiperSlide>
                ))}
                {/* Dots inside swiper so slider fills full column height */}
                <div className="cl-hero-dots" />
              </Swiper>
            </div>
          </div>

          {/* Right: Promo cards — 40% on xl+ */}
          <div className="col-xl-4 d-flex">
            <div className="cl-hero-promo w-100">
              {PROMO_CARDS.map((card) => (
                <CliconHeroPromoCard
                  key={card.id}
                  title={t(card.titleKey)}
                  subtitle={t(card.subtitleKey)}
                  price={card.price}
                  link={card.link}
                  bgColor={card.bgColor}
                  image={card.image}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CliconHeroArea;
