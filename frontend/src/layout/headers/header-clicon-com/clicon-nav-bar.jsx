import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";
import { useGetSettingsQuery } from "@/redux/features/cmsApi";

const CliconNavBar = () => {
  const { t } = useTranslation();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { data: settingsData } = useGetSettingsQuery();
  const { data: categories } = useGetShowCategoryQuery();
  const phone = settingsData?.data?.contact?.phone || "+1-202-555-0104";

  const categoryItems = (categories?.result || []).slice(0, 8);

  const buildSlug = (title) =>
    title.toLowerCase().replace("&", "").split(" ").join("-");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="cl-nav-bar d-none d-lg-block">
      <div className="container">
        <div className="cl-nav-bar__inner">
          {/* Category dropdown */}
          <div className="cl-nav-bar__category" ref={dropdownRef}>
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="cl-nav-bar__category-btn"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{t("header.allProductTypes")}</span>
              <i className={`fas fa-chevron-${isCategoryOpen ? "up" : "down"}`}></i>
            </button>

            {/* Dropdown menu */}
            <div className={`cl-cat-dropdown ${isCategoryOpen ? "cl-cat-dropdown--open" : ""}`}>
              <ul className="cl-cat-dropdown__list">
                {categoryItems.map((cat) => {
                  const hasChildren = cat.children && cat.children.length > 0;
                  return (
                    <li
                      key={cat._id}
                      className={`cl-cat-dropdown__item ${hasChildren ? "cl-cat-dropdown__item--has-sub" : ""}`}
                    >
                      <Link
                        href={`/shop?category=${buildSlug(cat.parent)}`}
                        className="cl-cat-dropdown__link"
                        onClick={() => setIsCategoryOpen(false)}
                      >
                        {cat.img && (
                          <img src={cat.img} alt="" width={24} height={24} className="cl-cat-dropdown__icon" />
                        )}
                        <span>{cat.parent}</span>
                        {hasChildren && (
                          <i className="fas fa-chevron-right cl-cat-dropdown__arrow"></i>
                        )}
                      </Link>

                      {/* Sub-menu on hover */}
                      {hasChildren && (
                        <ul className="cl-cat-dropdown__sub">
                          {cat.children.map((child, i) => (
                            <li key={i} className="cl-cat-dropdown__sub-item">
                              <Link
                                href={`/shop?subCategory=${buildSlug(child)}`}
                                className="cl-cat-dropdown__sub-link"
                                onClick={() => setIsCategoryOpen(false)}
                              >
                                {child}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Nav links — matching Figma layout */}
          <nav className="cl-nav-bar__links">
            <Link href="/profile">
              <i className="far fa-map-marker-alt"></i> Track Order
            </Link>
            <Link href="/compare">
              <i className="far fa-arrows-repeat"></i> Compare
            </Link>
            <Link href="/contact">
              <i className="far fa-headset"></i> Customer Support
            </Link>
            <Link href="/blog">
              <i className="far fa-newspaper"></i> {t("nav.blog")}
            </Link>
            <Link href="/coupon">
              <i className="far fa-tags"></i> {t("nav.coupons")}
            </Link>
          </nav>

          {/* Phone */}
          <div className="cl-nav-bar__phone">
            <i className="fas fa-phone-alt"></i>
            <a href={`tel:${phone}`}>{phone}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CliconNavBar;
