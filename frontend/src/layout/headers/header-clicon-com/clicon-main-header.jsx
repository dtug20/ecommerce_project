import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import useCartInfo from "@/hooks/use-cart-info";
import { openCartMini } from "@/redux/features/cartSlice";
import { userLoggedOut } from "@/redux/features/auth/authSlice";
import { Search } from "@/svg";
import useSearchFormSubmit from "@/hooks/use-search-form-submit";
import { useKeycloak } from "@/components/providers/keycloak-provider";
import logo from "@assets/img/logo/logo.svg";

const CliconMainHeader = ({ setIsCanvasOpen }) => {
  const { t } = useTranslation();
  const { user: userInfo } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { quantity } = useCartInfo();
  const dispatch = useDispatch();
  const keycloak = useKeycloak();
  const { setSearchText, handleSubmit, searchText } = useSearchFormSubmit();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(userLoggedOut());
    try {
      localStorage.removeItem("cart_products");
      localStorage.removeItem("wishlist_items");
      localStorage.removeItem("compare_items");
      localStorage.removeItem("couponInfo");
      localStorage.removeItem("shipping_info");
    } catch (_) {
      // ignore
    }
    if (keycloak?.logout) {
      keycloak.logout({ redirectUri: window.location.origin });
    }
  };

  return (
    <div className="cl-main-header">
      <div className="container">
        <div className="cl-main-header__inner">
          {/* Logo */}
          <div className="cl-main-header__logo">
            <Link href="/">
              <Image src={logo} alt="logo" width={140} height={36} />
            </Link>
          </div>

          {/* Search */}
          <div className="cl-main-header__search">
            <form onSubmit={handleSubmit} className="cl-search-form">
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

          {/* Action icons */}
          <div className="cl-main-header__actions">
            {/* Cart */}
            <button
              onClick={() => dispatch(openCartMini())}
              type="button"
              className="cl-header-icon"
              aria-label="Cart"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 7.67V6.7c0-2.25 1.81-4.46 4.06-4.67a4.5 4.5 0 0 1 4.94 4.48v1.38" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22h6c4.02 0 4.74-1.61 4.95-3.57l.75-6C20.97 9.99 20.27 8 16 8H8c-4.27 0-4.97 1.99-4.7 4.43l.75 6C4.26 20.39 4.98 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.5 12h.01M8.5 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {quantity > 0 && <span className="cl-header-icon__badge">{quantity}</span>}
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className="cl-header-icon" aria-label="Wishlist">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {wishlist.length > 0 && <span className="cl-header-icon__badge">{wishlist.length}</span>}
            </Link>

            {/* User / Profile dropdown */}
            <div className="cl-profile-drop-wrap" ref={profileRef}>
              <button
                type="button"
                className="cl-header-icon cl-profile-drop-wrap__trigger"
                aria-label={userInfo?.name || t("header.signIn")}
                onClick={() => setProfileOpen((o) => !o)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM20.59 22c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {profileOpen && (
                <div className="cl-profile-drop">
                  {userInfo?.name ? (
                    <>
                      {/* Logged-in header */}
                      <div className="cl-profile-drop__head">
                        <div className="cl-profile-drop__avatar">
                          {userInfo.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="cl-profile-drop__name">{userInfo.name}</p>
                          {userInfo.email && (
                            <p className="cl-profile-drop__email">{userInfo.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="cl-profile-drop__divider" />
                      <ul className="cl-profile-drop__menu">
                        <li>
                          <Link href="/profile" onClick={() => setProfileOpen(false)} className="cl-profile-drop__item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            {t("header.myProfile")}
                          </Link>
                        </li>
                        <li>
                          <Link href="/profile?tab=orders" onClick={() => setProfileOpen(false)} className="cl-profile-drop__item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
                            </svg>
                            {t("header.myOrders")}
                          </Link>
                        </li>
                        <li>
                          <Link href="/wishlist" onClick={() => setProfileOpen(false)} className="cl-profile-drop__item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            {t("header.wishlist")}
                          </Link>
                        </li>
                      </ul>
                      <div className="cl-profile-drop__divider" />
                      <ul className="cl-profile-drop__menu">
                        <li>
                          <button onClick={handleLogout} className="cl-profile-drop__item cl-profile-drop__item--logout">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            {t("header.logout")}
                          </button>
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      {/* Guest state */}
                      <div className="cl-profile-drop__guest">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <p>{t("header.signIn")}</p>
                      </div>
                      <div className="cl-profile-drop__guest-actions">
                        <Link href="/login" onClick={() => setProfileOpen(false)} className="cl-profile-drop__btn cl-profile-drop__btn--primary">
                          {t("header.login")}
                        </Link>
                        <Link href="/register" onClick={() => setProfileOpen(false)} className="cl-profile-drop__btn cl-profile-drop__btn--outline">
                          {t("header.register")}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu */}
            <button
              onClick={() => setIsCanvasOpen(true)}
              type="button"
              className="cl-header-icon cl-header-icon--mobile d-lg-none"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CliconMainHeader;
