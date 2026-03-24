import React from 'react';
import { Pagination, EffectFade, Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetBannersQuery } from '@/redux/features/cmsApi';
import CliconHeroPromoCard from './clicon-hero-promo-card';

// ---------------------------------------------------------------------------
// Fallback data — used only when no banners exist in CRM yet
// ---------------------------------------------------------------------------
const FALLBACK_SLIDES = [
  {
    subtitleKey: 'hero.slide1Subtitle',
    titleKey: 'hero.slide1Title',
    descKey: 'hero.slide1Desc',
    image: 'https://i.ibb.co/WVdTgR8/headphone-1.png',
    bgColor: '#F2F4F5',
    price: '$299',
    link: '/shop',
  },
  {
    subtitleKey: 'hero.slide2Subtitle',
    titleKey: 'hero.slide2Title',
    descKey: 'hero.slide2Desc',
    image: 'https://i.ibb.co/jvGv6qf/mobile-1.png',
    bgColor: '#EAF4FB',
    price: '$499',
    link: '/shop',
  },
  {
    subtitleKey: 'hero.slide3Subtitle',
    titleKey: 'hero.slide3Title',
    descKey: 'hero.slide3Desc',
    image: 'https://i.ibb.co/gg9yCwX/clothing-1.png',
    bgColor: '#FFF3EB',
    price: '$199',
    link: '/shop',
  },
];

const FALLBACK_PROMOS = [
  {
    subtitleKey: 'hero.promo1Subtitle',
    titleKey: 'hero.promo1Name',
    price: 999,
    link: '/shop?category=electronics',
    bgColor: '#EAF4FB',
    image: 'https://i.ibb.co/3WMPkkf/mobile-5.png',
  },
  {
    subtitleKey: 'hero.promo2Subtitle',
    titleKey: 'hero.promo2Name',
    price: 89,
    link: '/shop?category=electronics',
    bgColor: '#FFF3EB',
    image: 'https://i.ibb.co/WVdTgR8/headphone-1.png',
  },
];

// ---------------------------------------------------------------------------
// Map CRM Banner to slide shape
// ---------------------------------------------------------------------------
function bannerToSlide(banner) {
  return {
    _id: banner._id,
    title: banner.content?.text || banner.title,
    subtitle: banner.content?.buttonText || '',
    desc: banner.content?.textVi || '',
    image: banner.content?.image || '',
    bgColor: banner.content?.backgroundColor || '#F2F4F5',
    link: banner.content?.buttonUrl || '/shop',
  };
}

function bannerToPromo(banner) {
  return {
    _id: banner._id,
    title: banner.content?.text || banner.title,
    subtitle: banner.content?.buttonText || '',
    image: banner.content?.image || '',
    bgColor: banner.content?.backgroundColor || '#EAF4FB',
    link: banner.content?.buttonUrl || '/shop',
  };
}

// ---------------------------------------------------------------------------
// Sub-component: single slide
// ---------------------------------------------------------------------------
function HeroSlide({ slide, t, isApi }) {
  const title = isApi ? slide.title : t(slide.titleKey);
  const subtitle = isApi ? slide.subtitle : t(slide.subtitleKey);
  const desc = isApi ? slide.desc : t(slide.descKey);

  return (
    <div
      className="cl-hero-slide"
      style={{ backgroundColor: slide.bgColor }}
      data-testid={`clicon-hero-slide`}
    >
      <div className="container-fluid px-0">
        <div className="row g-0 align-items-center">
          <div className="col-md-6 col-lg-7">
            <div className="cl-hero-slide__content">
              {subtitle && <p className="cl-hero-slide__subtitle">{subtitle}</p>}
              <h2 className="cl-hero-slide__title">{title}</h2>
              {desc && <p className="cl-hero-slide__desc">{desc}</p>}
              <Link
                href={slide.link || '/shop'}
                className="cl-hero-slide__btn"
                data-testid="clicon-hero-shop-btn"
              >
                {t('hero.shopNow')}
                <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="col-md-6 col-lg-5">
            <div className="cl-hero-slide__image">
              {slide.price && (
                <span className="cl-hero-slide__price-circle">{slide.price}</span>
              )}
              {slide.image && (
                <Image
                  src={slide.image}
                  alt={title}
                  width={420}
                  height={360}
                  priority
                  style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                  unoptimized
                />
              )}
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

  // Fetch hero slides and promotional banners from CRM
  const { data: heroData } = useGetBannersQuery({ type: 'hero-slide' });
  const { data: promoData } = useGetBannersQuery({ type: 'promotional-banner' });

  const heroBanners = heroData?.data || [];
  const promoBanners = promoData?.data || [];

  // Use CRM banners if available, otherwise fallback
  const useApi = heroBanners.length > 0;
  const slides = useApi ? heroBanners.map(bannerToSlide) : FALLBACK_SLIDES;
  const promos = promoBanners.length > 0
    ? promoBanners.slice(0, 2).map(bannerToPromo)
    : FALLBACK_PROMOS;

  return (
    <section className="cl-hero-area" data-testid="clicon-hero-area">
      <div className="container">
        <div className="row g-3 align-items-stretch">
          {/* Left: Swiper slider */}
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
                {slides.map((slide, idx) => (
                  <SwiperSlide key={slide._id || idx}>
                    <HeroSlide slide={slide} t={t} isApi={useApi} />
                  </SwiperSlide>
                ))}
                <div className="cl-hero-dots" />
              </Swiper>
            </div>
          </div>

          {/* Right: Promo cards */}
          <div className="col-xl-4 d-flex">
            <div className="cl-hero-promo w-100">
              {promos.map((card, idx) => (
                <CliconHeroPromoCard
                  key={card._id || idx}
                  title={promoBanners.length > 0 ? card.title : t(card.titleKey)}
                  subtitle={promoBanners.length > 0 ? card.subtitle : t(card.subtitleKey)}
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
