import React from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/seo';
import HeaderClicon from '@/layout/headers/header-clicon';
import FooterClicon from '@/layout/footers/footer-clicon';
import Wrapper from '@/layout/wrapper';
import CompareArea from '@/components/compare/compare-area';
import ShopBreadcrumb from '@/components/breadcrumb/shop-breadcrumb';

const ComparePage = () => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <SEO pageTitle={t('compare.title')} />
      <HeaderClicon />
      <ShopBreadcrumb
        links={[
          { label: t('breadcrumb.home'), href: '/' },
          { label: t('compare.title') },
        ]}
      />
      <CompareArea />
      <FooterClicon />
    </Wrapper>
  );
};

export default ComparePage;
