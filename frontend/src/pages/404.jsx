import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import error from "@assets/img/error/error.png";

const ErrorPage = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Wrapper>
      <SEO pageTitle="404" noindex />
      <HeaderClicon />
      <section className="cl-error-area">
        <div className="container">
          <div className="cl-error-content">
            <div className="cl-error-accent" />

            <div className="cl-error-thumb">
              <Image src={error} alt="404 error" width={300} height={300} />
            </div>

            <h3 className="cl-error-title">{t("error.404title")}</h3>
            <p className="cl-error-subtitle">{t("error.subtitle")}</p>

            <div className="cl-error-actions">
              <button
                type="button"
                onClick={() => router.back()}
                className="cl-error-btn cl-error-btn--solid"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                {t("error.goBack")}
              </button>
              <Link href="/" className="cl-error-btn cl-error-btn--outline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {t("error.goHome")}
              </Link>
            </div>

            <div className="cl-error-accent" />
          </div>
        </div>
      </section>
      <FooterClicon />
    </Wrapper>
  );
};

export default ErrorPage;
