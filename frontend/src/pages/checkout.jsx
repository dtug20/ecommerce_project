import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/seo';
import Wrapper from '@/layout/wrapper';
import HeaderClicon from '@/layout/headers/header-clicon';
import FooterClicon from '@/layout/footers/footer-clicon';
import ShopBreadcrumb from '@/components/breadcrumb/shop-breadcrumb';
import CheckoutArea from '@/components/checkout/checkout-area';
import keycloak from '@/lib/keycloak';

const CheckoutPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  useEffect(() => {
    if (!keycloak.authenticated) {
      keycloak.login({ redirectUri: window.location.href });
    }
  }, [router]);

  const breadcrumbLinks = [
    { label: t('breadcrumb.home'), href: '/' },
    { label: t('breadcrumb.shoppingCart'), href: '/cart' },
    { label: t('checkout.title') },
  ];

  return (
    <Wrapper>
      <SEO pageTitle="Checkout" noindex />
      <HeaderClicon />
      <ShopBreadcrumb links={breadcrumbLinks} />
      <CheckoutArea />
      <FooterClicon />
    </Wrapper>
  );
};

export default CheckoutPage;
