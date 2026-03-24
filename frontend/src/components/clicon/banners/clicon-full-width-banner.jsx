import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useGetProductTypeQuery } from '@/redux/features/productApi';

const CliconFullWidthBanner = () => {
  const { t } = useTranslation();
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
            <span className="cl-full-banner__tag">SAVE UP TO $200.00</span>
            <h2 className="cl-full-banner__title">Macbook Pro</h2>
            <p className="cl-full-banner__specs">
              Apple M1 Max Chip. 32GB Unified Memory, 1TB SSD Storage
            </p>
            <Link href="/shop" className="cl-full-banner__btn">
              SHOP NOW <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {/* Product image */}
          <div className="cl-full-banner__image">
            <span className="cl-full-banner__price-circle">$1999</span>
            {productImg ? (
              <img src={productImg} alt="Macbook Pro" />
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
