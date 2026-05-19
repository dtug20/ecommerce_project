import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';
import useCurrency from '@/hooks/use-currency';

const renderMultiline = (text) =>
  text.split('\n').map((line, idx, arr) => (
    <React.Fragment key={idx}>
      {line}
      {idx < arr.length - 1 && <br />}
    </React.Fragment>
  ));

const CliconDoubleBanner = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  // Grab 2 products to use their images in the banners
  const { data } = useGetProductTypeQuery({ type: 'electronics', query: 'new=true&limit=2' });
  const products = data?.data || [];
  const leftImg = products[0]?.img;
  const rightImg = products[1]?.img;

  return (
    <section className="cl-double-banner">
      <div className="container">
        <div className="row g-4">
          {/* Left banner — light bg */}
          <div className="col-lg-6">
            <div className="cl-double-banner__card cl-double-banner__card--light">
              <div className="cl-double-banner__body">
                <span className="cl-double-banner__tag">{t('banner.introducing')}</span>
                <h3 className="cl-double-banner__title">
                  {renderMultiline(t('banner.leftTitle'))}
                </h3>
                <p className="cl-double-banner__desc">
                  {t('banner.leftDesc')}
                </p>
                <Link href="/shop" className="cl-double-banner__btn cl-double-banner__btn--primary">
                  {t('banner.shopNow')} <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className="cl-double-banner__img">
                {leftImg ? (
                  <img src={leftImg} alt={t('banner.productAlt')} />
                ) : (
                  <div className="cl-double-banner__img-placeholder" />
                )}
              </div>
            </div>
          </div>

          {/* Right banner — dark bg */}
          <div className="col-lg-6">
            <div className="cl-double-banner__card cl-double-banner__card--dark">
              <div className="cl-double-banner__body">
                <span className="cl-double-banner__tag cl-double-banner__tag--blue">{t('banner.introducingNew')}</span>
                <h3 className="cl-double-banner__title cl-double-banner__title--white">
                  {renderMultiline(t('banner.rightTitle'))}
                </h3>
                <p className="cl-double-banner__desc cl-double-banner__desc--white">
                  {t('banner.rightDesc')}
                </p>
                <Link href="/shop" className="cl-double-banner__btn cl-double-banner__btn--primary">
                  {t('banner.shopNow')} <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className="cl-double-banner__img">
                <span className="cl-double-banner__price-circle">{formatPrice(590)}</span>
                {rightImg ? (
                  <img src={rightImg} alt={t('banner.productAlt')} />
                ) : (
                  <div className="cl-double-banner__img-placeholder" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CliconDoubleBanner;
