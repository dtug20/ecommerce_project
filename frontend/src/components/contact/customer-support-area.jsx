import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useGetSettingsQuery } from "@/redux/features/cmsApi";

const TOPICS = [
  { key: "topicTrackOrder",    icon: "fa-solid fa-truck-fast",      href: "/track-order" },
  { key: "topicResetPassword", icon: "fa-solid fa-key",             href: "/forgot-password" },
  { key: "topicPayment",       icon: "fa-regular fa-credit-card",   href: "#payment" },
  { key: "topicAccount",       icon: "fa-regular fa-user",          href: "/profile" },
  { key: "topicWishlist",      icon: "fa-regular fa-heart",         href: "/wishlist" },
  { key: "topicShipping",      icon: "fa-solid fa-box",             href: "#shipping" },
  { key: "topicCart",          icon: "fa-solid fa-cart-shopping",   href: "/cart" },
  { key: "topicSell",          icon: "fa-solid fa-store",           href: "/profile?tab=vendor" },
];

const POPULAR_TOPICS = [
  { key: "faq1",  highlight: false },
  { key: "faq2",  highlight: false },
  { key: "faq3",  highlight: false },
  { key: "faq4",  highlight: false },
  { key: "faq5",  highlight: false },
  { key: "faq6",  highlight: false },
  { key: "faq7",  highlight: false },
  { key: "faq8",  highlight: true  },
  { key: "faq9",  highlight: false },
];

const CustomerSupportArea = () => {
  const { t } = useTranslation();
  const { data: settingsData } = useGetSettingsQuery();
  const settings = settingsData?.data || {};
  const phone = settings.contact?.phone || settings.contactPhone || "+1-202-555-0126";
  const email = settings.contact?.email || settings.contactEmail || "Support@clicon.com";

  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Static for now — extend to /search?q=... when ready
    if (search.trim()) {
      window.location.href = `/search?query=${encodeURIComponent(search.trim())}`;
    }
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="cl-support-hero">
        <div className="container">
          <div className="cl-support-hero__inner">
            <div className="cl-support-hero__content">
              <span className="cl-support-hero__badge">{t("support.helpCenter")}</span>
              <h1 className="cl-support-hero__title">{t("support.heroTitle")}</h1>

              <form className="cl-support-hero__search" onSubmit={handleSearch}>
                <span className="cl-support-hero__search-icon">
                  <i className="fa-regular fa-magnifying-glass"></i>
                </span>
                <input
                  className="cl-support-hero__search-input"
                  type="text"
                  placeholder={t("support.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t("support.searchPlaceholder")}
                />
                <button type="submit" className="cl-support-hero__search-btn">
                  {t("support.search")}
                </button>
              </form>
            </div>

            <div className="cl-support-hero__illustration" aria-hidden="true">
              <i className="fa-solid fa-headset"></i>
            </div>
          </div>
        </div>
      </section>

      {/* ── Topic Cards ── */}
      <section className="cl-support-topics">
        <div className="container">
          <div className="cl-support-topics__header">
            <h2 className="cl-support-topics__title">{t("support.assistanceTitle")}</h2>
          </div>

          <div className="cl-support-topics__grid">
            {TOPICS.map(({ key, icon, href }) => (
              <Link
                key={key}
                href={href}
                className="cl-support-topics__card"
              >
                <span className="cl-support-topics__card-icon">
                  <i className={icon}></i>
                </span>
                <span className="cl-support-topics__card-label">{t(`support.${key}`)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Topics ── */}
      <section className="cl-support-popular">
        <div className="container">
          <div className="cl-support-popular__header">
            <h2 className="cl-support-popular__title">{t("support.popularTopics")}</h2>
          </div>

          <div className="cl-support-popular__grid">
            {POPULAR_TOPICS.map(({ key, highlight }) => (
              <div
                key={key}
                className={`cl-support-popular__item${highlight ? " cl-support-popular__item--highlight" : ""}`}
              >
                <span className="cl-support-popular__bullet"></span>
                <a href="#" className="cl-support-popular__link">
                  {t(`support.${key}`)}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Methods ── */}
      <section className="cl-support-contact">
        <div className="container">
          <div className="cl-support-contact__header">
            <span className="cl-support-contact__badge">{t("support.contactUs")}</span>
            <h2 className="cl-support-contact__title">
              {t("support.dontFindAnswer")}<br />
              {t("support.contactWithUs")}
            </h2>
          </div>

          <div className="cl-support-contact__cards">
            {/* Call us now */}
            <div className="cl-support-contact__card">
              <div className="cl-support-contact__card-icon-wrap cl-support-contact__card-icon-wrap--blue">
                <i className="fa-solid fa-phone"></i>
              </div>
              <div className="cl-support-contact__card-body">
                <h3 className="cl-support-contact__card-title">{t("support.callUsNow")}</h3>
                <p className="cl-support-contact__card-hours">{t("support.callUsHours")}</p>
                <p className="cl-support-contact__card-value">{phone}</p>
                <a
                  href={`tel:${phone}`}
                  className="cl-support-contact__card-btn cl-support-contact__card-btn--blue"
                >
                  {t("support.callNow")} <i className="fa-solid fa-arrow-right"></i>
                </a>
              </div>
            </div>

            {/* Chat with us */}
            <div className="cl-support-contact__card">
              <div className="cl-support-contact__card-icon-wrap cl-support-contact__card-icon-wrap--green">
                <i className="fa-regular fa-message"></i>
              </div>
              <div className="cl-support-contact__card-body">
                <h3 className="cl-support-contact__card-title">{t("support.chatWithUs")}</h3>
                <p className="cl-support-contact__card-hours">{t("support.chatHours")}</p>
                <p className="cl-support-contact__card-value">{email}</p>
                <a
                  href={`mailto:${email}`}
                  className="cl-support-contact__card-btn cl-support-contact__card-btn--green"
                >
                  {t("support.contactUs")} <i className="fa-solid fa-arrow-right"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CustomerSupportArea;
