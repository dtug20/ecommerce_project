import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import useCurrency from '@/hooks/use-currency';

const CliconFullWidthBanner = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  // Grab a product image to display
  const { data } = useGetProductTypeQuery({ type: 'electronics', query: 'topSellers=true&limit=1' });
  const product = data?.data?.[0];
  const productImg = product?.img;

  return (
    <section className="cl-full-banner">
      <div className="container">
        <div className="cl-full-banner__inner">
          {/* Text content */}
          <div className="cl-full-banner__content">
            <span className="cl-full-banner__tag">{t('banner.macTag', { amount: formatPrice(200) })}</span>
            <h2 className="cl-full-banner__title">{t('banner.macTitle')}</h2>
            <p className="cl-full-banner__specs">
              {t('banner.macSpecs')}
            </p>
            <Link href="/shop" className="cl-full-banner__btn">
              {t('banner.shopNow')} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {/* Product image */}
          <div className="cl-full-banner__image">
            <span className="cl-full-banner__price-circle">{formatPrice(1999)}</span>
            {productImg ? (
              <img src={productImg} alt={t('banner.macAlt')} />
            ) : (
              <div className="cl-full-banner__image-placeholder" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CliconFullWidthBanner;
