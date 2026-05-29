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
    image: '/assets/img/slider/slider-img-1.png',
    bgColor: '#F2F4F5',
    price: '$299',
    link: '/shop',
  },
  {
    subtitleKey: 'hero.slide2Subtitle',
    titleKey: 'hero.slide2Title',
    descKey: 'hero.slide2Desc',
    image: '/assets/img/slider/slider-img-2.png',
    bgColor: '#EAF4FB',
    price: '$499',
    link: '/shop',
  },
  {
    subtitleKey: 'hero.slide3Subtitle',
    titleKey: 'hero.slide3Title',
    descKey: 'hero.slide3Desc',
    image: '/assets/img/slider/slider-img-3.png',
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
    image: '/assets/img/banner/banner-slider-1.png',
  },
  {
    subtitleKey: 'hero.promo2Subtitle',
    titleKey: 'hero.promo2Name',
    price: 89,
    link: '/shop?category=electronics',
    bgColor: '#FFF3EB',
    image: '/assets/img/banner/banner-slider-2.png',
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

  return (
    <div
      className="cl-hero-slide"
      style={{ backgroundColor: slide.bgColor }}
      data-testid={`clicon-hero-slide`}
    >
      {slide.image && (
        <Image
          className="cl-hero-slide__bg"
          src={slide.image}
          alt={title || ''}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 66vw"
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      )}
      <span className="cl-hero-slide__scrim" aria-hidden="true" />
      <div className="cl-hero-slide__content">
        {subtitle && <p className="cl-hero-slide__subtitle">{subtitle}</p>}
        {title && <h2 className="cl-hero-slide__title">{title}</h2>}
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
                // Re-init Swiper khi tập slide đổi (fallback 3 -> API 4). Bật `loop`
                // mà đổi số slide sau init sẽ làm slide active bị rỗng nếu không remount.
                key={`hero-${useApi ? 'api' : 'fallback'}-${slides.length}`}
                slidesPerView={1}
                effect="fade"
                fadeEffect={{ crossFade: true }}
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
