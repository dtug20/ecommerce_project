import React from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/seo';
import HeaderClicon from '@/layout/headers/header-clicon';
import FooterClicon from '@/layout/footers/footer-clicon';
import Wrapper from '@/layout/wrapper';
import WishlistArea from '@/components/cart-wishlist/wishlist-area';
import ShopBreadcrumb from '@/components/breadcrumb/shop-breadcrumb';

const WishlistPage = () => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <SEO pageTitle={t('wishlist.title')} />
      <HeaderClicon />
      <ShopBreadcrumb
        links={[
          { label: t('breadcrumb.home'), href: '/' },
          { label: t('wishlist.title') },
        ]}
      />
      <WishlistArea />
      <FooterClicon />
    </Wrapper>
  );
};

export default WishlistPage;
