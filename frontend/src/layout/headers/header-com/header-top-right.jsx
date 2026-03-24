import Link from "next/link";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { userLoggedOut } from "@/redux/features/auth/authSlice";
import { useKeycloak } from "@/components/providers/keycloak-provider";

// language switcher
function Language({ active, handleActive }) {
  const { t, i18n } = useTranslation();

  const handleChangeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleActive("");
  };

  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";

  return (
    <div className="tp-header-top-menu-item tp-header-lang">
      <span
        onClick={() => handleActive("lang")}
        className="tp-header-lang-toggle"
        id="tp-header-lang-toggle"
      >
        {t(`language.${currentLang}`)}
      </span>
      <ul className={active === "lang" ? "tp-lang-list-open" : ""}>
        <li>
          <a
            className="cursor-pointer"
            onClick={() => handleChangeLanguage("en")}
          >
            {t("language.en")}
          </a>
        </li>
        <li>
          <a
            className="cursor-pointer"
            onClick={() => handleChangeLanguage("vi")}
          >
            {t("language.vi")}
          </a>
        </li>
      </ul>
    </div>
  );
}

// currency
function Currency({ active, handleActive }) {
  return (
    <div className="tp-header-top-menu-item tp-header-currency">
      <span
        onClick={() => handleActive("currency")}
        className="tp-header-currency-toggle"
        id="tp-header-currency-toggle"
      >
        USD
      </span>
      <ul className={active === "currency" ? "tp-currency-list-open" : ""}>
        <li>
          <a href="#">EUR</a>
        </li>
        <li>
          <a href="#">CHF</a>
        </li>
        <li>
          <a href="#">GBP</a>
        </li>
        <li>
          <a href="#">KWD</a>
        </li>
      </ul>
    </div>
  );
}

// setting
function ProfileSetting({ active, handleActive }) {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const keycloak = useKeycloak();
  // handle logout — clear sensitive data before Keycloak redirect
  const handleLogout = () => {
    dispatch(userLoggedOut());
    try {
      localStorage.removeItem("cart_products");
      localStorage.removeItem("wishlist_items");
      localStorage.removeItem("compare_items");
      localStorage.removeItem("couponInfo");
      localStorage.removeItem("shipping_info");
    } catch (err) {
      // localStorage unavailable — continue with logout
    }
    keycloak.logout({ redirectUri: window.location.origin });
  };
  return (
    <div className="tp-header-top-menu-item tp-header-setting">
      <span
        onClick={() => handleActive("setting")}
        className="tp-header-setting-toggle"
        id="tp-header-setting-toggle"
      >
        {t("header.setting")}
      </span>
      <ul className={active === "setting" ? "tp-setting-list-open" : ""}>
        <li>
          <Link href="/profile">{t("header.myProfile")}</Link>
        </li>
        <li>
          <Link href="/wishlist">{t("header.wishlist")}</Link>
        </li>
        <li>
          <Link href="/cart">{t("header.cart")}</Link>
        </li>
        <li>
          {!user?.name && (
            <Link href="/login" className="cursor-pointer">
              {t("header.login")}
            </Link>
          )}
          {user?.name && (
            <a onClick={handleLogout} className="cursor-pointer">
              {t("header.logout")}
            </a>
          )}
        </li>
      </ul>
    </div>
  );
}

const HeaderTopRight = () => {
  const [active, setIsActive] = useState("");
  // handle active
  const handleActive = (type) => {
    if (type === active) {
      setIsActive("");
    } else {
      setIsActive(type);
    }
  };
  return (
    <div className="tp-header-top-menu d-flex align-items-center justify-content-end">
      <Language active={active} handleActive={handleActive} />
      <Currency active={active} handleActive={handleActive} />
      <ProfileSetting active={active} handleActive={handleActive} />
    </div>
  );
};

export default HeaderTopRight;
