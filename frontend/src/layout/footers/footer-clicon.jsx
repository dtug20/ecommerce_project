import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useGetSettingsQuery } from "@/redux/features/cmsApi";
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";
import logo from "@assets/img/logo/logo.svg";

const FooterClicon = () => {
  const { t } = useTranslation();
  const { data: settingsData } = useGetSettingsQuery();
  const { data: categories } = useGetShowCategoryQuery();
  const settings = settingsData?.data;
  const phone = settings?.contact?.phone || "(629) 555-0129";
  const email = settings?.contact?.email || "info@shofy.com";
  const address = settings?.contact?.address || "Ho Chi Minh City, Vietnam";

  const categoryItems = (categories?.result || []).slice(0, 6);
  const year = new Date().getFullYear();

  const buildCategorySlug = (title) =>
    title.toLowerCase().replace("&", "").split(" ").join("-");

  return (
    <footer className="cl-footer">
      {/* Main footer */}
      <div className="cl-footer__main">
        <div className="container">
          <div className="row">
            {/* Col 1: Logo + Contact */}
            <div className="col-xl-3 col-lg-4 col-md-6 col-12 mb-4 mb-xl-0">
              <div className="cl-footer__brand">
                <Link href="/" className="cl-footer__logo">
                  <Image src={logo} alt="logo" width={140} height={36} />
                </Link>
                <div className="cl-footer__contact">
                  <p className="cl-footer__contact-label">Customer Supports:</p>
                  <a href={`tel:${phone}`} className="cl-footer__contact-phone">{phone}</a>
                  <p className="cl-footer__contact-address">{address}</p>
                  <a href={`mailto:${email}`} className="cl-footer__contact-email">{email}</a>
                </div>
              </div>
            </div>

            {/* Col 2: Top Category */}
            <div className="col-xl-2 col-lg-2 col-md-6 col-6 mb-4 mb-xl-0">
              <div className="cl-footer__widget">
                <h4 className="cl-footer__widget-title">TOP CATEGORY</h4>
                <ul className="cl-footer__links">
                  {categoryItems.map((cat) => (
                    <li key={cat._id}>
                      <Link href={`/shop?category=${buildCategorySlug(cat.parent)}`}>
                        {cat.parent}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/shop" className="cl-footer__browse-link">
                      Browse All Product <i className="fas fa-arrow-right"></i>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Col 3: Quick Links */}
            <div className="col-xl-2 col-lg-2 col-md-6 col-6 mb-4 mb-xl-0">
              <div className="cl-footer__widget">
                <h4 className="cl-footer__widget-title">QUICK LINKS</h4>
                <ul className="cl-footer__links">
                  <li><Link href="/shop">Shop Product</Link></li>
                  <li><Link href="/cart">{t("header.cart")}</Link></li>
                  <li><Link href="/wishlist">{t("header.wishlist")}</Link></li>
                  <li><Link href="/compare">Compare</Link></li>
                  <li><Link href="/profile">Track Order</Link></li>
                  <li><Link href="/contact">Customer Help</Link></li>
                </ul>
              </div>
            </div>

            {/* Col 4: Download App */}
            <div className="col-xl-2 col-lg-2 col-md-6 col-6 mb-4 mb-xl-0">
              <div className="cl-footer__widget">
                <h4 className="cl-footer__widget-title">DOWNLOAD APP</h4>
                <div className="cl-footer__app-badges">
                  <a href="#" className="cl-footer__app-badge" aria-label="Google Play">
                    <div className="cl-footer__app-badge-inner">
                      <i className="fab fa-google-play"></i>
                      <div>
                        <span>Get it now</span>
                        <strong>Google Play</strong>
                      </div>
                    </div>
                  </a>
                  <a href="#" className="cl-footer__app-badge" aria-label="App Store">
                    <div className="cl-footer__app-badge-inner">
                      <i className="fab fa-apple"></i>
                      <div>
                        <span>Get it now</span>
                        <strong>App Store</strong>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Col 5: Popular Tags */}
            <div className="col-xl-3 col-lg-2 col-md-6 col-6 mb-4 mb-xl-0">
              <div className="cl-footer__widget">
                <h4 className="cl-footer__widget-title">POPULAR TAG</h4>
                <div className="cl-footer__tags">
                  {["Game", "iPhone", "TV", "Asus Laptops", "Macbook", "SSD", "Graphics Card",
                    "Power Bank", "Smart TV", "Speaker", "Tablet", "Microwave", "Samsung"].map((tag) => (
                    <Link key={tag} href={`/shop?tag=${tag.toLowerCase()}`} className="cl-footer__tag">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="cl-footer__bottom">
        <div className="container">
          <p className="cl-footer__copyright">
            Shofy eCommerce &copy; {year}. {t("footer.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterClicon;
