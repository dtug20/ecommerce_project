import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import CustomerSupportArea from "@/components/contact/customer-support-area";

const ContactPage = () => {
  const { t } = useTranslation();

  const breadcrumbLinks = [
    { label: t("breadcrumb.home"), href: "/" },
    { label: t("nav.customerSupport") },
  ];

  return (
    <Wrapper>
      <SEO pageTitle={t("nav.customerSupport")} />
      <HeaderClicon />
      <ShopBreadcrumb links={breadcrumbLinks} />
      <CustomerSupportArea />
      <FooterClicon />
    </Wrapper>
  );
};

export default ContactPage;
