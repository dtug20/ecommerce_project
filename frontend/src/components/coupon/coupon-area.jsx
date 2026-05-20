import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetOfferCouponsQuery } from '@/redux/features/coupon/couponApi';
import useCurrency from '@/hooks/use-currency';
import { ClButton } from '@/components/clicon/ui';

const formatExpiryDate = (iso, locale = 'en') => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const CouponCard = ({ coupon, copied, onCopy, t, formatPrice, locale }) => {
  const isExpired = coupon.endTime && new Date(coupon.endTime).getTime() < Date.now();
  const expiry = formatExpiryDate(coupon.endTime, locale);

  return (
    <article className="cl-coupon-card" data-testid="coupon-card">
      <div className="cl-coupon-card__media">
        {coupon.productType && (
          <span className="cl-coupon-card__badge-type">{coupon.productType}</span>
        )}
        {coupon.logo ? (
          <img src={coupon.logo} alt={coupon.title || coupon.couponCode} loading="lazy" />
        ) : (
          <i className="fa-regular fa-ticket" aria-hidden="true" style={{ fontSize: 48, color: 'var(--cl-text-secondary)' }} />
        )}
      </div>
      <span className="cl-coupon-card__perforation" aria-hidden="true" />
      <div className="cl-coupon-card__body">
        <div>
          <div className="cl-coupon-card__discount">
            <span className="num">{coupon.discountPercentage}%</span>
            <span className="off">{t('coupon.off')}</span>
          </div>
          <h3 className="cl-coupon-card__title">{coupon.title || coupon.couponCode}</h3>
          <p className="cl-coupon-card__meta">
            {t('coupon.onOrdersOver', { amount: formatPrice(coupon.minimumAmount || 0) })}
          </p>
          {expiry && (
            <p className={`cl-coupon-card__expires${isExpired ? ' cl-coupon-card__expires--expired' : ''}`}>
              <span className="label">{t('coupon.expires')}:</span> {expiry}
            </p>
          )}
        </div>
        <div className="cl-coupon-card__code-row">
          <div className="cl-coupon-card__code" aria-label={t('coupon.copy')}>
            {coupon.couponCode}
          </div>
          <ClButton
            variant={copied ? 'outlined' : 'primary'}
            size="sm"
            onClick={() => onCopy(coupon.couponCode)}
            disabled={isExpired}
            data-testid="coupon-copy"
          >
            {copied ? t('coupon.copied') : t('coupon.copy')}
          </ClButton>
        </div>
      </div>
    </article>
  );
};

const CouponArea = () => {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopy = async (code) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
    } catch {
      // ignore — still show "Copied!" feedback
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const { data: offerCoupons, isError, isLoading } = useGetOfferCouponsQuery();

  let content = null;

  if (isLoading) {
    content = (
      <div className="cl-coupons-loading" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="cl-coupon-skeleton" />
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <div className="cl-coupons-empty">
        <div className="icon"><i className="fa-regular fa-circle-exclamation" aria-hidden="true" /></div>
        <h3 className="title">{t('error.generic')}</h3>
      </div>
    );
  } else if (!offerCoupons || offerCoupons.length === 0) {
    content = (
      <div className="cl-coupons-empty">
        <div className="icon"><i className="fa-regular fa-ticket" aria-hidden="true" /></div>
        <h3 className="title">{t('coupon.noCouponsFound')}</h3>
        <p className="text">{t('coupon.noCouponsHint')}</p>
      </div>
    );
  } else {
    content = (
      <div className="row">
        {offerCoupons.map((coupon) => (
          <div key={coupon._id} className="col-xl-6 col-lg-6 col-md-12">
            <CouponCard
              coupon={coupon}
              copied={copiedCode === coupon.couponCode}
              onCopy={handleCopy}
              t={t}
              formatPrice={formatPrice}
              locale={i18n.language}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <section className="cl-coupon-hero">
        <div className="container">
          <h1 className="cl-coupon-hero__title">{t('coupon.heroTitle')}</h1>
          <p className="cl-coupon-hero__subtitle">{t('coupon.heroSubtitle')}</p>
        </div>
      </section>
      <section className="cl-coupons-section">
        <div className="container">{content}</div>
      </section>
    </>
  );
};

export default CouponArea;
