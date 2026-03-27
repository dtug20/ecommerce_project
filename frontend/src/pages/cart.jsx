import React from 'react';
import SEO from '@/components/seo';
import HeaderClicon from '@/layout/headers/header-clicon';
import FooterClicon from '@/layout/footers/footer-clicon';
import Wrapper from '@/layout/wrapper';
import ShopBreadcrumb from '@/components/breadcrumb/shop-breadcrumb';
import CliconCartArea from '@/components/clicon/cart/clicon-cart-area';
import { useTranslation } from 'react-i18next';

const CartPage = () => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <SEO pageTitle="Cart" noindex />
      <HeaderClicon />
      <ShopBreadcrumb
        links={[
          { label: t('breadcrumb.home', 'Home'), href: '/' },
          { label: t('breadcrumb.shoppingCart', 'Shopping Cart') },
        ]}
      />
      <CliconCartArea />
      <FooterClicon />
    </Wrapper>
  );
};

export default CartPage;
