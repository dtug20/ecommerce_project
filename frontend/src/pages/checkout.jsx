import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
// internal
import SEO from '@/components/seo';
import Wrapper from '@/layout/wrapper';
import HeaderTwo from '@/layout/headers/header-2';
import Footer from '@/layout/footers/footer';
import CommonBreadcrumb from '@/components/breadcrumb/common-breadcrumb';
import CheckoutArea from '@/components/checkout/checkout-area';
import keycloak from '@/lib/keycloak';

const CheckoutPage = () => {
  const router = useRouter();
  useEffect(() => {
    if (!keycloak.authenticated) {
      keycloak.login({ redirectUri: window.location.href });
    }
  }, [router]);
  return (
    <Wrapper>
      <SEO pageTitle="Checkout" />
      <HeaderTwo style_2={true} />
      <CommonBreadcrumb title="Checkout" subtitle="Checkout" bg_clr={true} />
      <CheckoutArea/>
      <Footer style_2={true} />
    </Wrapper>
  );
};

export default CheckoutPage;
