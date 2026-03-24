import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import CliconDealFeaturedCard from './clicon-deal-featured-card';
import CliconDealProductCard from './clicon-deal-product-card';

// ---------------------------------------------------------------------------
// Countdown — counts down to the end of the current day (midnight local time)
// ---------------------------------------------------------------------------
function useEndOfDayCountdown() {
  const getSecondsLeft = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight - now) / 1000));
  };

  // Start with null to avoid SSR/client mismatch
  const [seconds, setSeconds] = useState(null);

  useEffect(() => {
    setSeconds(getSecondsLeft());
    const timer = setInterval(() => {
      setSeconds(getSecondsLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show placeholder during SSR / first render
  if (seconds === null) return { h: '--', m: '--', s: '--' };

  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');

  return { h, m, s };
}

// ---------------------------------------------------------------------------
// Countdown display sub-component
// ---------------------------------------------------------------------------
function Countdown({ t }) {
  const { h, m, s } = useEndOfDayCountdown();

  return (
    <div className="cl-deals__countdown" aria-live="off" data-testid="clicon-deals-countdown">
      <span className="cl-deals__countdown-label">{t('deals.ends')}</span>
      <div className="cl-deals__countdown-units">
        <div className="cl-deals__countdown-unit">
          <span className="cl-deals__countdown-value">{h}</span>
          <span className="cl-deals__countdown-unit-label">Hrs</span>
        </div>
        <span className="cl-deals__countdown-sep" aria-hidden="true">:</span>
        <div className="cl-deals__countdown-unit">
          <span className="cl-deals__countdown-value">{m}</span>
          <span className="cl-deals__countdown-unit-label">Min</span>
        </div>
        <span className="cl-deals__countdown-sep" aria-hidden="true">:</span>
        <div className="cl-deals__countdown-unit">
          <span className="cl-deals__countdown-value">{s}</span>
          <span className="cl-deals__countdown-unit-label">Sec</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton placeholder row
// ---------------------------------------------------------------------------
function DealsSkeletonRow() {
  return (
    <div className="row g-3">
      <div className="col-xl-4">
        <div className="cl-deal-featured cl-deal-featured--skeleton" aria-busy="true">
          <div className="cl-skeleton cl-skeleton--rect" style={{ height: 320 }} />
          <div className="cl-skeleton cl-skeleton--line mt-3" style={{ width: '60%' }} />
          <div className="cl-skeleton cl-skeleton--line mt-2" style={{ width: '40%' }} />
        </div>
      </div>
      <div className="col-xl-8">
        <div className="row g-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="col-6 col-sm-4 col-md-3">
              <div className="cl-deal-card cl-deal-card--skeleton" aria-busy="true">
                <div className="cl-skeleton cl-skeleton--rect" style={{ height: 160 }} />
                <div className="cl-skeleton cl-skeleton--line mt-2" style={{ width: '80%' }} />
                <div className="cl-skeleton cl-skeleton--line mt-1" style={{ width: '50%' }} />
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
        <div className="cl-deals__header">
          <div className="cl-deals__header-left">
            <h2 className="cl-deals__title">{t('deals.title')}</h2>
            <Countdown t={t} />
          </div>
          <Link
            href="/shop"
            className="cl-browse-link cl-deals__browse-link"
            data-testid="clicon-deals-browse-link"
          >
            {t('deals.browseAll')}
            <i className="fa-solid fa-arrow-right ms-1" aria-hidden="true" />
          </Link>
        </div>

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
