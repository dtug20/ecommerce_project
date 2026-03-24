import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import ProfileArea from "@/components/my-account/profile-area";
import { useGetUserOrdersQuery } from "@/redux/features/order/orderApi";
import Loader from "@/components/loader/loader";
import { useKeycloak } from "@/components/providers/keycloak-provider";

const ProfilePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const kc = useKeycloak();
  const isAuthenticated = kc?.initialized && kc?.authenticated;

  const { data: orderData, isLoading } = useGetUserOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (kc?.initialized && !kc?.authenticated && kc?.login) {
      kc.login({ redirectUri: window.location.href });
    }
  }, [kc?.initialized, kc?.authenticated]);

  if (!kc?.initialized || isLoading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "100vh" }}
      >
        <Loader loading={true} />
      </div>
    );
  }

  return (
    <Wrapper>
      <SEO pageTitle={t('breadcrumb.myAccount')} noindex />
      <HeaderClicon />
      <ProfileArea orderData={orderData} />
      <FooterClicon />
    </Wrapper>
  );
};

export default ProfilePage;
