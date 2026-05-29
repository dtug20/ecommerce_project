import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
// internal
import { CloseTwo } from '@/svg';
import logo from '@assets/img/logo/logo.svg';
import MobileCategory from '@/layout/headers/header-com/mobile-category';
import { userLoggedOut } from '@/redux/features/auth/authSlice';
import { useKeycloak } from '@/components/providers/keycloak-provider';

const OffCanvas = ({ isOffCanvasOpen, setIsCanvasOpen }) => {
  const [isCategoryActive, setIsCategoryActive] = useState(false);
  const { t, i18n } = useTranslation();
  const { user: userInfo } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();
  const keycloak = useKeycloak();

  const closeCanvas = () => setIsCanvasOpen(false);

  const handleLogout = () => {
    closeCanvas();
    dispatch(userLoggedOut());
    try {
      localStorage.removeItem('cart_products');
      localStorage.removeItem('wishlist_items');
      localStorage.removeItem('compare_items');
      localStorage.removeItem('couponInfo');
      localStorage.removeItem('shipping_info');
    } catch (_) {
      // ignore
    }
    if (keycloak?.logout) {
      keycloak.logout({ redirectUri: window.location.origin });
    }
  };

  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en';

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <div className={`offcanvas__area offcanvas__radius ${isOffCanvasOpen ? "offcanvas-opened" : ""}`}>
        <div className="offcanvas__wrapper">
          <div className="offcanvas__close">
            <button onClick={() => setIsCanvasOpen(false)} className="offcanvas__close-btn offcanvas-close-btn" aria-label={t('aria.closeMenu')}>
              <CloseTwo />
            </button>
          </div>
          <div className="offcanvas__content">
            <div className="offcanvas__top mb-70 d-flex justify-content-between align-items-center">
              <div className="offcanvas__logo logo">
                <Link href="/">
                  <Image src={logo} alt="logo" />
                </Link>
              </div>
            </div>
            <div className="offcanvas__category pb-40">
              <button onClick={() => setIsCategoryActive(!isCategoryActive)} className="tp-offcanvas-category-toggle">
                <i className="fa-solid fa-bars"></i>
                {t('header.allProductTypes')}
              </button>
              <div className="tp-category-mobile-menu">
                <nav className={`tp-category-menu-content ${isCategoryActive ? "active" : ""}`}>
                  <MobileCategory isCategoryActive={isCategoryActive} />
                </nav>
              </div>
            </div>

            {/* Account quick links (wishlist + profile/login live here on mobile) */}
            <ul className="offcanvas__account">
              <li>
                <Link href="/wishlist" onClick={closeCanvas} className="offcanvas__account-link">
                  <i className="fa-regular fa-heart" aria-hidden="true"></i>
                  <span>{t('header.wishlist')}</span>
                  {wishlist?.length > 0 && (
                    <span className="offcanvas__account-badge">{wishlist.length}</span>
                  )}
                </Link>
              </li>
              {userInfo?.name ? (
                <>
                  <li>
                    <Link href="/profile" onClick={closeCanvas} className="offcanvas__account-link">
                      <i className="fa-regular fa-user" aria-hidden="true"></i>
                      <span>{t('header.myProfile')}</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="offcanvas__account-link offcanvas__account-link--logout"
                    >
                      <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
                      <span>{t('header.logout')}</span>
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/login" onClick={closeCanvas} className="offcanvas__account-link">
                    <i className="fa-regular fa-right-to-bracket" aria-hidden="true"></i>
                    <span>{t('header.login')}</span>
                  </Link>
                </li>
              )}
            </ul>

            <div className="offcanvas__btn">
              <Link href="/contact" onClick={closeCanvas} className="tp-btn-2 tp-btn-border-2">{t('nav.contact')}</Link>
            </div>
          </div>
          <div className="offcanvas__bottom">
            <div className="offcanvas__footer d-flex align-items-center justify-content-end">
              <div className="offcanvas__select language">
                <div className="offcanvas__lang d-flex align-items-center gap-2">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`btn btn-sm ${currentLang === 'en' ? 'btn-dark' : 'btn-outline-dark'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => handleLanguageChange('vi')}
                    className={`btn btn-sm ${currentLang === 'vi' ? 'btn-dark' : 'btn-outline-dark'}`}
                  >
                    VI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div onClick={() => setIsCanvasOpen(false)} className={`body-overlay ${isOffCanvasOpen ? 'opened' : ''}`}></div>
    </>
  );
};

export default OffCanvas;