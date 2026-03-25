import React from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { userLoggedOut } from "@/redux/features/auth/authSlice";
import { useKeycloak } from "@/components/providers/keycloak-provider";

// ── Sidebar icons ────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11.5" y="1" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="1" y="11.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11.5" y="11.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconOrders = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconCards = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 8h18" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconHistory = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconSetting = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 3H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 14l4-4-4-4M17 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Component ────────────────────────────────────────────────────────

const ProfileNavTab = ({ activeTab, setActiveTab }) => {
  const dispatch = useDispatch();
  const keycloak = useKeycloak();
  const { t } = useTranslation();

  const handleLogout = () => {
    dispatch(userLoggedOut());
    localStorage.removeItem("cart_products");
    localStorage.removeItem("wishlist_items");
    localStorage.removeItem("compare_items");
    localStorage.removeItem("couponInfo");
    localStorage.removeItem("shipping_info");
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const tabs = [
    { id: "dashboard", label: t("profile.dashboard"), icon: <IconDashboard /> },
    { id: "orders", label: t("profile.orderHistory"), icon: <IconOrders /> },
    { id: "cards", label: t("profile.cardsAddress"), icon: <IconCards /> },
    { id: "browsing", label: t("profile.browsingHistory"), icon: <IconHistory /> },
    { id: "setting", label: t("profile.setting"), icon: <IconSetting /> },
  ];

  return (
    <div className="cl-profile-sidebar">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`cl-profile-sidebar__item${activeTab === item.id ? " cl-profile-sidebar__item--active" : ""}`}
          onClick={() => setActiveTab(item.id)}
        >
          <span className="cl-profile-sidebar__icon">{item.icon}</span>
          <span className="cl-profile-sidebar__label">{item.label}</span>
        </button>
      ))}

      <div className="cl-profile-sidebar__divider" />

      <button
        type="button"
        className="cl-profile-sidebar__item cl-profile-sidebar__item--logout"
        onClick={handleLogout}
      >
        <span className="cl-profile-sidebar__icon"><IconLogout /></span>
        <span className="cl-profile-sidebar__label">{t("profile.logout")}</span>
      </button>
    </div>
  );
};

export default ProfileNavTab;
