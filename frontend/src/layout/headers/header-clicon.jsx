import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import useSticky from "@/hooks/use-sticky";
import useCartInfo from "@/hooks/use-cart-info";
import { openCartMini } from "@/redux/features/cartSlice";
import logo from "@assets/img/logo/logo.svg";
import CliconWelcomeBar from "./header-clicon-com/clicon-welcome-bar";
import CliconMainHeader from "./header-clicon-com/clicon-main-header";
import CliconNavBar from "./header-clicon-com/clicon-nav-bar";
import { CliconMiniCart } from "@/components/clicon/composites";
import OffCanvas from "@/components/common/off-canvas";
import { Search } from "@/svg";
import useSearchFormSubmit from "@/hooks/use-search-form-submit";

const HeaderClicon = () => {
  const [isOffCanvasOpen, setIsCanvasOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const { sticky } = useSticky();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { quantity } = useCartInfo();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { setSearchText, handleSubmit, searchText } = useSearchFormSubmit();

  return (
    <>
      <header className="cl-header">
        {/* Tier 1: Announcement bar */}
        {announcementVisible && (
          <div className="cl-announcement">
            <div className="container">
              <div className="cl-announcement__inner">
                <div className="cl-announcement__content">
                  <span className="cl-announcement__highlight">Black</span>
                  <span className="cl-announcement__text"> Friday </span>
                  <span className="cl-announcement__deal">
                    Up to <strong>59%</strong> OFF
                  </span>
                </div>
                <Link href="/shop" className="cl-announcement__btn">
                  SHOP NOW <i className="fas fa-arrow-right"></i>
                </Link>
                <button
                  onClick={() => setAnnouncementVisible(false)}
                  className="cl-announcement__close"
                  aria-label="Close announcement"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tier 2: Welcome bar */}
        <CliconWelcomeBar />

        {/* Tier 3: Main header (logo + search + icons) */}
        <CliconMainHeader setIsCanvasOpen={setIsCanvasOpen} />

        {/* Tier 4: Nav bar (categories + nav + phone) */}
        <CliconNavBar />
      </header>

      {/* Sticky header */}
      <div className={`cl-sticky-header ${sticky ? "cl-sticky-header--active" : ""}`}>
        <div className="container">
          <div className="cl-sticky-header__inner">
            <div className="cl-sticky-header__logo">
              <Link href="/">
                <Image src={logo} alt="logo" width={120} height={30} />
              </Link>
            </div>
            <div className="cl-sticky-header__search d-none d-md-block">
              <form onSubmit={handleSubmit} className="cl-search-form cl-search-form--sm">
                <input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="cl-search-form__input"
                />
                <button type="submit" className="cl-search-form__btn" aria-label="Search">
                  <Search />
                </button>
              </form>
            </div>
            <div className="cl-sticky-header__actions">
              <Link href="/wishlist" className="cl-header-icon cl-header-icon--dark d-none d-lg-flex">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {wishlist.length > 0 && <span className="cl-header-icon__badge">{wishlist.length}</span>}
              </Link>
              <button
                onClick={() => dispatch(openCartMini())}
                type="button"
                className="cl-header-icon cl-header-icon--dark"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 7.67V6.7c0-2.25 1.81-4.46 4.06-4.67a4.5 4.5 0 0 1 4.94 4.48v1.38" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22h6c4.02 0 4.74-1.61 4.95-3.57l.75-6C20.97 9.99 20.27 8 16 8H8c-4.27 0-4.97 1.99-4.7 4.43l.75 6C4.26 20.39 4.98 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {quantity > 0 && <span className="cl-header-icon__badge">{quantity}</span>}
              </button>
              <button
                onClick={() => setIsCanvasOpen(true)}
                type="button"
                className="cl-header-icon cl-header-icon--dark d-lg-none"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CliconMiniCart />
      <OffCanvas isOffCanvasOpen={isOffCanvasOpen} setIsCanvasOpen={setIsCanvasOpen} />
    </>
  );
};

export default HeaderClicon;
