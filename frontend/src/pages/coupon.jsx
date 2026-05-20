import React from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/seo';
import HeaderClicon from '@/layout/headers/header-clicon';
import FooterClicon from '@/layout/footers/footer-clicon';
import Wrapper from '@/layout/wrapper';
import ShopBreadcrumb from '@/components/breadcrumb/shop-breadcrumb';
import CouponArea from '@/components/coupon/coupon-area';

const CouponPage = () => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <SEO pageTitle={t('coupon.heroTitle', 'Coupons')} />
      <HeaderClicon />
      <ShopBreadcrumb
        links={[
          { label: t('breadcrumb.home', 'Home'), href: '/' },
          { label: t('coupon.heroTitle', 'Coupons') },
        ]}
      />
      <CouponArea />
      <FooterClicon />
    </Wrapper>
  );
};

export default CouponPage;
