import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';

const CliconDoubleBanner = () => {
  const { t } = useTranslation();
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
                <span className="cl-double-banner__tag">INTRODUCING</span>
                <h3 className="cl-double-banner__title">
                  New Apple<br />Homepod Mini
                </h3>
                <p className="cl-double-banner__desc">
                  Jam-packed with innovation, HomePod mini delivers unexpectedly.
                </p>
                <Link href="/shop" className="cl-double-banner__btn cl-double-banner__btn--primary">
                  SHOP NOW <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className="cl-double-banner__img">
                {leftImg ? (
                  <img src={leftImg} alt="Product" />
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
                <span className="cl-double-banner__tag cl-double-banner__tag--blue">INTRODUCING NEW</span>
                <h3 className="cl-double-banner__title cl-double-banner__title--white">
                  Xiaomi Mi 11 Ultra<br />12GB+256GB
                </h3>
                <p className="cl-double-banner__desc cl-double-banner__desc--white">
                  *Data provided by internal laboratories. Industry measurement.
                </p>
                <Link href="/shop" className="cl-double-banner__btn cl-double-banner__btn--primary">
                  SHOP NOW <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className="cl-double-banner__img">
                <span className="cl-double-banner__price-circle">$590</span>
                {rightImg ? (
                  <img src={rightImg} alt="Product" />
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
